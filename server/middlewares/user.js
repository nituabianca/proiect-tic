const userMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  // Verifică dacă ID-ul utilizatorului autentificat este același cu ID-ul din parametrii rutei
  // sau dacă utilizatorul autentificat este admin (adminii pot accesa datele oricui)
  if (req.user.uid === req.params.id || req.user.role === "admin") {
    next(); // Utilizatorul are permisiunea, continuă
  } else {
    res
      .status(403)
      .json({ error: "Access denied. You can only access your own data." });
  }
};

module.exports = userMiddleware;
