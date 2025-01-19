const db = require("../firebase/firebase");

const queryOrdersByUserId = async (bookId, userId) => {
  const foundOrders = db
    .collection("books")
    .doc(bookId)
    .collection("orders")
    .where("userId", "==", userId)
    .get()
    .then((snapshot) => {
      let orders = {};
      snapshot.forEach((doc) => {
        orders = doc.data();
        orders.id = doc.id;
      });
      return orders;
    })
    .catch((err) => {
      console.log("Error occured: " + err);
    });
  return foundOrders;
};

module.exports = { queryOrdersByUserId };
