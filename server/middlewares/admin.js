const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  if (req.user.role === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }
};

module.exports = adminMiddleware;
