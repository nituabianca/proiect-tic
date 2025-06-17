const { db, admin } = require("../firebase/firebase");
const { deleteCache } = require("../utils/cache");
const statisticsService = require("./statistics"); // Standardized name
const bookService = require("./books"); // Import bookService to check for book existence

const addOrUpdateBookRating = async (userId, bookId, rating, reviewText) => {
  // 1. Validate that the book exists before doing anything else.
  const book = await bookService.getBookById(bookId);
  if (!book) {
    const error = new Error("Book not found.");
    error.statusCode = 404;
    throw error;
  }

  const ratingRef = db.collection("ratings").doc(`${userId}_${bookId}`);
  const ratingData = {
    userId,
    bookId,
    rating: parseFloat(rating),
    reviewText: reviewText || null,
    // Using server timestamps for reliability
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // 2. Set the rating
  await ratingRef.set(ratingData, { merge: true });

  // 3. Trigger statistics recalculation (this is a great pattern)
  // These can run in parallel without waiting for each other.
  const userStatsPromise = statisticsService.calculateAndSetAverageRating(userId);
  const bookStatsPromise = statisticsService.calculateAndSetBookAverageRating(bookId);
  await Promise.all([userStatsPromise, bookStatsPromise]);

  // 4. Invalidate all relevant caches. This is the single source of truth for this side effect.
  console.log(`Invalidating caches for rating update: user ${userId}, book ${bookId}`);
  deleteCache(`user_ratings_map_${userId}`);
  deleteCache(`all_ratings`);
  deleteCache(`user_based_recommendations_${userId}`);
  deleteCache(`item_based_recommendations_${userId}`);
  deleteCache(`similar_users_${userId}`);
  deleteCache(`similar_books_${bookId}`);
  deleteCache(`user_statistics_${userId}`);
  deleteCache(`book_statistics_${bookId}`);
  deleteCache("popular_books_10"); // Use a consistent key

  return { id: ratingRef.id, ...ratingData };
};

const getUserRatings = async (userId) => {
  try {
    const snapshot = await db
      .collection("ratings")
      .where("userId", "==", userId)
      .get();
    const ratings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return ratings;
  } catch (error) {
    console.error("Error fetching user ratings:", error);
    throw new Error("Failed to fetch user ratings");
  }
};

// NEW: Function to get all ratings for a specific book
const getRatingsForBook = async (bookId) => {
  try {
    const snapshot = await db
      .collection("ratings")
      .where("bookId", "==", bookId)
      .get();
    const ratings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return ratings;
  } catch (error) {
    console.error(`Error fetching ratings for book ${bookId}:`, error);
    throw new Error(`Failed to fetch ratings for book ${bookId}`);
  }
};

module.exports = {
  addOrUpdateBookRating,
  getUserRatings,
  getRatingsForBook, // Export the new function
};
