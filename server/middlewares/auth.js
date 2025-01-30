const { admin } = require("../firebase/firebase");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split("Bearer ")[1];

    try {
      const userRecord = await admin.auth().getUser(token);

      req.user = {
        uid: userRecord.uid,
        email: userRecord.email,
        role: "user",
      };

      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(401).json({
        error: "Invalid or expired token",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      error: "Authentication failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Admin access required" });
  }
};

module.exports = { authMiddleware, adminMiddleware };
