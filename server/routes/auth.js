const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { authMiddleware } = require("../middlewares/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify/resend", authController.resendVerificationEmail);
router.get("/verify/check", authController.checkVerificationStatus);
router.post("/verify/sync", authController.syncVerificationStatus);

router.use(authMiddleware);
router.get("/profile", authController.getProfile);
router.post("/verify", authController.verifyEmail);
router.get("/verify/status", authController.getVerificationStatus);
router.post("/logout", authController.logout);

module.exports = router;
