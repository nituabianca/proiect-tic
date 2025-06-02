const express = require("express");
const userController = require("../controllers/users");
const authMiddleware = require("../middlewares/auth");
const adminMiddleware = require("../middlewares/admin");
const userMiddleware = require("../middlewares/user"); // Correct import path

const router = express.Router();

// Admin-only routes
router.get("/", authMiddleware, adminMiddleware, userController.getAllUsers);
router.get("/:id", authMiddleware, adminMiddleware, userController.getUserById);
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  userController.deleteUser
);
// User-specific routes (user can only update their own profile)
router.put("/:id", authMiddleware, userMiddleware, userController.updateUser); // Correctly uses userMiddleware for self-access/admin access

module.exports = router;
