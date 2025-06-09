// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization; // This is undefined or empty

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // This condition is TRUE
    return res
      .status(401)
      .json({ error: "No authentication token provided or invalid format." }); // This response is sent
  }

  const token = authHeader.split("Bearer ")[1]; // This is YOUR CUSTOM JWT

  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);

    // This payload now contains 'id' (Firebase UID), 'email', and 'role'
    req.user = {
      id: decodedToken.id,
      uid: decodedToken.id, // For consistency, you can map 'id' to 'uid'
      email: decodedToken.email,
      role: decodedToken.role,
    };

    next();
  } catch (error) {
    console.error("Error verifying custom JWT:", error);
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Authentication token expired. Please log in again." });
    }
    res
      .status(401)
      .json({ error: "Unauthorized. Invalid or malformed token." });
  }
};

module.exports = authMiddleware;
