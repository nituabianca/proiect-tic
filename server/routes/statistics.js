const express = require("express");
const statisticsController = require("../controllers/statistics");
const { verifyToken, isAdmin } = require("../middlewares/auth");

const router = express.Router();

// --- Public Route ---
// Anyone can get the basic statistics for a book (e.g., average rating, number of ratings).
router.get("/books/:bookId", statisticsController.getBookStatistics);


// --- Authenticated User Route ---
// A logged-in user can get their own detailed statistics (books read, etc.).
router.get("/my-stats", verifyToken, statisticsController.getUserStatistics);


// --- Example Admin Route (for future use) ---
// An admin could potentially get site-wide statistics.
/*
router.get("/site-overview", [verifyToken, isAdmin], statisticsController.getSiteOverview);
*/


module.exports = router;