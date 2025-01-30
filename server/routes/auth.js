const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { authMiddleware } = require("../middlewares/auth");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify/resend", authController.resendVerificationEmail);
router.get("/verify/check", authController.checkVerificationStatus);
router.post("/verify/sync", authController.syncVerificationStatus);

// Protected routes
router.get("/profile", authMiddleware, authController.getProfile);
router.post("/verify", authMiddleware, authController.verifyEmail);
router.get(
  "/verify/status",
  authMiddleware,
  authController.getVerificationStatus
);
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;
