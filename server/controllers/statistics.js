// backend/controllers/statisticsController.js
const statisticsService = require("../services/statistics"); // Standardized name

const statisticsController = {
  async getUserStatistics(req, res) {
    try {
      // The user ID comes securely from the JWT payload.
      // No need to re-validate if the user exists; the service will handle it.
      const userId = req.user.id;
      const userStats = await statisticsService.getUserStatistics(userId);

      if (!userStats) {
        return res.status(404).json({ error: "Statistics not found for this user." });
      }
      res.status(200).json(userStats);
    } catch (error) {
      console.error("Error in getUserStatistics:", error);
      res.status(500).json({ error: "Failed to retrieve user statistics" });
    }
  },

  async getBookStatistics(req, res) {
    try {
      const { bookId } = req.params;
      // No need to check if the book exists here. The service will handle it.
      const bookStats = await statisticsService.getBookStatistics(bookId);

      if (!bookStats) {
        return res.status(404).json({ error: "Statistics not found for this book." });
      }
      res.status(200).json(bookStats);
    } catch (error) {
      console.error("Error in getBookStatistics:", error);
      res.status(500).json({ error: "Failed to retrieve book statistics" });
    }
  },
};

module.exports = statisticsController;
