const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orders");

// CRUD Operations
router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);
router.get("/status/:status", orderController.getOrdersByStatus);
router.put("/:id", orderController.updateOrder);
router.delete("/:id", orderController.deleteOrder);
router.patch("/:id/status", orderController.updateOrderStatus);

// Data Generation
router.post("/generate", orderController.generateMockOrders);
module.exports = router;
