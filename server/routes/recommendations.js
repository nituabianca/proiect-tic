const express = require("express");
const recommendationController = require("../controllers/recommendations");
const authMiddleware = require("../middlewares/auth");

const router = express.Router();

router.get("/", authMiddleware, recommendationController.getRecommendations);

module.exports = router;
