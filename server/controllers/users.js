const { db, admin } = require("../firebase/firebase");
const { generateMockUser } = require("../helpers/users");

const userController = {
  async generateMockUsers(req, res) {
    try {
      const usersCount = req.body.users_count || 10;
      const batch = db.batch();
      const generatedUsers = [];

      for (let i = 0; i < usersCount; i++) {
        const mockUser = generateMockUser();
        const docRef = db.collection("users").doc();

        try {
          const userRecord = await admin.auth().createUser({
            email: mockUser.email,
            password: mockUser.password,
            displayName: `${mockUser.firstName} ${mockUser.lastName}`,
          });

          mockUser.id = userRecord.uid;
          batch.set(docRef, mockUser);
          generatedUsers.push(mockUser);
        } catch (error) {
          console.error(`Failed to create user ${mockUser.email}:`, error);
          continue;
        }
      }

      await batch.commit();
      console.log(`Generated ${generatedUsers.length} users`);

      return res.status(201).json({
        message: `${generatedUsers.length} users were generated successfully`,
        count: generatedUsers.length,
        users: generatedUsers.map((user) => ({
          ...user,
          password: undefined,
        })),
      });
    } catch (error) {
      console.error("Error generating users:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate users",
      });
    }
  },

  async getAllUsers(req, res) {
    try {
      const snapshot = await db.collection("users").get();
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getUserById(req, res) {
    try {
      const doc = await db.collection("users").doc(req.params.id).get();

      if (!doc.exists) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: doc.id,
        ...doc.data(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateUser(req, res) {
    try {
      const userId = req.params.id;
      const updateData = req.body;
      const userRef = db.collection("users").doc(userId);

      // Update in Firestore
      await userRef.update({
        ...updateData,
        updatedAt: new Date(),
      });

      if (updateData.firstName || updateData.lastName) {
        const newDisplayName = `${updateData.firstName || ""} ${
          updateData.lastName || ""
        }`.trim();
        await admin.auth().updateUser(userId, {
          displayName: newDisplayName,
        });
      }

      const updated = await userRef.get();
      res.json({
        id: updated.id,
        ...updated.data(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      await admin.auth().deleteUser(userId);

      await db.collection("users").doc(userId).delete();

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getUserOrders(req, res) {
    try {
      const userId = req.params.id;
      const ordersSnapshot = await db
        .collection("orders")
        .where("userId", "==", userId)
        .get();

      const orders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = userController;
