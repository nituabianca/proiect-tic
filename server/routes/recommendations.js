const express = require("express");
const recommendationsController = require("../controllers/recommendationsController");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

// A logged-in user gets their own personalized list of recommendations.
router.get("/", verifyToken, recommendationsController.getRecommendations);

module.exports = router;
