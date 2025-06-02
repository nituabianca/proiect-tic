// backend/controllers/ratingController.js
const ratingService = require("../services/rating");
const statisticsService = require("../services/statistics");
const { queryBookById } = require("../services/books"); // Needed to ensure book exists
const { deleteCache } = require("../utils/cache");

const ratingController = {
  async addOrUpdateRating(req, res) {
    try {
      const userId = req.user.uid;
      const { bookId } = req.params;
      const { rating, reviewText } = req.body;

      if (!bookId || !rating) {
        return res
          .status(400)
          .json({ error: "Book ID and rating are required." });
      }
      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: "Rating must be between 1 and 5." });
      }

      // Check if book exists
      const book = await queryBookById(bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found." });
      }

      const newRating = await ratingService.addOrUpdateBookRating(
        userId,
        bookId,
        rating,
        reviewText
      );

      // Invalidate relevant caches related to recommendations and user/book stats
      deleteCache(`user_ratings_map_${userId}`);
      deleteCache(`all_ratings`); // All ratings changed
      deleteCache(`user_based_recommendations_${userId}`); // User's recommendations potentially changed
      deleteCache(`item_based_recommendations_${userId}`); // Item-based recs potentially changed
      deleteCache(`similar_users_${userId}`); // User's similar users might change
      deleteCache(`similar_books_${bookId}`); // Book's similar books might change
      deleteCache(`user_statistics_${userId}`); // User stats (average rating changed)
      deleteCache(`book_statistics_${bookId}`); // NEW: Cache key for book average rating
      deleteCache("popular_books_5"); // If popularity is based on numRatings/avgRating

      res.status(201).json({
        message: "Rating added/updated successfully",
        rating: newRating,
      });
    } catch (error) {
      console.error("Error in addOrUpdateRating:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to add/update rating" });
    }
  },

  async getUserRatings(req, res) {
    try {
      const userId = req.params.userId || req.user.uid; // Allow admin to fetch other user ratings

      const ratings = await ratingService.getUserRatings(userId);
      res.json(ratings);
    } catch (error) {
      console.error("Error in getUserRatings:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to get user ratings" });
    }
  },

  // NEW: Controller method to get all ratings for a specific book
  async getRatingsForBook(req, res) {
    try {
      const { bookId } = req.params;
      if (!bookId) {
        return res.status(400).json({ error: "Book ID is required." });
      }

      // Optional: Check if book exists before fetching ratings
      const book = await queryBookById(bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found." });
      }

      const ratings = await ratingService.getRatingsForBook(bookId);
      res.json(ratings);
    } catch (error) {
      console.error("Error in getRatingsForBook:", error);
      res.status(500).json({
        error: error.message || "Failed to retrieve ratings for book",
      });
    }
  },
};

module.exports = ratingController;
