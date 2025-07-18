// backend/controllers/bookController.js
const bookService = require("../services/books");
const mlService = require("../services/mlService"); // NEW: Import mlService
const { GENRES } = require("../constants/bookData");

const bookController = {
  async getAllBooks(req, res) {
    try {
      const { limit, nextCursor, search, author, genre } = req.query;
      const filters = { search, author, genre };

      const result = await bookService.getBooks({
        limit: parseInt(limit) || 12,
        startAfterId: nextCursor || null,
        filters,
      });

      res.status(200).json(result);
    } catch (error) {
      // Send back the specific error from Firestore if available
      res.status(500).json({ error: error.message });
    }
  },

  async getBookById(req, res) {
    try {
      // Calling the consistently named service function
      const book = await bookService.getBookById(req.params.id);
      if (!book) {
        return res.status(404).json({ error: "Book not found." });
      }
      res.status(200).json(book);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getAvailableGenres(req, res) {
    try {
      // Simply return the constant list
      res.status(200).json(GENRES);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve genres." });
    }
  },

  async createBook(req, res) {
    try {
      const newBook = await bookService.createBook(req.body);
      // No cache logic here! The service handles it.
      res.status(201).json({ message: "Book created successfully", book: newBook });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateBook(req, res) {
    try {
      const updatedBook = await bookService.updateBook(req.params.id, req.body);
      if (!updatedBook) {
        return res.status(404).json({ error: "Book not found." });
      }
      // No cache logic here!
      res.status(200).json({ message: "Book updated successfully", book: updatedBook });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteBook(req, res) {
    try {
      const success = await bookService.deleteBook(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Book not found." });
      }
      // No cache logic here!
      res.status(200).json({ message: "Book deleted successfully." });
    } catch (error) {
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
      // We call getNewReleases, which is the correct function name in mlService
      const trendingBooks = await mlService.getNewReleases(num);
      res.status(200).json(trendingBooks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trending books." });
    }
  },
};

module.exports = bookController;
