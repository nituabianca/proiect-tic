const express = require("express");
const bookRoutes = require("./books");
// const orderRoutes = require("./orderRoutes");
// const userRoutes = require("./userRoutes");

const router = express.Router();

router.use("/books", bookRoutes);
// router.use("/orders", orderRoutes);
// router.use("/users", userRoutes);

module.exports = router;
