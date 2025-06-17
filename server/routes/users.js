const express = require("express");
const userController = require("../controllers/users"); // Correct controller name
const { verifyToken, isAdmin, isOwnerOrAdmin } = require("../middlewares/auth");

const router = express.Router();

// --- ADMIN ONLY ROUTES ---
// Get a list of all users
router.get("/", verifyToken, isAdmin, userController.getAllUsers);

// Delete any user
router.delete("/:id", verifyToken, isAdmin, userController.deleteUser);


// --- OWNER OR ADMIN ROUTES ---
// Get a specific user's profile (either your own, or any user if you're an admin)
router.get("/:id", verifyToken, isOwnerOrAdmin, userController.getUserById);

// Update a specific user's profile (either your own, or any user if you're an admin)
router.put("/:id", verifyToken, isOwnerOrAdmin, userController.updateUser);


module.exports = router;
