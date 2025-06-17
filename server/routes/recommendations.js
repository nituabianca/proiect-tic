const express = require("express");
const recommendationsController = require("../controllers/recommendationsController");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

// Personalized recommendations for the logged-in user's homepage.
router.get("/", verifyToken, recommendationsController.getRecommendations);

// Public route to get books similar to a specific book (for "More Like This").
router.get("/similar-to/:bookId", recommendationsController.getSimilarBooks);

module.exports = router;
