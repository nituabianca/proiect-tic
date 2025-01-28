const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orders");

// CRUD Operations
router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);
router.get("/status/:status", orderController.getOrdersByStatus);
router.put("/:id", orderController.updateOrder);

module.exports = router;
