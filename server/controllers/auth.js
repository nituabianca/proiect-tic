// backend/controllers/auth.controller.js
const authService = require("../services/auth");

// --- Secure Registration ---
exports.register = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: "All fields are required for registration." });
  }

  try {
    const { token, user } = await authService.registerUser(email, password, firstName, lastName);
    res.status(201).json({
      message: "User registered successfully.",
      token,
      user,
    });
  } catch (error) {
    // Handle specific errors from Firebase Auth
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({ error: "This email is already registered." });
    }
    console.error("Registration Error:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred during registration." });
  }
};

// --- Secure Login ---
exports.login = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "Firebase ID Token is required." });
  }

  try {
    const { token, user } = await authService.loginWithIdToken(idToken);
    res.status(200).json({
      message: "Login successful.",
      token,
      user,
    });
  } catch (error) {
    // Handle specific known errors
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    if (error.code === "auth/id-token-expired" || error.code === "auth/invalid-id-token") {
      return res.status(401).json({ error: "Authentication failed. Invalid or expired token." });
    }
    console.error("Login Error:", error);
    res.status(500).json({ error: "Authentication failed. Please try again." });
  }
};

// --- Profile and Logout ---
exports.getProfile = async (req, res) => {
  // The user ID is safely attached by our JWT authentication middleware
  const userId = req.user.id;

  try {
    const userProfile = await authService.getUserProfile(userId);
    res.status(200).json({ message: "Profile retrieved successfully.", user: userProfile });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error("Get Profile Error:", error);
    res.status(500).json({ error: "Failed to retrieve profile data." });
  }
};

exports.logout = (req, res) => {
  // JWT logout is a client-side responsibility (deleting the token).
  // This endpoint is useful for confirming the action and for logging.
  console.log(`User ${req.user.email} logged out.`);
  res.status(200).json({ message: "Logged out successfully." });
};