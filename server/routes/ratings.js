const express = require("express");
const ratingController = require("../controllers/rating");
const authMiddleware = require("../middlewares/auth");
// const adminMiddleware = require('../middleware/adminMiddleware'); // Posibil să nu fie necesar aici

const router = express.Router();

// Authenticated user can add/update their own rating for a book
router.post("/:bookId", authMiddleware, ratingController.addOrUpdateRating);
router.put("/:bookId", authMiddleware, ratingController.addOrUpdateRating); // PUT for update, POST for add

// Oricine poate vedea rating-urile unei cărți
router.get("/:bookId", ratingController.getRatingsForBook); // Public access - Correct

// Userul își poate vedea ratingurile (sau adminul pe ale altcuiva)
router.get("/user/:userId", authMiddleware, ratingController.getUserRatings); // Correctly protected

module.exports = router;
