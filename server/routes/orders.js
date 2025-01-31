const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orders");
const { authMiddleware } = require("../middlewares/auth");

// CRUD Operations
router.post("/", authMiddleware, orderController.createOrder);
router.get("/", authMiddleware, orderController.getAllOrders);
router.get("/:id", authMiddleware, orderController.getOrderById);
router.get(
  "/status/:status",
  authMiddleware,
  orderController.getOrdersByStatus
);
router.put("/:id", authMiddleware, orderController.updateOrder);
router.delete("/:id", authMiddleware, orderController.deleteOrder);
router.patch("/:id/status", authMiddleware, orderController.updateOrderStatus);

// Data Generation
router.post("/generate", authMiddleware, orderController.generateMockOrders);
module.exports = router;
