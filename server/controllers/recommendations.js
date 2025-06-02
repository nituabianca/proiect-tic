// backend/controllers/recommendationController.js
const { db } = require("../firebase/firebase");
const { queryById } = require("../services/user");
const { getAllBooks, getReadBookIdsByUserId } = require("../services/books");
const {
  getUserBasedRecommendations,
  getItemBasedRecommendations,
  getPopularBooks,
} = require("../services/mlService"); // Updated imports

const recommendationController = {
  async getRecommendations(req, res) {
    try {
      const userId = req.user.uid;
      const user = await queryById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      const userPreferredGenres = user.preferences?.preferredGenres || [];
      const userReadBookIds = await getReadBookIdsByUserId(userId);

      const allBooks = await getAllBooks();

      let recommendedBooks = [];
      const recommendedBookIdsSet = new Set(); // To ensure uniqueness

      // 1. Content-Based Recommendations (from preferred genres)
      if (userPreferredGenres.length > 0) {
        const genreBasedRecs = allBooks.filter(
          (book) =>
            userPreferredGenres.includes(book.genre) &&
            !userReadBookIds.includes(book.id) &&
            !recommendedBookIdsSet.has(book.id)
        );
        genreBasedRecs.forEach((book) => {
          if (recommendedBooks.length < 10) {
            // Keep a larger pool for filtering
            recommendedBooks.push(book);
            recommendedBookIdsSet.add(book.id);
          }
        });
      }

      // 2. User-Based Collaborative Filtering Recommendations
      if (recommendedBooks.length < 10) {
        const userBasedRecs = await getUserBasedRecommendations(userId, 10); // Get more than needed
        userBasedRecs.forEach((book) => {
          if (
            !userReadBookIds.includes(book.id) &&
            !recommendedBookIdsSet.has(book.id)
          ) {
            if (recommendedBooks.length < 10) {
              recommendedBooks.push(book);
              recommendedBookIdsSet.add(book.id);
            }
          }
        });
      }

      // 3. Item-Based Collaborative Filtering Recommendations
      if (recommendedBooks.length < 10) {
        const itemBasedRecs = await getItemBasedRecommendations(userId, 10); // Get more than needed
        itemBasedRecs.forEach((book) => {
          if (
            !userReadBookIds.includes(book.id) &&
            !recommendedBookIdsSet.has(book.id)
          ) {
            if (recommendedBooks.length < 10) {
              recommendedBooks.push(book);
              recommendedBookIdsSet.add(book.id);
            }
          }
        });
      }

      // 4. Fallback to Popular Books (if still not enough unique recommendations)
      if (recommendedBooks.length < 5) {
        // Aim for at least 5 final recommendations
        const popularBooks = await getPopularBooks(10); // Fetch a few popular ones
        popularBooks.forEach((book) => {
          if (
            !userReadBookIds.includes(book.id) &&
            !recommendedBookIdsSet.has(book.id)
          ) {
            if (recommendedBooks.length < 5) {
              // Only add if we need to fill up to 5
              recommendedBooks.push(book);
              recommendedBookIdsSet.add(book.id);
            }
          }
        });
      }

      // Final sorting and limit to 5 unique recommendations
      // You might want a more sophisticated ranking here, e.g., combining scores
      // For now, let's just ensure they are unique and limited to 5.
      res.json(recommendedBooks.slice(0, 5));
    } catch (error) {
      console.error("Error in getRecommendations:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to get recommendations" });
    }
  },
};

module.exports = recommendationController;
