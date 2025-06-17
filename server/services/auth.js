const { auth, db, admin } = require("../firebase/firebase");
const jwt = require("jsonwebtoken");
const { generateMockUser } = require("../helpers/users"); // To ensure consistent user object structure

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1h";

/**
 * A private helper function to generate a standard authentication response.
 * It creates our custom JWT and a clean user object for the client.
 * @private
 * @param {object} firestoreUser - The user data from Firestore, including the ID.
 * @returns {{token: string, user: object}} The JWT and user payload.
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
 * This is called by the `register` controller.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @param {string} firstName - The user's first name.
 * @param {string} lastName - The user's last name.
 * @returns {Promise<{token: string, user: object}>} The JWT and user payload.
 */
const registerUser = async (email, password, firstName, lastName) => {
  // 1. Let the backend's Admin SDK create the user in Firebase Auth.
  const userRecord = await auth.createUser({
    email,
    password,
    displayName: `${firstName} ${lastName}`,
  });

  // 2. Use our helper as a template for a consistent Firestore document.
  const newUserTemplate = generateMockUser();

  // 3. Populate the user document with real data.
  const userData = {
    ...newUserTemplate,
    email: email.toLowerCase(),
    firstName,
    lastName,
    role: "user", // New sign-ups are always 'user'.
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // 4. Create the user document in Firestore with the UID from Auth as the doc ID.
  await db.collection("users").doc(userRecord.uid).set(userData);

  // 5. Generate and return our standard auth response.
  return _createAuthResponse({ id: userRecord.uid, ...userData });
};

/**
 * Verifies a Firebase ID token from the client, fetches the user's profile
 * from Firestore, and exchanges it for our custom JWT.
 * This is called by the `login` controller.
 * @param {string} idToken - The Firebase ID token from the client.
 * @returns {Promise<{token: string, user: object}>} The JWT and user payload.
 */
const loginWithIdToken = async (idToken) => {
  // 1. Securely verify the token from the client using the Admin SDK.
  const decodedFirebaseToken = await auth.verifyIdToken(idToken);

  // 2. Fetch our user profile from Firestore to get the role and other details.
  const userDoc = await db.collection("users").doc(decodedFirebaseToken.uid).get();

  if (!userDoc.exists) {
    const error = new Error("User profile not found in our database.");
    error.statusCode = 404;
    throw error;
  }

  const userData = userDoc.data();

  // 3. Generate and return our standard auth response.
  return _createAuthResponse({ id: userDoc.id, ...userData });
};

/**
 * Fetches a user's profile from Firestore.
 * This is called by the `getProfile` controller.
 * @param {string} userId - The user's ID.
 * @returns {Promise<object|null>} The user's profile data.
 */
const getUserProfile = async (userId) => {
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    const error = new Error("User profile not found.");
    error.statusCode = 404;
    throw error;
  }

  const userData = userDoc.data();

  // Return a "safe" version of the user object for the client.
  return {
    id: userDoc.id,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    preferences: userData.preferences, // Safe to send preferences
    stats: userData.stats,             // Safe to send stats
  };
};

module.exports = {
  registerUser,
  loginWithIdToken,
  getUserProfile,
};