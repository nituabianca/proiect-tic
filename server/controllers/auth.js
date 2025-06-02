// // backend/controllers/authController.js
// const { db, admin } = require("../firebase/firebase");
// const jwt = require("jsonwebtoken"); // <--- ADD THIS IMPORT
//
// const JWT_SECRET = process.env.JWT_SECRET; // <--- GET FROM .ENV
// const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1h"; // <--- GET FROM .ENV, default to 1h
//
// const authController = {
//   async register(req, res) {
//     try {
//       const { email, password, firstName, lastName } = req.body;
//
//       // Creează utilizatorul în Firebase Authentication
//       const userRecord = await admin.auth().createUser({
//         email,
//         password,
//         displayName: `${firstName} ${lastName}`,
//         emailVerified: true, // Setăm direct pe true dacă renunțăm la verificare
//       });
//
//       // Salvează datele utilizatorului în Firestore
//       await db
//         .collection("users")
//         .doc(userRecord.uid)
//         .set({
//           email,
//           firstName,
//           lastName,
//           role: "user", // Setează rolul implicit la înregistrare
//           createdAt: new Date(),
//           updatedAt: new Date(),
//           preferences: {
//             language: "EN",
//             newsletter: false,
//             notifications: false,
//             preferredGenres: [],
//             readingLevel: "Beginner",
//           },
//           stats: {
//             totalBooksRead: 0,
//             totalPagesRead: 0,
//             averageRatingGiven: 0,
//             booksInWishlist: 0,
//             loyaltyPoints: 0,
//             lastActivityDate: null,
//           },
//         });
//
//       res.status(201).json({
//         message: "User registered successfully.",
//         user: {
//           id: userRecord.uid,
//           email: userRecord.email,
//           displayName: userRecord.displayName,
//         },
//       });
//     } catch (error) {
//       console.error("Error registering user:", error);
//       res.status(500).json({ error: error.message });
//     }
//   },
//
//   async login(req, res) {
//     try {
//       // Clientul va trimite Firebase ID Token în body (sau header)
//       // Presupunem că vine în body pentru acest endpoint specific de login
//       const { idToken } = req.body; // <--- EXPECT FIREBASE ID TOKEN HERE
//       if (!idToken) {
//         return res
//           .status(400)
//           .json({ error: "Firebase ID Token is required." });
//       }
//
//       console.log("Login attempt with Firebase ID Token...");
//
//       // 1. --- Verify Firebase ID Token using Firebase Admin SDK ---
//       const decodedFirebaseToken = await admin.auth().verifyIdToken(idToken);
//       const firebaseUID = decodedFirebaseToken.uid;
//       console.log("Firebase ID Token verified. UID:", firebaseUID);
//
//       // 2. --- Fetch user data from Firestore ---
//       const userDoc = await db.collection("users").doc(firebaseUID).get();
//       if (!userDoc.exists) {
//         // This scenario means a user authenticated with Firebase but has no Firestore profile.
//         // You might want to auto-create a basic profile here if it's a new login.
//         return res
//           .status(404)
//           .json({ error: "User profile not found in Firestore." });
//       }
//       const userData = userDoc.data();
//       console.log("Got user data from Firestore");
//
//       // 3. --- Issue your custom JWT ---
//       const customTokenPayload = {
//         uid: firebaseUID,
//         email: decodedFirebaseToken.email, // Get email from Firebase token
//         role: userData.role || "user", // Get role from Firestore, default to 'user'
//       };
//
//       const customJWT = jwt.sign(customTokenPayload, JWT_SECRET, {
//         expiresIn: JWT_EXPIRATION,
//       });
//
//       res.json({
//         token: customJWT, // <--- Now returning your custom JWT
//         user: {
//           id: firebaseUID,
//           email: decodedFirebaseToken.email,
//           firstName: userData.firstName,
//           lastName: userData.lastName,
//           role: userData.role || "user",
//         },
//       });
//
//       console.log("Login successful");
//     } catch (error) {
//       console.error("Login error:", error);
//       let errorMessage =
//         "Authentication failed. Invalid Firebase ID Token or other error.";
//       let statusCode = 401;
//
//       if (error.code === "auth/id-token-expired") {
//         errorMessage =
//           "Firebase ID Token expired. Please re-authenticate on the client.";
//       } else if (error.code === "auth/argument-error") {
//         errorMessage = "Invalid Firebase ID Token provided.";
//       }
//       // You can add more specific Firebase Admin SDK error handling here
//
//       res.status(statusCode).json({
//         error: errorMessage,
//         details:
//           process.env.NODE_ENV === "development" ? error.message : undefined,
//       });
//     }
//   },
//
//   async logout(req, res) {
//     try {
//       const userId = req.user.uid;
//
//       await admin.auth().revokeRefreshTokens(userId);
//
//       await db.collection("users").doc(userId).update({
//         lastLogout: new Date(),
//         updatedAt: new Date(),
//       });
//
//       res.json({
//         message: "Logged out successfully",
//         timestamp: new Date(),
//       });
//     } catch (error) {
//       console.error("Logout error:", error);
//       res.status(500).json({ error: "Failed to logout" });
//     }
//   },
//
//   async getProfile(req, res) {
//     try {
//       const userId = req.user.uid;
//       const userDoc = await db.collection("users").doc(userId).get();
//
//       if (!userDoc.exists) {
//         return res.status(404).json({ error: "User not found" });
//       }
//
//       res.json({
//         id: userDoc.id,
//         ...userDoc.data(),
//       });
//     } catch (error) {
//       console.error("Error fetching profile:", error);
//       res.status(500).json({ error: error.message });
//     }
//   },
// };
//
// module.exports = authController;
// Ensure 'admin' is initialized and available globally or passed in
// const admin = require('firebase-admin'); // If not initialized elsewhere and passed

