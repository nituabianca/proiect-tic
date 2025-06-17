// backend/services/statisticsService.js
const { db, admin } = require("../firebase/firebase");
const { getCache, setCache, deleteCache } = require("../utils/cache");

const USER_STATS_CACHE_TTL = 3600 * 1000; // Cache user stats for 1 hour
const BOOK_STATS_CACHE_TTL = 2 * 3600 * 1000; // Cache book stats for 2 hours

// =================================================================
// SECTION: Read/Get Functions (Called by the Controller)
// =================================================================

/**
 * Assembles and returns a comprehensive statistics object for a given user.
 * Implements caching for high performance.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object|null>} The user's statistics object or null if not found.
 */
const getUserStatistics = async (userId) => {
  const cacheKey = `user_statistics_${userId}`;
  const cachedStats = getCache(cacheKey);
  if (cachedStats) {
    console.log(`[Cache] HIT for user statistics: ${userId}`);
    return cachedStats;
  }
  console.log(`[Cache] MISS for user statistics: ${userId}. Fetching from DB.`);

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }
    const userData = userDoc.data();

    // Although some stats are on the user doc, we perform live counts
    // here to ensure the API endpoint always provides the freshest possible data.
    // This is a trade-off for accuracy over performance, mitigated by caching.

    // 1. Get total books read
    const progressSnapshot = await db
      .collection("user_book_progress")
      .where("userId", "==", userId)
      .where("status", "==", "completed")
      .get();

    // 2. Get total orders
    const ordersSnapshot = await db
      .collection("orders")
      .where("userId", "==", userId)
      .get();

    // 3. Assemble the final statistics object
    const userStats = {
      userId: userId,
      booksRead: progressSnapshot.size,
      totalOrders: ordersSnapshot.size,
      // Pull denormalized stats directly from the user document
      averageRating: userData.stats?.averageRatingGiven ?? 0,
      numberOfRatings: userData.stats?.totalBooksRead ?? 0, // Assuming totalBooksRead is numRatings
      loyaltyPoints: userData.stats?.loyaltyPoints ?? 0,
    };

    setCache(cacheKey, userStats, USER_STATS_CACHE_TTL);
    return userStats;

  } catch (error) {
    console.error(`Error fetching user statistics for ${userId}:`, error);
    throw new Error("Failed to fetch user statistics");
  }
};

/**
 * Assembles and returns a statistics object for a given book.
 * @param {string} bookId - The ID of the book.
 * @returns {Promise<object|null>} The book's statistics object or null if not found.
 */
const getBookStatistics = async (bookId) => {
  const cacheKey = `book_statistics_${bookId}`;
  const cachedStats = getCache(cacheKey);
  if (cachedStats) {
    console.log(`[Cache] HIT for book statistics: ${bookId}`);
    return cachedStats;
  }
  console.log(`[Cache] MISS for book statistics: ${bookId}. Fetching from DB.`);

  try {
    const bookDoc = await db.collection("books").doc(bookId).get();
    if (!bookDoc.exists) {
      return null;
    }
    const bookData = bookDoc.data();

    // These stats are calculated and stored on the book document itself.
    const bookStats = {
      bookId: bookId,
      averageRating: bookData.averageRating ?? 0,
      numberOfRatings: bookData.numRatings ?? 0,
    };

    setCache(cacheKey, bookStats, BOOK_STATS_CACHE_TTL);
    return bookStats;

  } catch (error) {
    console.error(`Error fetching book statistics for ${bookId}:`, error);
    throw new Error("Failed to fetch book statistics");
  }
};


// =================================================================
// SECTION: Calculate/Write Functions (Called by other Services)
// =================================================================

/**
 * Recalculates and updates the average rating and number of ratings for a user.
 * This function should be called by `ratingService` after a rating is added/updated.
 * @param {string} userId - The ID of the user to update.
 */
const updateUserRatingStats = async (userId) => {
  try {
    const ratingsSnapshot = await db.collection("ratings").where("userId", "==", userId).get();

    const numberOfRatings = ratingsSnapshot.size;
    let totalRating = 0;
    ratingsSnapshot.forEach((doc) => {
      totalRating += doc.data().rating;
    });

    const averageRating = numberOfRatings > 0 ? totalRating / numberOfRatings : 0;

    // Update the 'stats' map in the user document
    await db.collection("users").doc(userId).update({
      "stats.averageRatingGiven": parseFloat(averageRating.toFixed(2)),
      "stats.totalBooksRead": numberOfRatings, // Assuming this field represents number of ratings
    });

    // Invalidate the cache for this user's stats
    deleteCache(`user_statistics_${userId}`);
    console.log(`[Cache] User stats invalidated for ${userId} due to new rating.`);

  } catch (error) {
    console.error(`Error updating user rating stats for ${userId}:`, error);
    // We don't re-throw here to avoid breaking the parent operation (e.g., adding a rating)
  }
};

/**
 * Recalculates and updates the average rating and number of ratings for a book.
 * This function should be called by `ratingService` after a rating is added/updated.
 * @param {string} bookId - The ID of the book to update.
 */
const updateBookRatingStats = async (bookId) => {
  try {
    const ratingsSnapshot = await db.collection("ratings").where("bookId", "==", bookId).get();

    const numRatings = ratingsSnapshot.size;
    let totalRating = 0;
    ratingsSnapshot.forEach((doc) => {
      totalRating += doc.data().rating;
    });

    const averageRating = numRatings > 0 ? totalRating / numRatings : 0;

    await db.collection("books").doc(bookId).update({
      averageRating: parseFloat(averageRating.toFixed(2)),
      numRatings: numRatings,
    });

    // Invalidate caches that depend on this book's rating
    deleteCache(`book_statistics_${bookId}`);
    deleteCache("popular_books_10");
    deleteCache(`all_books`); // The book's data is now stale in the 'all_books' cache
    console.log(`[Cache] Book stats invalidated for ${bookId} due to new rating.`);

  } catch (error) {
    console.error(`Error updating book rating stats for ${bookId}:`, error);
  }
};

module.exports = {
  // Functions for controllers
  getUserStatistics,
  getBookStatistics,
  // Functions for other services
  updateUserRatingStats,
  updateBookRatingStats,
};
