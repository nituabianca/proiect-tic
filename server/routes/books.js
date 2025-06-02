const express = require("express");
const bookController = require("../controllers/books");
const authMiddleware = require("../middlewares/auth");
const adminMiddleware = require("../middlewares/admin"); // Correct import path

const router = express.Router();

// Public routes (no authentication required for viewing/searching books)
router.get("/", bookController.getAllBooks);
router.get("/search", bookController.searchBooks);
router.get("/:id", bookController.getBookById);

// Admin-only routes (for managing books)
router.post("/", authMiddleware, adminMiddleware, bookController.createBook);
router.put("/:id", authMiddleware, adminMiddleware, bookController.updateBook);
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  bookController.deleteBook
);

// Specific route for stock update (admin only)
router.patch(
  "/:id/stock",
  authMiddleware,
  adminMiddleware,
  bookController.updateBookStock
);

module.exports = router;
