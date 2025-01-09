const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tic-proiect-4682f.firebaseio.com",
});

let db = admin.firestore();

module.exports = db;
