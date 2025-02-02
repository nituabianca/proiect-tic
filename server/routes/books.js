const express = require("express");
const router = express.Router();
const bookController = require("../controllers/books");
const {
  authMiddleware,
  adminMiddleware,
  userMiddleware,
} = require("../middlewares/auth");

// Public routes
router.get("/", bookController.getAllBooks);
router.get("/search", bookController.searchBooks);
router.get("/:id", bookController.getBookById);

// Admin only routes
router.use(authMiddleware, adminMiddleware);
router.post("/", bookController.createBook);
router.put("/:id", bookController.updateBook);
router.delete("/:id", bookController.deleteBook);
router.patch("/:id/stock", bookController.updateBookStock);
router.post("/generate", bookController.generateMockBooks);

module.exports = router;
