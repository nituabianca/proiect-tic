const express = require("express");
const ratingController = require("../controllers/rating");
const { verifyToken, isOwnerOrAdmin } = require("../middleware/auth");

const router = express.Router();

// --- Public Route ---
// Anyone can view the ratings for a specific book.
router.get("/book/:bookId", ratingController.getRatingsForBook);


// --- Authenticated User Routes ---

// A logged-in user can add or update their own rating for a book.
// Using PUT for consistency, as the service handles both create and update.
router.put("/book/:bookId", verifyToken, ratingController.addOrUpdateRating);

// A user can get their own ratings, or an admin can get any user's ratings.
// Our isOwnerOrAdmin middleware is perfect for this.
router.get("/user/:userId", [verifyToken, isOwnerOrAdmin], ratingController.getUserRatings);

module.exports = router;
