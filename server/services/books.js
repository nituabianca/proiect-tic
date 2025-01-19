const db = require("../firebase/firebase");

const queryBookById = async (id) => {
  db.collection("books")
    .doc(id)
    .get()
    .then((snapshot) => {
      return snapshot.data();
    })
    .catch((error) => {
      console.log(error);
    });
};

module.exports = { queryBookById };
