// backend/controllers/statisticsController.js
const statisticsService = require("../services/statistics");
const { queryById } = require("../services/user"); // Pentru a verifica existența utilizatorului
const { queryBookById } = require("../services/books"); // Pentru a verifica existența cărții

const statisticsController = {
  // NOU: Metodă pentru a obține statisticile unui utilizator
  async getUserStatistics(req, res) {
    try {
      // req.user.uid este setat de authMiddleware
      const userId = req.user.uid;

      // Opțional: O verificare suplimentară dacă utilizatorul chiar există (deși authMiddleware ar trebui să o facă)
      const user = await queryById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      const userStats = await statisticsService.getUserStatistics(userId);

      if (!userStats) {
        return res
          .status(404)
          .json({ error: "Statistics not found for this user." });
      }

      res.json(userStats);
    } catch (error) {
      console.error("Error in getUserStatistics:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to retrieve user statistics" });
    }
  },

  async getBookStatistics(req, res) {
    try {
      const { bookId } = req.params;

      if (!bookId) {
        return res.status(400).json({ error: "Book ID is required." });
      }

      // Verifică dacă cartea există
      const book = await queryBookById(bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found." });
      }

      const bookStats = await statisticsService.getBookStatistics(bookId);

      if (!bookStats) {
        return res
          .status(404)
          .json({ error: "Statistics not found for this book." });
      }

      res.json(bookStats);
    } catch (error) {
      console.error("Error in getBookStatistics:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to retrieve book statistics" });
    }
  },
};

module.exports = statisticsController;