// If you pass admin object from server.js:
// module.exports = (admin) => { ... return { login, register }; }
// For simplicity here, assuming admin is globally available or imported if setup
// like in server.js: const admin = require('./firebaseAdminConfig');

// If your admin setup is like:
// const admin = require('firebase-admin');
// admin.initializeApp(require('./firebaseAdminCredentials.json'));
// Then just define it here.

// IMPORTANT: Ensure your Firebase Admin SDK is initialized in your backend.
// For example, at the top of your server.js or in a separate firebaseAdminConfig.js file
// const admin = require('firebase-admin');
// const serviceAccount = require('../path/to/your/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });
// const db = admin.firestore(); // Get Firestore instance

const jwt = require("jsonwebtoken");
const { admin } = require("../firebase/firebase"); // For creating your custom JWT

// Get the Firestore instance
const db = admin.firestore(); // Ensure 'admin' is correctly scoped here from your setup

// INSECURE: Temporary login for development using direct email/password from Firestore
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    // Query Firestore to find the user document by email
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const userData = snapshot.docs[0].data();
    const userId = snapshot.docs[0].id; // Get Firestore document ID

    // Compare password (INSECURE: plaintext comparison)
    if (userData.password !== password) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // If credentials match, generate your custom JWT
    const token = jwt.sign(
      { id: userId, email: userData.email }, // Use Firestore document ID as user ID
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Adjust this for longer testing if needed
    );

    // Return success response with user data and your custom token
    res.status(200).json({
      message: "Login successful (Insecure Dev Mode - Firestore).",
      token,
      user: {
        id: userId,
        email: userData.email,
        name: userData.name, // Include other user data you want
        // Other fields from your Firestore user document
      },
    });
  } catch (error) {
    console.error("Login error (Insecure Dev Mode - Firestore):", error);
    res
      .status(500)
      .json({ error: "An unexpected error occurred during login." });
  }
};

// INSECURE: Temporary registration for development, storing plaintext passwords in Firestore
exports.register = async (req, res) => {
  const { email, password, name } = req.body; // Assuming name is also sent

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const usersRef = db.collection("users");
    const existingUserSnapshot = await usersRef
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!existingUserSnapshot.empty) {
      return res.status(409).json({ error: "Email already registered." });
    }

    // Create a new user document in Firestore (INSECURE: storing plaintext password)
    const newUserRef = await usersRef.add({
      email,
      password, // <--- Storing plaintext password for this insecure example
      name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      // Add other fields as needed
    });

    const newUserDoc = await newUserRef.get();
    const newUser = newUserDoc.data();
    const newUserId = newUserDoc.id;

    // Optionally generate a token for immediate login after registration
    const token = jwt.sign(
      { id: newUserId, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "Registration successful (Insecure Dev Mode - Firestore).",
      token,
      user: {
        id: newUserId,
        email: newUser.email,
        name: newUser.name,
        // Include other user data you added
      },
    });
  } catch (error) {
    console.error("Registration error (Insecure Dev Mode - Firestore):", error);
    res
      .status(500)
      .json({ error: "An unexpected error occurred during registration." });
  }
};

// --- NEW: Placeholder for getProfile ---
exports.getProfile = async (req, res) => {
  // Assuming req.user is populated by authMiddleware with { id, email }
  const userId = req.user.id; // The Firestore document ID

  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const userData = userDoc.data();
    // Do NOT send the password back!
    const profile = {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      // Include any other non-sensitive fields from your user document
    };

    res
      .status(200)
      .json({ message: "Profile data retrieved successfully.", user: profile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to retrieve profile data." });
  }
};

// --- NEW: Placeholder for logout ---
exports.logout = async (req, res) => {
  // In a stateless JWT system, 'logout' on the backend often doesn't do much
  // beyond indicating success or blacklisting a token (more complex).
  // For now, simply send a success message.
  // The frontend is responsible for clearing the token from localStorage.
  console.log(`User ${req.user.email} (ID: ${req.user.id}) logged out.`);
  res.status(200).json({ message: "Logged out successfully." });
};
