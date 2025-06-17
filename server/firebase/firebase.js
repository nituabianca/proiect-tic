// backend/firebase.js
const admin = require("firebase-admin");

// IMPORTANT: Ensure this path correctly points to your serviceAccountKey.json
// If firebase.js is in 'backend/' and serviceAccountKey.json is in 'backend/', then './serviceAccountKey.json' is correct.
// If serviceAccountKey.json is in 'backend/config', then it would be './config/serviceAccountKey.json'.
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin SDK ONLY if it hasn't been initialized already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://tic-proiect-4682f.firebaseio.com", // Your Realtime Database URL
  });
  console.log("Firebase Admin SDK initialized successfully."); // Log for confirmation
}

const db = admin.firestore(); // Get Firestore instance (after initialization)
const auth = admin.auth();

module.exports = { admin, db , auth}; // Export both admin and db for use in other files