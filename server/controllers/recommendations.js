// backend/controllers/recommendationsController.js
// Ensure these paths are correct relative to this file
const { db } = require("../firebase/firebase"); // Needed if you directly access db here
const { queryById } = require("../services/user"); // Assuming a user service with queryById
const { getAllBooks, getReadBookIdsByUserId } = require("../services/books"); // Assuming a book service with these methods
const {
  getUserBasedRecommendations,
  getItemBasedRecommendations,
  getPopularBooks, // Renamed from getPopularBooks (singular in mlService)
} = require("../services/mlService"); // Updated imports for specific functions

const recommendationsController = {
  // Changed to plural for consistency
  async getRecommendations(req, res) {
    try {
      // Assuming userId is attached to req.user by your authentication middleware
      const userId = req.user.uid; // Using .uid for Firebase Auth user ID

      const user = await queryById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      // Default to empty array if preferences or preferredGenres don't exist
      const userPreferredGenres = user.preferences?.preferredGenres || [];
      const userReadBookIds = await getReadBookIdsByUserId(userId);

      const allBooks = await getAllBooks(); // Needed for content-based filtering

      let recommendedBooks = [];
      const recommendedBookIdsSet = new Set(); // To ensure uniqueness and avoid re-recommending read books

      // Target number of recommendations
      const MIN_FINAL_RECOMMENDATIONS = 5;
      const MAX_HYBRID_POOL_SIZE = 10; // Get more than needed for the pool before final slicing

      // --- 1. Content-Based Recommendations (from preferred genres) ---
      if (
        userPreferredGenres.length > 0 &&
        recommendedBooks.length < MAX_HYBRID_POOL_SIZE
      ) {
        const genreBasedRecs = allBooks.filter(
          (book) =>
            userPreferredGenres.includes(book.category?.genre) && // Accessing genre through category
            !userReadBookIds.includes(book.id) &&
            !recommendedBookIdsSet.has(book.id)
        );
        // Take a few top genre matches
        genreBasedRecs.slice(0, 3).forEach((book) => {
          // Limit initial content-based contribution
          if (recommendedBooks.length < MAX_HYBRID_POOL_SIZE) {
            recommendedBooks.push(book);
            recommendedBookIdsSet.add(book.id);
          }
        });
      }

      // --- 2. User-Based Collaborative Filtering Recommendations ---
      if (recommendedBooks.length < MAX_HYBRID_POOL_SIZE) {
        const userBasedRecs = await getUserBasedRecommendations(
          userId,
          MAX_HYBRID_POOL_SIZE
        ); // Get more than needed
        userBasedRecs.forEach((book) => {
          if (
            !userReadBookIds.includes(book.id) &&
            !recommendedBookIdsSet.has(book.id)
          ) {
            if (recommendedBooks.length < MAX_HYBRID_POOL_SIZE) {
              recommendedBooks.push(book);
              recommendedBookIdsSet.add(book.id);
            }
          }
        });
      }

      // --- 3. Item-Based Collaborative Filtering Recommendations ---
      if (recommendedBooks.length < MAX_HYBRID_POOL_SIZE) {
        const itemBasedRecs = await getItemBasedRecommendations(
          userId,
          MAX_HYBRID_POOL_SIZE
        ); // Get more than needed
        itemBasedRecs.forEach((book) => {
          if (
            !userReadBookIds.includes(book.id) &&
            !recommendedBookIdsSet.has(book.id)
          ) {
            if (recommendedBooks.length < MAX_HYBRID_POOL_SIZE) {
              recommendedBooks.push(book);
              recommendedBookIdsSet.add(book.id);
            }
          }
        });
      }

      // --- 4. Fallback to Popular Books (if still not enough unique recommendations) ---
      // This ensures we always return at least MIN_FINAL_RECOMMENDATIONS
      if (recommendedBooks.length < MIN_FINAL_RECOMMENDATIONS) {
        const popularBooks = await getPopularBooks(MAX_HYBRID_POOL_SIZE); // Fetch a few popular ones
        popularBooks.forEach((book) => {
          if (
            !userReadBookIds.includes(book.id) &&
            !recommendedBookIdsSet.has(book.id)
          ) {
            if (recommendedBooks.length < MIN_FINAL_RECOMMENDATIONS) {
              // Only add if we need to fill up
              recommendedBooks.push(book);
              recommendedBookIdsSet.add(book.id);
            }
          }
        });
      }

      // Final sorting (optional, depending on how you want to prioritize the hybrid results)
      // For now, order is based on how they were added (content-based, then user-based, then item-based, then popular).
      // You could add a scoring mechanism here if desired.

      // Ensure final output is exactly MIN_FINAL_RECOMMENDATIONS or less if not enough unique found
      res.json(recommendedBooks.slice(0, MIN_FINAL_RECOMMENDATIONS));
    } catch (error) {
      console.error("Error in getRecommendations:", error);
      // More specific error handling if certain services fail
      res
        .status(500)
        .json({ error: error.message || "Failed to get recommendations" });
    }
  },
};

module.exports = recommendationsController; // Changed to plural for consistency
