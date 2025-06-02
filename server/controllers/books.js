// backend/controllers/bookController.js
const bookService = require("../services/books");
const { deleteCache } = require("../utils/cache"); // Import deleteCache

const bookController = {
  async getAllBooks(req, res) {
    try {
      const books = await bookService.getAllBooks();
      res.json(books);
    } catch (error) {
      console.error("Error getting all books:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getBookById(req, res) {
    try {
      const book = await bookService.queryBookById(req.params.id);
      if (!book) {
        return res.status(404).json({ error: "Book not found." });
      }
      res.json(book);
    } catch (error) {
      console.error("Error getting book by ID:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async createBook(req, res) {
    try {
      const newBook = await bookService.createBook(req.body);
      // Invalidate caches related to all books and recommendations
      deleteCache("all_books"); // Cache for getAllBooks
      deleteCache("all_ratings"); // If a new book could affect future ratings retrieval
      deleteCache("popular_books_5"); // Invalidate popular books cache (assuming 5 is the default limit)
      // Note: No direct user/item rec cache invalidation needed here, as it's a new book

      res
        .status(201)
        .json({ message: "Book created successfully", book: newBook });
    } catch (error) {
      console.error("Error creating book:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateBook(req, res) {
    try {
      const updatedBook = await bookService.updateBook(req.params.id, req.body);
      if (!updatedBook) {
        return res.status(404).json({ error: "Book not found." });
      }
      // Invalidate caches related to specific book and all books
      deleteCache("all_books"); // Cache for getAllBooks
      deleteCache(`similar_books_${req.params.id}`); // Specific book's similar books
      deleteCache("popular_books_5"); // Popularity might change
      // All user recommendations might be subtly affected if their rated books changed
      // For simplicity, we might not clear all user recs for every book update,
      // but for major changes like genre/rating affecting fields, it might be necessary.
      // For now, let's keep it minimal to avoid excessive clearing.

      res.json({ message: "Book updated successfully", book: updatedBook });
    } catch (error) {
      console.error("Error updating book:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async deleteBook(req, res) {
    try {
      const success = await bookService.deleteBook(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Book not found." });
      }
      // Invalidate caches related to all books, all ratings, and all recommendations
      deleteCache("all_books");
      deleteCache("all_ratings"); // Ratings for this book are gone, impacts all_ratings
      deleteCache("popular_books_5");
      // For a deleted book, all user-based and item-based recommendations should be invalidated.
      // In a large system, this might trigger a background re-computation.
      // For our in-memory cache, we'll clear all relevant recs, or rely on TTL.
      // As a simple approach for "free" caching, clearing ALL recommendations is too aggressive,
      // so we rely on the TTLs to eventually refresh.
      // However, specific `similar_books_X` for the deleted book should be removed.
      deleteCache(`similar_books_${req.params.id}`);

      res.json({ message: "Book deleted successfully." });
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async searchBooks(req, res) {
    // ... no cache invalidation needed here, this is a read operation
    try {
      const { title, author, genre, minPrice, maxPrice } = req.query;
      const books = await bookService.searchBooks(
        title,
        author,
        genre,
        minPrice,
        maxPrice
      );
      res.json(books);
    } catch (error) {
      console.error("Error searching books:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateBookStock(req, res) {
    try {
      const { quantity } = req.body;
      const updatedBook = await bookService.updateBookStock(
        req.params.id,
        quantity
      );
      if (!updatedBook) {
        return res.status(404).json({ error: "Book not found." });
      }
      // No recommendation/rating cache invalidation needed for stock updates
      res.json({
        message: "Book stock updated successfully",
        book: updatedBook,
      });
    } catch (error) {
      console.error("Error updating book stock:", error);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = bookController;
