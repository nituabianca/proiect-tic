const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * 1. Base Authentication: Verifies the JWT.
 * This should run first for any protected route. It checks for a valid token
 * and attaches the user payload { id, email, role } to the request object.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No authentication token provided or format is invalid." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user payload
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Authentication token has expired." });
    }
    return res.status(401).json({ error: "Unauthorized. Token is invalid." });
  }
};

/**
 * 2. Admin Authorization: Checks for 'admin' role.
 * This must run *after* verifyToken.
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: "Forbidden. This action requires admin privileges." });
};

/**
 * 3. Ownership Authorization: Checks if the user owns the resource or is an admin.
 * This is perfect for routes like GET/PUT /api/users/:id.
 * It must run *after* verifyToken.
 */
const isOwnerOrAdmin = (req, res, next) => {
    // req.user.id comes from the token. req.params.id comes from the URL.
  if (req.user && (req.user.id === req.params.id || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden. You do not have permission to access this resource." });
};

module.exports = {
  verifyToken,
  isAdmin,
  isOwnerOrAdmin,
};
