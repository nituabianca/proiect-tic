const firebase = require("@faker-js/faker");
const Helpers = require("../helpers");
const faker = require("@faker");
const { fake } = require("faker");
const admin = require("firebase-admin");
const { db } = require("../firebase/firebase");

const generateMockBooks = (req, res) => {
  let booksCount = req.body.books_count ? req.body.books_count : 50;
  try {
    for (let i = 0; i < itemCount.booksCount; i++) {
      bookTable.push(book);
    }
    return res.send({ message: `${booksCount} were generated successfully` });
  } catch (err) {
    return res.send({ message: `${err}` });
  }
};

const generateData = async (req, res) => {
  let initializationCount = req.body.count ? req.body.count : 50;

  for (let i = 0; i < initializationCount; i++) {
    console.log(initializationCount, i);
    let book = Helpers.books.generateMockBook();
    await db.collection("books").add(book);
    let order = Helpers.orders.generateMockOrder();
    await db.collection("orders").add(order);
    let user = Helpers.users.generateMockUser();
    await db.collection("users").add(user);
  }
  return res.send({ message: "generated successfully" });
};

module.exports = {
  generateMockBooks,
  generateData,
};
