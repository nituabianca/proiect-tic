const express = require("express");
const libraryController = require("../controllers/library");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// A logged-in user can update the status of a book in their library
router.post("/:bookId", verifyToken, libraryController.updateBookStatus);

module.exports = router;
