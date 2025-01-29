const express = require("express");
const router = express.Router();

const bookRoutes = require("./books");
const orderRoutes = require("./orders");
const userRoutes = require("./users");
const authRoutes = require("./auth");

router.use("/books", bookRoutes);
router.use("/orders", orderRoutes);
router.use("/users", userRoutes);
router.use("/auth", authRoutes);

module.exports = router;
