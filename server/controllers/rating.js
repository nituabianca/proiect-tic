const ratingService = require("../services/rating");

const ratingController = {
  async addOrUpdateRating(req, res) {
    try {
      const userId = req.user.id; // Correctly using 'id' from our JWT payload
      const { bookId } = req.params;
      const { rating, reviewText } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "A rating between 1 and 5 is required." });
      }

      const newRating = await ratingService.addOrUpdateBookRating(userId, bookId, rating, reviewText);
      res.status(201).json({ message: "Rating added/updated successfully", rating: newRating });
    } catch (error) {
      // The service will throw a 404 error if the book isn't found
      if (error.statusCode === 404) {
        return res.status(404).json({ error: error.message });
      }
      console.error("Error in addOrUpdateRating:", error);
      res.status(500).json({ error: "Failed to add/update rating" });
    }
  },

  async getUserRatings(req, res) {
    try {
      // The middleware has already verified permission.
      // The controller just needs to get the userId from the URL.
      const ratings = await ratingService.getUserRatings(req.params.userId);
      res.status(200).json(ratings);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user ratings" });
    }
  },

  async getRatingsForBook(req, res) {
    try {
      const ratings = await ratingService.getRatingsForBook(req.params.bookId);
      res.status(200).json(ratings);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve ratings for book" });
    }
  },
};

module.exports = ratingController;
