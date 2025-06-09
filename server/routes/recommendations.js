// backend/routes/recommendation.js
const express = require("express");
const recommendationsController = require("../controllers/recommendations"); // Corrected name
const authMiddleware = require("../middlewares/auth"); // Assuming this path is correct

const router = express.Router();

// This route serves the personalized/hybrid recommendations for the authenticated user.
router.get("/", authMiddleware, recommendationsController.getRecommendations);

module.exports = router;
