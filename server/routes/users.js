const express = require("express");
const router = express.Router();
const userController = require("../controllers/users");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth");

router.post("/generate", userController.generateMockUsers);

router.use(adminMiddleware);
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.get("/:id/orders", userController.getUserOrders);

module.exports = router;
