const express = require("express");
const authController = require("../controllers/auth");
const authMiddleware = require("../middlewares/auth"); // Correct import path

const router = express.Router();

// Public routes for authentication
router.post("/register", authController.register); // No auth needed
router.post("/login", authController.login); // No auth needed

// Protected routes for user profile
router.get("/profile", authMiddleware, authController.getProfile); // Correctly protected by authMiddleware
router.post("/logout", authMiddleware, authController.logout); // Correctly protected by authMiddleware

module.exports = router;
