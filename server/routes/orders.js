const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orders");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth");

router.use(authMiddleware);
router.get("/my", orderController.getMyOrders);
router.get("/my/:id", orderController.getMyOrderById);
router.post("/", orderController.createOrder);

router.use(adminMiddleware);
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);
router.get("/status/:status", orderController.getOrdersByStatus);
router.put("/:id", orderController.updateOrder);
router.delete("/:id", orderController.deleteOrder);
router.patch("/:id/status", orderController.updateOrderStatus);
router.post("/generate", orderController.generateMockOrders);

module.exports = router;
