// // backend/middleware/authMiddleware.js
// // const { admin } = require("../firebase/firebase"); // <--- REMOVE THIS IMPORT
// const jwt = require("jsonwebtoken");
//
// const JWT_SECRET = process.env.JWT_SECRET; // Ensure this is loaded via dotenv in server.js
//
// const authMiddleware = async (req, res, next) => {
//   const authHeader = req.headers.authorization;
//
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res
//       .status(401)
//       .json({ error: "No authentication token provided or invalid format." });
//   }
//
//   const token = authHeader.split("Bearer ")[1]; // This is now YOUR CUSTOM JWT
//
//   try {
//     // Verify YOUR CUSTOM JWT using jsonwebtoken
//     const decodedToken = jwt.verify(token, JWT_SECRET);
//
//     // req.user will contain uid, email, and role from the CUSTOM JWT payload
//     req.user = {
//       uid: decodedToken.uid,
//       email: decodedToken.email,
//       role: decodedToken.role,
//     };
//
//     next();
//   } catch (error) {
//     console.error("Error verifying custom JWT:", error);
//     if (error.name === "TokenExpiredError") {
//       // Error name for expired JWTs
//       return res
//         .status(401)
//         .json({ error: "Authentication token expired. Please log in again." });
//     }
//     // Catch other JWT errors like JsonWebTokenError (invalid signature, malformed token)
//     res
//       .status(401)
//       .json({ error: "Unauthorized. Invalid or malformed token." });
//   }
// };
//
// module.exports = authMiddleware;

// backend/middleware/authMiddleware.js
// const { admin } = require("../firebase/firebase"); // This line was correctly commented out/removed

// In authController.js:
// const token = jwt.sign(
//   { id: userId, email: userData.email }, // <-- Payload used when signing the custom JWT
//   process.env.JWT_SECRET,
//   { expiresIn: "1h" }
// );

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET; // Ensure this is loaded via dotenv in server.js

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "No authentication token provided or invalid format." });
  }

  const token = authHeader.split("Bearer ")[1]; // This is now YOUR CUSTOM JWT

  try {
    // Verify YOUR CUSTOM JWT using jsonwebtoken
    const decodedToken = jwt.verify(token, JWT_SECRET);

    // IMPORTANT: Update req.user based on the payload of YOUR CUSTOM JWT
    // Your custom JWT contains 'id' (Firestore doc ID) and 'email'.
    req.user = {
      id: decodedToken.id, // Use 'id' from your custom JWT payload
      email: decodedToken.email, // Use 'email' from your custom JWT payload
      // Remove 'uid' and 'role' unless you add them to your custom JWT payload
      // uid: decodedToken.uid, // No longer in your custom JWT
      // role: decodedToken.role, // No longer in your custom JWT
    };

    next();
  } catch (error) {
    console.error("Error verifying custom JWT:", error);
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Authentication token expired. Please log in again." });
    }
    // Catch other JWT errors like JsonWebTokenError (invalid signature, malformed token)
    res
      .status(401)
      .json({ error: "Unauthorized. Invalid or malformed token." });
  }
};

module.exports = authMiddleware;
