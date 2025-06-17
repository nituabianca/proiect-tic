// backend/services/user.service.js

const { db, admin } = require("../firebase/firebase");
const { batchDelete } = require("../utils/firestoreBatchDelete");
const { deleteCache } = require("../utils/cache");

// Renamed for clarity
const getUserById = async (userId) => {
  try {
    const doc = await db.collection("users").doc(userId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user by ID ${userId}:`, error);
    throw new Error("Failed to query user by ID");
  }
};

const getAllUsers = async () => {
  try {
    const snapshot = await db.collection("users").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw new Error("Failed to fetch all users");
  }
};

const updateUser = async (userId, updateData) => {
  try {
    const userRef = db.collection("users").doc(userId);

    // Prevent a user from elevating their own role
    const { role, ...safeUpdateData } = updateData;

    await userRef.update({
      ...safeUpdateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    const updatedDoc = await userRef.get();

    // The service layer is responsible for data side-effects, including cache invalidation.
    // This logic is now correctly placed here.
    console.log(`Invalidating caches for updated user: ${userId}`);
    deleteCache(`user_ratings_map_${userId}`);
    deleteCache(`user_based_recommendations_${userId}`);
    // Add any other user-specific caches that might be affected by a profile update
    deleteCache(`similar_users_${userId}`);

    return updatedDoc.exists ? { id: updatedDoc.id, ...updatedDoc.data() } : null;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw new Error("Failed to update user");
  }
};

// This delete function is excellent. No changes needed to its core logic.
const deleteUser = async (userId) => {
  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.warn(`Attempted to delete non-existent Firestore user: ${userId}. Checking Auth...`);
      try {
        await admin.auth().deleteUser(userId);
        return { success: true, message: `User deleted from Auth only (was not in Firestore).` };
      } catch (authError) {
        if (authError.code === "auth/user-not-found") {
          console.log(`User ${userId} not found in Auth or Firestore.`);
          return { success: false, message: "User not found." };
        }
        throw authError; // Re-throw other auth errors
      }
    }

    // --- Data Deletion & Anonymization ---
    console.log(`Starting deletion process for user ${userId}...`);
    await userDocRef.delete();
    console.log(`- Deleted user document.`);

    const ratingsDeleted = await batchDelete(db.collection("ratings").where("userId", "==", userId));
    console.log(`- Deleted ${ratingsDeleted} ratings.`);

    // Anonymize Orders
    const ordersQuery = db.collection("orders").where("userId", "==", userId);
    const ordersSnapshot = await ordersQuery.get();
    if (!ordersSnapshot.empty) {
      const batch = db.batch();
      ordersSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
            userId: `ANONYMIZED_${userId}`, // Anonymize instead of deleting for record keeping
            isAnonymized: true,
            anonymizedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      await batch.commit();
      console.log(`- Anonymized ${ordersSnapshot.size} orders.`);
    }

    // Finally, delete from Firebase Auth
    await admin.auth().deleteUser(userId);
    console.log(`- Deleted user from Firebase Authentication.`);

    // Invalidate all related caches
    console.log(`- Invalidating caches for deleted user: ${userId}`);
    deleteCache(`user_ratings_map_${userId}`);
    deleteCache(`user_based_recommendations_${userId}`);
    deleteCache(`similar_users_${userId}`);
    deleteCache(`all_ratings`);

    return { success: true, message: "User and all associated data handled successfully." };
  } catch (error) {
    console.error(`Critical error during user deletion for ${userId}:`, error);
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

module.exports = {
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
};
