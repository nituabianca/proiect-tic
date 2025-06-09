// backend/controllers/bookController.js
const bookService = require("../services/books");
const mlService = require("../services/mlService"); // NEW: Import mlService
const { deleteCache } = require("../utils/cache");

const bookController = {
  async getAllBooks(req, res) {
    try {
      // Assuming pagination params might be sent for /api/books
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10; // Example limit
      const books = await bookService.getAllBooks(page, limit); // You might need to update bookService.getAllBooks
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
      deleteCache("all_ratings");
      deleteCache("popular_books_5");
      deleteCache(`similar_books_${req.params.id}`);

      res.json({ message: "Book deleted successfully." });
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async searchBooks(req, res) {
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
      res.json({
        message: "Book stock updated successfully",
        book: updatedBook,
      });
    } catch (error) {
      console.error("Error updating book stock:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // NEW: Get Popular Books
  async getPopularBooks(req, res) {
    try {
      const num = parseInt(req.query.num) || 10;
      const popularBooks = await mlService.getPopularBooks(num);
      res.status(200).json(popularBooks);
    } catch (error) {
      console.error("Error fetching popular books from bookController:", error);
      res.status(500).json({ error: "Failed to fetch popular books." });
    }
  },

  // NEW: Get Trending Books
  async getTrendingBooks(req, res) {
    try {
      const num = parseInt(req.query.num) || 10;
      const trendingBooks = await mlService.getTrendingBooks(num);
      res.status(200).json(trendingBooks);
    } catch (error) {
      console.error(
        "Error fetching trending books from bookController:",
        error
      );
      res.status(500).json({ error: "Failed to fetch trending books." });
    }
  },
};

module.exports = bookController;
