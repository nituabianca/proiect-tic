const express = require("express");
const bookController = require("../controllers/books"); // Corrected to a consistent name
const { verifyToken, isAdmin } = require("../middlewares/auth"); // Corrected to a consistent name

const router = express.Router();

// --- Public Routes ---

// Static routes MUST be defined before dynamic routes like /:id
router.get("/search", bookController.searchBooks);
router.get("/popular", bookController.getPopularBooks);
router.get("/trending", bookController.getTrendingBooks);
router.get("/genres", bookController.getAvailableGenres);

// This dynamic route now comes LAST among the GET requests.
router.get("/:id", bookController.getBookById);

// The root GET for all books
router.get("/", bookController.getAllBooks);


// --- Admin-only Routes ---
router.post("/", verifyToken, bookController.createBook);
router.put("/:id", verifyToken, bookController.updateBook);
router.delete("/:id", verifyToken, bookController.deleteBook);
router.patch("/:id/stock", verifyToken, bookController.updateBookStock);

module.exports = router;