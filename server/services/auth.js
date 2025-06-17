// backend/services/auth.service.js
const { auth, db, admin } = require("../firebase/firebase"); // Assuming 'admin' is for firestore.FieldValue
const jwt = require("jsonwebtoken");
const { generateMockUser } = require("../helpers/users"); // We'll use this!

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1h";

/**
 * Generates a custom JWT and a clean user object for the API response.
 * @private
 */
const _createAuthResponse = (firestoreUser) => {
  const payload = {
    id: firestoreUser.id,
    email: firestoreUser.email,
    role: firestoreUser.role,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

  return {
    token,
    user: payload,
  };
};

/**
 * Registers a new user in Firebase Auth and creates their profile in Firestore.
 */
const registerUser = async (email, password, firstName, lastName) => {
  // 1. Create the user in Firebase Auth
  const userRecord = await auth.createUser({
    email,
    password,
    displayName: `${firstName} ${lastName}`,
    emailVerified: false,
  });

  // 2. Use the helper to create a consistent user document structure
  const newUserDoc = generateMockUser();

  // 3. Set the specific data for this new user
  const userData = {
    ...newUserDoc,
    email: email.toLowerCase(),
    firstName,
    lastName,
    role: "user", // Ensure new sign-ups are always 'user'
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  // The document ID in Firestore MUST match the Firebase Auth UID
  await db.collection("users").doc(userRecord.uid).set(userData);

  // 4. Return the token and user payload
  return _createAuthResponse({ id: userRecord.uid, ...userData });
};

/**
 * Verifies a Firebase ID token, fetches user data, and generates a custom JWT.
 */
const loginWithIdToken = async (idToken) => {
  // 1. Verify the token from the client
  const decodedFirebaseToken = await auth.verifyIdToken(idToken);
  const userDoc = await db.collection("users").doc(decodedFirebaseToken.uid).get();

  if (!userDoc.exists) {
    // This is a specific error case we can catch in the controller
    const error = new Error("User profile not found in Firestore.");
    error.statusCode = 404;
    throw error;
  }

  const userData = userDoc.data();

  // 2. Return the token and user payload
  return _createAuthResponse({ id: userDoc.id, ...userData });
};

/**
 * Fetches a user's profile from Firestore.
 */
const getUserProfile = async (userId) => {
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    const error = new Error("User profile not found.");
    error.statusCode = 404;
    throw error;
  }

  const userData = userDoc.data();

  // Return only the necessary public-facing profile data
  return {
    id: userDoc.id,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    preferences: userData.preferences,
    stats: userData.stats
  };
};


module.exports = {
  registerUser,
  loginWithIdToken,
  getUserProfile,
};