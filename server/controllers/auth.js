const { db, admin } = require("../firebase/firebase");

const authController = {
  async register(req, res) {
    try {
      const { email, password, firstName, lastName } = req.body;
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
      });
      await db.collection("users").doc(userRecord.uid).set({
        email,
        firstName,
        lastName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
        },
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const userRecord = await admin.auth().getUserByEmail(email);

      const token = await admin.auth().createCustomToken(userRecord.uid);

      res.json({
        token,
        user: {
          id: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
        },
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(401).json({ error: "Invalid credentials" });
    }
  },

  async logout(req, res) {
    try {
      const userId = req.user.uid;

      await admin.auth().revokeRefreshTokens(userId);

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getProfile(req, res) {
    try {
      const userId = req.user.uid;
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: userDoc.id,
        ...userDoc.data(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = authController;
