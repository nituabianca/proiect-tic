const express = require("express");
const devController = require("../controllers/devController");
const { verifyToken, isAdmin } = require("../middlewares/auth");

const router = express.Router();
const adminOnly = [verifyToken, isAdmin]; // Middleware array for brevity

// All-in-one routes
router.post("/reset-database", adminOnly, devController.resetDatabase);
router.post("/seed-database", adminOnly, devController.seedDatabase);

// Individual Seeding Routes
router.post("/seed/books", adminOnly, devController.seedBooks);
router.post("/seed/users", adminOnly, devController.seedUsers);
router.post("/seed/orders", adminOnly, devController.seedOrders);

// Individual Deletion Routes
router.delete("/delete/books", adminOnly, devController.deleteBooks);
router.delete("/delete/users", adminOnly, devController.deleteUsers);
router.delete("/delete/orders", adminOnly, devController.deleteOrders);
router.delete("/delete/ratings", adminOnly, devController.deleteRatings);

module.exports = router;