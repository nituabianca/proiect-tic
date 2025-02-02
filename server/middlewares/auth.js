const { admin, db } = require("../firebase/firebase");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    const userRecord = await admin.auth().getUser(token);

    // Fetch user data including role from Firestore
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    const userData = userDoc.data();

    req.user = {
      uid: userRecord.uid,
      email: userRecord.email,
      role: userData.role || "user",
      emailVerified: userRecord.emailVerified,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      error: "Authentication failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const roleMiddleware = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware: roleMiddleware(["admin"]),
  userMiddleware: roleMiddleware(["user", "admin"]),
};
