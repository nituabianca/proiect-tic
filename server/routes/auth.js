const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { authMiddleware } = require("../middlewares/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.use(authMiddleware);
router.post("/logout", authController.logout);
router.get("/profile", authController.getProfile);

module.exports = router;
