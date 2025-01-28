const express = require("express");
const bookRoutes = require("./books");
const orderRoutes = require("./orders");
// const userRoutes = require("./user");

const router = express.Router();

router.use("/books", bookRoutes);
router.use("/orders", orderRoutes);
// router.use("/users", userRoutes);

module.exports = router;
