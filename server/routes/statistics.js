const express = require("express");
const statisticsController = require("../controllers/statistics");
const authMiddleware = require("../middlewares/auth");

const router = express.Router();

router.get("/my-stats", authMiddleware, statisticsController.getUserStatistics); // Correct

// NOUĂ RUTĂ: Oricine poate obține statisticile unei cărți
router.get("/books/:bookId", statisticsController.getBookStatistics); // Public access - Correct
// Dacă vrei să fie protejată de admin:
// router.get('/books/:bookId', authMiddleware, adminMiddleware, statisticsController.getBookStatistics); // (Commented out, but correct usage if enabled)

module.exports = router;
