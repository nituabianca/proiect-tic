const { db, admin } = require("../firebase/firebase");

const authController = {
  async register(req, res) {
    try {
      const { email, password, firstName, lastName } = req.body;

      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        emailVerified: false,
      });

      const link = await admin.auth().generateEmailVerificationLink(email);

      await db.collection("users").doc(userRecord.uid).set({
        email,
        firstName,
        lastName,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.status(201).json({
        message:
          "User registered successfully. Please check your email for verification.",
        verificationLink: link,
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
      const { email } = req.body;
      console.log("Login attempt for:", email);

      const userRecord = await admin.auth().getUserByEmail(email);
      console.log("Found user:", userRecord.uid);

      if (!userRecord.emailVerified) {
        return res.status(403).json({
          error: "Email not verified",
          needsVerification: true,
        });
      }

      const userDoc = await db.collection("users").doc(userRecord.uid).get();
      const userData = userDoc.data();
      console.log("Got user data from Firestore");

      res.json({
        token: userRecord.uid, // Just use the UID as the token
        user: {
          id: userRecord.uid,
          email: userRecord.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          emailVerified: userRecord.emailVerified,
        },
      });

      console.log("Login successful");
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({
        error: "Invalid credentials",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  async logout(req, res) {
    try {
      const userId = req.user.uid;

      await admin.auth().revokeRefreshTokens(userId);

      await db.collection("users").doc(userId).update({
        lastLogout: new Date(),
        updatedAt: new Date(),
      });

      res.json({
        message: "Logged out successfully",
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Failed to logout" });
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
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async verifyEmail(req, res) {
    try {
      const { oobCode } = req.body;
      console.log("Attempting to verify email with code:", oobCode);

      // Get user details before verification
      const userRecord = await admin.auth().getUser(req.user.uid);
      console.log("User before verification:", {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
      });

      await admin.auth().updateUser(userRecord.uid, {
        emailVerified: true,
      });

      const updatedUserRecord = await admin.auth().getUser(userRecord.uid);
      console.log("User after verification:", {
        uid: updatedUserRecord.uid,
        email: updatedUserRecord.email,
        emailVerified: updatedUserRecord.emailVerified,
      });

      await db.collection("users").doc(userRecord.uid).update({
        emailVerified: true,
        updatedAt: new Date(),
      });

      const userDoc = await db.collection("users").doc(userRecord.uid).get();
      console.log("Firestore user data:", userDoc.data());

      res.json({
        message: "Email verified successfully",
        status: updatedUserRecord.emailVerified,
      });
    } catch (error) {
      console.error("Error in email verification:", error);
      res
        .status(400)
        .json({ error: "Email verification failed: " + error.message });
    }
  },

  async resendVerificationEmail(req, res) {
    try {
      const { email } = req.body;
      const userRecord = await admin.auth().getUserByEmail(email);

      if (userRecord.emailVerified) {
        return res.status(400).json({ error: "Email is already verified" });
      }

      const link = await admin.auth().generateEmailVerificationLink(email);
      res.json({
        message: "Verification email sent successfully",
        verificationLink: link,
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async checkVerificationStatus(req, res) {
    try {
      const { email } = req.query;
      const userRecord = await admin.auth().getUserByEmail(email);

      console.log("Checking verification status for:", email);
      console.log("Status in Firebase Auth:", userRecord.emailVerified);

      const userDoc = await db.collection("users").doc(userRecord.uid).get();
      const firestoreData = userDoc.data();
      console.log("Status in Firestore:", firestoreData.emailVerified);

      res.json({
        email: userRecord.email,
        firebaseAuthVerified: userRecord.emailVerified,
        firestoreVerified: firestoreData.emailVerified,
        userId: userRecord.uid,
      });
    } catch (error) {
      console.error("Error checking verification status:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async syncVerificationStatus(req, res) {
    try {
      const { email } = req.query;

      const userRecord = await admin.auth().getUserByEmail(email);

      await db.collection("users").doc(userRecord.uid).update({
        emailVerified: userRecord.emailVerified,
        updatedAt: new Date(),
      });

      res.json({
        message: "Verification status synced successfully",
        email: userRecord.email,
        firebaseAuthVerified: userRecord.emailVerified,
        firestoreVerified: userRecord.emailVerified,
        userId: userRecord.uid,
      });
    } catch (error) {
      console.error("Error syncing verification status:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getVerificationStatus(req, res) {
    try {
      const userRecord = await admin.auth().getUser(req.user.uid);
      res.json({
        emailVerified: userRecord.emailVerified,
      });
    } catch (error) {
      console.error("Error getting verification status:", error);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = authController;
