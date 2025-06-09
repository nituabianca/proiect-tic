// Ensure 'admin' is initialized and available globally or passed in
const { admin, db } = require("../firebase/firebase");
const jwt = require("jsonwebtoken"); // For creating your custom JWT

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1h";

// --- Secure Registration ---
exports.register = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res
      .status(400)
      .json({ error: "All fields are required for registration." });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false,
    });

    const firebaseUid = userRecord.uid;

    await db
      .collection("users")
      .doc(firebaseUid)
      .set({
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: "user", // Default role for new registrations
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        preferences: {
          language: "EN",
          newsletter: false,
          notifications: false,
          preferredGenres: [],
          readingLevel: "Beginner",
        },
        stats: {
          totalBooksRead: 0,
          totalPagesRead: 0,
          averageRatingGiven: 0,
          booksInWishlist: 0,
          loyaltyPoints: 0,
          lastActivityDate: null,
        },
      });

    const customJwtToken = jwt.sign(
      { id: firebaseUid, email: email, role: "user" },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.status(201).json({
      message: "User registered successfully with Firebase Auth and Firestore.",
      token: customJwtToken,
      user: {
        id: firebaseUid,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: "user",
      },
    });
  } catch (error) {
    console.error("Registration error (Firebase Auth):", error);
    if (error.code === "auth/email-already-exists") {
      return res
        .status(409)
        .json({ error: "Email already registered with Firebase." });
    }
    res.status(500).json({
      error:
        error.message || "An unexpected error occurred during registration.",
    });
  }
};

// --- Secure Login ---
exports.login = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "Firebase ID Token is required." });
  }

  try {
    const decodedFirebaseToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedFirebaseToken.uid;
    const email = decodedFirebaseToken.email;

    const userDoc = await db.collection("users").doc(firebaseUid).get();

    let userData;
    if (userDoc.exists) {
      userData = userDoc.data();
    } else {
      console.warn(
        `Firestore document for UID ${firebaseUid} not found during login. This user might not be fully registered.`
      );
      // If a Firestore document is expected for all users, consider this an error
      return res.status(404).json({
        error:
          "User profile not found in Firestore. Please ensure you are registered.",
      });
    }

    const customJwtToken = jwt.sign(
      { id: firebaseUid, email: email, role: userData.role || "user" }, // Use role from Firestore, default to 'user'
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.status(200).json({
      message: "Login successful (Firebase Auth).",
      token: customJwtToken,
      user: {
        id: firebaseUid,
        email: email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || "user", // Ensure role is returned
      },
    });
  } catch (error) {
    console.error("Firebase ID Token verification error:", error);
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        error:
          "Firebase ID Token expired. Please re-authenticate on the client.",
      });
    } else if (error.code === "auth/invalid-id-token") {
      return res.status(401).json({ error: "Invalid Firebase ID Token." });
    }
    res.status(401).json({ error: "Authentication failed. Please try again." });
  }
};

// --- Profile and Logout ---
exports.getProfile = async (req, res) => {
  const firebaseUid = req.user.id; // Assuming req.user.id is populated by verifyToken middleware

  try {
    const userDoc = await db.collection("users").doc(firebaseUid).get();

    if (!userDoc.exists) {
      // If the Firestore document doesn't exist, it means the user was not fully
      // registered in your Firestore 'users' collection with a role.
      // For an admin dashboard, you *must* have the role from Firestore.
      console.warn(
        `Firestore user document for UID ${firebaseUid} not found during profile fetch.`
      );
      return res.status(404).json({
        error:
          "User profile not found in Firestore. Please ensure the user's Firestore document exists and contains a role.",
      });
    }

    const userData = userDoc.data();

    // Crucial: Ensure the role is explicitly retrieved from the Firestore document data.
    // Provide a fallback of 'user' if, for some reason, the role field itself is missing in Firestore.
    const role = userData.role || "user";

    const profile = {
      id: userDoc.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: role, // This is the key: ensuring the role is always returned
    };

    res
      .status(200)
      .json({ message: "Profile data retrieved successfully.", user: profile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    // Handle specific Firebase Auth errors vs. general server errors
    if (error.code && error.code.startsWith("auth/")) {
      res
        .status(401)
        .json({ error: "Authentication error retrieving profile." });
    } else {
      res.status(500).json({
        error: "Failed to retrieve profile data due to server error.",
      });
    }
  }
};

exports.logout = async (req, res) => {
  console.log(`User ${req.user.email} (ID: ${req.user.id}) logged out.`);
  res.status(200).json({ message: "Logged out successfully." });
};
