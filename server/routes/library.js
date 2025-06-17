const express = require("express");
const libraryController = require("../controllers/library");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

// A logged-in user can update the status of a book in their library
router.post("/:bookId", verifyToken, libraryController.updateBookStatus);
router.get("/my-library", verifyToken, libraryController.getMyLibrary);

module.exports = router;
