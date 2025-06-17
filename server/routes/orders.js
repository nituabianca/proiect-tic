const express = require("express");
const orderController = require("../controllers/orders");
const { verifyToken, isAdmin, isOrderOwnerOrAdmin } = require("../middlewares/auth");

const router = express.Router();

// --- AUTHENTICATED USER ROUTES ---

// Create a new order
router.post("/", verifyToken, orderController.createOrder);

// Get the logged-in user's own orders
router.get("/my-orders", verifyToken, orderController.getMyOrders);

// Get a specific order by its ID (if you are the owner or an admin)
router.get("/:id", verifyToken, isOrderOwnerOrAdmin, orderController.getOrderById);


// --- ADMIN-ONLY ROUTES ---

// Get a list of ALL orders in the system
router.get("/", verifyToken, isAdmin, orderController.getAllOrders);

// Get all orders for a specific user by their user ID
router.get("/user/:userId", verifyToken, isAdmin, orderController.getUserOrders);

// Update an order's status
router.put("/:id/status", verifyToken, isAdmin, orderController.updateOrderStatus);

// Delete an order
router.delete("/:id", verifyToken, isAdmin, orderController.deleteOrder);


module.exports = router;
