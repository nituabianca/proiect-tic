const express = require("express");
const router = express.Router();
const bookController = require("../controllers/books");

router.post("/", bookController.createBook);
router.get("/", bookController.getAllBooks);
router.get("/search", bookController.searchBooks);
router.get("/:id", bookController.getBookById);
router.put("/:id", bookController.updateBook);
router.delete("/:id", bookController.deleteBook);

router.patch("/:id/stock", bookController.updateBookStock);

router.post("/generate", bookController.generateMockBooks);

module.exports = router;
