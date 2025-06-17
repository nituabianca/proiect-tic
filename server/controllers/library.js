const libraryService = require("../services/library"); // Corrected filename

const libraryController = {
  async updateBookStatus(req, res) {
    try {
      const userId = req.user.id;
      const { bookId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "A status ('in_library' or 'wishlisted') is required." });
      }

      const entry = await libraryService.updateBookStatus(userId, bookId, status);
      res.status(200).json({ message: `Book status updated to '${status}'`, entry });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to update book status." });
    }
  },

  async getMyLibrary(req, res) {
    try {
      const library = await libraryService.getMyLibrary(req.user.id);
      res.status(200).json(library);
    } catch(err) {
      res.status(500).json({ error: "Failed to fetch library." });
    }
  }
};

module.exports = libraryController;