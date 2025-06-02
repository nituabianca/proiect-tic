// backend/services/ratingService.js
const { db } = require("../firebase/firebase");
const { deleteCache } = require("../utils/cache"); // Make sure this is imported if not already
const statisticsService = require("./statistics"); // Import statisticsService

const addOrUpdateBookRating = async (userId, bookId, rating, reviewText) => {
  try {
    const ratingRef = db.collection("ratings").doc(`${userId}_${bookId}`); // Unique ID for user-book rating
    const ratingData = {
      userId,
      bookId,
      rating: parseFloat(rating), // Ensure rating is a number
      reviewText: reviewText || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await ratingRef.set(ratingData, { merge: true }); // Use merge to update if exists

    // After adding/updating a rating, recalculate average for the user and book
    await statisticsService.calculateAndSetAverageRating(userId);
    await statisticsService.calculateAndSetBookAverageRating(bookId); // New function to calculate book's average

    return { id: ratingRef.id, ...ratingData };
  } catch (error) {
    console.error("Error adding or updating book rating:", error);
    throw new Error("Failed to add or update book rating");
  }
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
