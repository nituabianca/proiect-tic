const jwt = require("jsonwebtoken");
const orderService = require("../services/orders"); // Correctly imports orderService
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies the JWT from the Authorization header.
 * Attaches the user payload { id, email, role } to req.user.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No authentication token provided or format is invalid." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Authentication token has expired." });
    }
    return res.status(401).json({ error: "Unauthorized. Token is invalid." });
  }
};

/**
 * Checks if the authenticated user has the 'admin' role.
 * This must run *after* verifyToken.
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: "Forbidden. This action requires admin privileges." });
};

/**
 * Checks if the user owns the resource (e.g., a user profile) or is an admin.
 * It compares the token's user ID with the ID in the URL params.
 * This must run *after* verifyToken.
 */
const isOwnerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.id === req.params.id || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden. You do not have permission to access this resource." });
};

/**
 * Checks if the user owns a specific ORDER or is an admin.
 * It fetches the order to check its `userId` field.
 * This must run *after* verifyToken.
 */
const isOrderOwnerOrAdmin = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next(); // Admins can access any order
    }

    const orderId = req.params.id;
    const order = await orderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (order.userId === req.user.id) {
      return next();
    }

    return res.status(403).json({ error: "Forbidden. You do not have permission to access this order." });

  } catch (error) {
    console.error("Authorization Error in isOrderOwnerOrAdmin:", error);
    return res.status(500).json({ error: "An error occurred during authorization." });
  }
};


module.exports = {
  verifyToken,
  isAdmin,
  isOwnerOrAdmin,
  isOrderOwnerOrAdmin, // Make sure this is exported
};