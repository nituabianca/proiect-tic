const express = require("express");
const router = express.Router();
const userController = require("../controllers/users");
const {
  authMiddleware,
  adminMiddleware,
  userMiddleware,
} = require("../middlewares/auth");

router.post("/generate", adminMiddleware, userController.generateMockUsers);
router.get("/", adminMiddleware, userController.getAllUsers);

router.use(authMiddleware);
router.get("/:id", userMiddleware, userController.getUserById);
router.put("/:id", userMiddleware, userController.updateUser);
router.get("/:id/orders", userMiddleware, userController.getUserOrders);

router.delete("/:id", adminMiddleware, userController.deleteUser);

module.exports = router;
