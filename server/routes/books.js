const express = require("express");
const bookController = require("../controllers/bookController");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

// --- Public Routes ---
router.get("/", bookController.getAllBooks);
router.get("/search", bookController.searchBooks);
router.get("/popular", bookController.getPopularBooks);
router.get("/trending", bookController.getTrendingBooks);
router.get("/:id", bookController.getBookById);


// --- Admin-only Routes ---
router.post("/", [verifyToken, isAdmin], bookController.createBook);
router.put("/:id", [verifyToken, isAdmin], bookController.updateBook);
router.delete("/:id", [verifyToken, isAdmin], bookController.deleteBook);
router.patch("/:id/stock", [verifyToken, isAdmin], bookController.updateBookStock);

module.exports = router;
