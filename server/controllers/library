// backend/controllers/libraryController.js
const libraryService = require("../services/library");
const bookService = require("../services/books");

const libraryController = {
  async updateBookStatus(req, res) {
    try {
      const userId = req.user.id;
      const { bookId } = req.params;
      const { status } = req.body;

      const validStatuses = ['reading', 'completed', 'want_to_read', 'paused'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: "A valid status is required." });
      }

      // Ensure the book exists before adding it to the library
      const book = await bookService.getBookById(bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found." });
      }

      const progress = await libraryService.updateBookStatus(userId, bookId, status);
      res.status(200).json({ message: `Book status updated to '${status}'`, progress });

    } catch (error) {
      console.error("Error updating book status:", error);
      res.status(500).json({ error: "Failed to update book status." });
    }
  },
};

module.exports = libraryController;
