const express = require("express");
const orderController = require("../controllers/orders");
const authMiddleware = require("../middlewares/auth");
const adminMiddleware = require("../middlewares/admin");
const userMiddleware = require("../middlewares/user"); // Correct import path

const router = express.Router();

// Authenticated user can create an order
router.post("/", authMiddleware, orderController.createOrder); // Correctly protected by authMiddleware

// Authenticated user can view their own orders
router.get("/my-orders", authMiddleware, orderController.getUserOrders); // Correctly protected by authMiddleware

// Admin-only routes
router.get("/", authMiddleware, adminMiddleware, orderController.getAllOrders); // Correct
router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  orderController.getOrderById
); // Correct
router.put(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  orderController.updateOrderStatus
); // Correct
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  orderController.deleteOrder
); // Correct

// For an admin to see orders of a specific user (if you have this scenario)
// router.get('/user/:userId', authMiddleware, adminMiddleware, orderController.getUserOrders); // (Commented out, but correct usage if enabled)

module.exports = router;
