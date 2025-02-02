const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orders");
const {
  authMiddleware,
  userMiddleware,
  adminMiddleware,
} = require("../middlewares/auth");

// User routes
router.use(authMiddleware, userMiddleware);
router.post("/", orderController.createOrder);
router.get("/my", orderController.getMyOrders); // New endpoint needed

// Admin routes
router.use(adminMiddleware);
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);
router.put("/:id", orderController.updateOrder);
router.delete("/:id", orderController.deleteOrder);
router.patch("/:id/status", orderController.updateOrderStatus);
router.post("/generate", orderController.generateMockOrders);
module.exports = router;
