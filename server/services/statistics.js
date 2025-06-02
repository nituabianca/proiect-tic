// backend/services/statisticsService.js
const { db } = require("../firebase/firebase");
const { getCache, setCache, deleteCache } = require("../utils/cache");

const USER_STATISTICS_CACHE_TTL = 1 * 60 * 60 * 1000; // Cache user stats for 1 hour
const BOOK_STATISTICS_CACHE_TTL = 2 * 60 * 60 * 1000; // Cache book stats for 2 hours

const calculateAndSetAverageRating = async (userId) => {
  // ... (unchanged code for user average rating)
  try {
    const ratingsSnapshot = await db
      .collection("ratings")
      .where("userId", "==", userId)
      .get();
    let totalRating = 0;
    let numberOfRatings = 0;

    ratingsSnapshot.forEach((doc) => {
      totalRating += doc.data().rating;
      numberOfRatings++;
    });

    const averageRating =
      numberOfRatings > 0 ? totalRating / numberOfRatings : 0;

    await db
      .collection("users")
      .doc(userId)
      .update({
        averageRating: parseFloat(averageRating.toFixed(2)),
        numberOfRatings: numberOfRatings,
      });

    deleteCache(`user_statistics_${userId}`);
    return { averageRating, numberOfRatings };
  } catch (error) {
    console.error("Error calculating and setting user average rating:", error);
    throw new Error("Failed to calculate and set user average rating");
  }
};

const calculateAndSetBookAverageRating = async (bookId) => {
  // ... (unchanged code for book average rating)
  try {
    const ratingsSnapshot = await db
      .collection("ratings")
      .where("bookId", "==", bookId)
      .get();
    let totalRating = 0;
    let numberOfRatings = 0;

    ratingsSnapshot.forEach((doc) => {
      totalRating += doc.data().rating;
      numberOfRatings++;
    });

    const averageRating =
      numberOfRatings > 0 ? totalRating / numberOfRatings : 0;

    await db
      .collection("books")
      .doc(bookId)
      .update({
        averageRating: parseFloat(averageRating.toFixed(2)),
        numRatings: numberOfRatings,
      });

    // Invalidate caches related to this book's stats and possibly popularity
    deleteCache(`book_statistics_${bookId}`);
    deleteCache(`similar_books_${bookId}`);
    deleteCache("popular_books_5");

    return { averageRating, numberOfRatings };
  } catch (error) {
    console.error("Error calculating and setting book average rating:", error);
    throw new Error("Failed to calculate and set book average rating");
  }
};

const getUserStatistics = async (userId) => {
  const cacheKey = `user_statistics_${userId}`;
  let userStats = getCache(cacheKey);

  if (userStats) {
    return userStats;
  }

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();

    const readBooksSnapshot = await db
      .collection("user_book_progress")
      .where("userId", "==", userId)
      .where("status", "==", "completed")
      .get();
    const booksRead = readBooksSnapshot.size;

    const averageRating = userData.averageRating || 0;
    const numberOfRatings = userData.numberOfRatings || 0;

    const ordersSnapshot = await db
      .collection("orders")
      .where("userId", "==", userId)
      .get();
    const totalOrders = ordersSnapshot.size;

    userStats = {
      userId: userId,
      booksRead: booksRead,
      averageRating: averageRating,
      numberOfRatings: numberOfRatings,
      totalOrders: totalOrders,
    };

    setCache(cacheKey, userStats, USER_STATISTICS_CACHE_TTL);
    return userStats;
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    throw new Error("Failed to fetch user statistics");
  }
};

// NOUĂ FUNCȚIE: Obține statisticile unei cărți (cu caching)
const getBookStatistics = async (bookId) => {
  const cacheKey = `book_statistics_${bookId}`;
  let bookStats = getCache(cacheKey);

  if (bookStats) {
    return bookStats;
  }

  try {
    const bookDoc = await db.collection("books").doc(bookId).get();
    if (!bookDoc.exists) {
      return null; // Cartea nu a fost găsită
    }

    const bookData = bookDoc.data();

    // Presupunem că averageRating și numRatings sunt deja calculate și stocate pe documentul cărții
    // de funcția calculateAndSetBookAverageRating
    const averageRating = bookData.averageRating || 0;
    const numRatings = bookData.numRatings || 0; // numRatings este numărul total de ratinguri pentru carte

    // Poți adăuga și alte statistici relevante pentru carte, de exemplu:
    // Câte ori a fost achiziționată (ar necesita o interogare în colecția de comenzi)
    // const ordersSnapshot = await db.collection("orders")
    //                               .where("items.bookId", "array-contains", bookId) // Sau o interogare mai complexă
    //                               .get();
    // const totalPurchases = ordersSnapshot.size;

    bookStats = {
      bookId: bookId,
      averageRating: averageRating,
      numRatings: numRatings,
      // totalPurchases: totalPurchases // Dacă adaugi logica
    };

    setCache(cacheKey, bookStats, BOOK_STATISTICS_CACHE_TTL);
    return bookStats;
  } catch (error) {
    console.error("Error fetching book statistics:", error);
    throw new Error("Failed to fetch book statistics");
  }
};

module.exports = {
  calculateAndSetAverageRating,
  calculateAndSetBookAverageRating,
  getUserStatistics,
  getBookStatistics, // Exportă noua funcție
};
