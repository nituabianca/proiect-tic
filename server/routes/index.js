// backend/routes/index.js
const express = require("express");
const authRoutes = require("./auth");
const userRoutes = require("./users");
const bookRoutes = require("./books");
const ratingRoutes = require("./ratings");
const orderRoutes = require("./orders");
const recommendationRoutes = require("./recommendations");
const statisticsRoutes = require("./statistics");
const libraryRoutes = require("./library")

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/books", bookRoutes);
router.use("/ratings", ratingRoutes);
router.use("/orders", orderRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/statistics", statisticsRoutes);
router.use("/library", libraryRoutes);

module.exports = router;
