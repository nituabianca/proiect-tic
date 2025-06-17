const express = require("express");
const authController = require("../controllers/auth"); // Using consistent naming
// CORRECT IMPORT: Destructure to get the exact `verifyToken` function you need.
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

// --- Public Routes ---
// These do not need middleware.
router.post("/register", authController.register);
router.post("/login", authController.login);


// --- Protected Routes ---
// These routes now correctly use the `verifyToken` FUNCTION.
router.get("/profile", verifyToken, authController.getProfile);
router.post("/logout", verifyToken, authController.logout);


module.exports = router;