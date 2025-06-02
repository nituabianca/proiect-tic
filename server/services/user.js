// backend/services/userService.js
const { db, admin } = require("../firebase/firebase");
const { batchDelete } = require("../utils/firestoreBatchDelete"); // NEW: Import batchDelete
const { deleteCache } = require("../utils/cache"); // Make sure this is imported if not already

const queryByEmail = async (email) => {
  try {
    const snapshot = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (err) {
    console.error("Error occurred while querying user by email:", err);
    throw new Error("Failed to query user by email");
  }
};

const queryById = async (uid) => {
  try {
    const snapshot = await db.collection("users").doc(uid).get();

    if (snapshot.exists) {
      return { id: snapshot.id, ...snapshot.data() };
    }
    return null;
  } catch (err) {
    console.error("Error occurred while querying user by ID:", err);
    throw new Error("Failed to query user by ID");
  }
};

const getAllUsers = async () => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return users;
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw new Error("Failed to fetch all users");
  }
};

const updateUser = async (userId, updateData) => {
  try {
    const userRef = db.collection("users").doc(userId);
    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date(),
    };
    await userRef.update(dataToUpdate);
    const updatedDoc = await userRef.get();

    // Invalidate user-specific caches if user data changes
    deleteCache(`user_ratings_map_${userId}`);
    deleteCache(`user_based_recommendations_${userId}`);
    deleteCache(`item_based_recommendations_${userId}`);
    deleteCache(`similar_users_${userId}`);
    deleteCache(`user_read_book_ids_${userId}`); // If read book status could change via user update

    return updatedDoc.exists
      ? { id: updatedDoc.id, ...updatedDoc.data() }
      : null;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw new Error("Failed to update user");
  }
};

const deleteUser = async (userId) => {
  try {
    // 1. Check if user exists in Firestore before proceeding
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      console.warn(
        `User with ID ${userId} not found in Firestore. Skipping data deletion.`
      );
      // Even if not in Firestore, try to delete from Auth, just in case of inconsistency
      try {
        await admin.auth().deleteUser(userId);
        console.log(
          `User ${userId} successfully deleted from Firebase Auth (not found in Firestore).`
        );
        return true;
      } catch (authError) {
        if (authError.code === "auth/user-not-found") {
          console.log(`User ${userId} also not found in Firebase Auth.`);
          return false;
        }
        console.error(
          `Error deleting user ${userId} from Firebase Auth:`,
          authError
        );
        throw new Error("Failed to delete user from authentication");
      }
    }

    // --- Start Data Deletion/Anonymization ---

    // Delete user's document from Firestore
    await userDocRef.delete();
    console.log(`User document ${userId} deleted from Firestore.`);

    // Delete all ratings by this user
    console.log(`Deleting ratings for user ${userId}...`);
    const ratingsDeleted = await batchDelete(
      db.collection("ratings").where("userId", "==", userId)
    );
    console.log(`Deleted ${ratingsDeleted} ratings for user ${userId}.`);

    // Delete all book progress entries by this user
    console.log(`Deleting book progress for user ${userId}...`);
    const progressDeleted = await batchDelete(
      db.collection("user_book_progress").where("userId", "==", userId)
    );
    console.log(
      `Deleted ${progressDeleted} book progress entries for user ${userId}.`
    );

    // Anonymize orders for this user (due to potential legal retention requirements)
    console.log(`Anonymizing orders for user ${userId}...`);
    let ordersAnonymizedCount = 0;
    let lastOrderDoc = null;
    let hasMoreOrders = true;

    while (hasMoreOrders) {
      let orderQuery = db
        .collection("orders")
        .where("userId", "==", userId)
        .limit(500);
      if (lastOrderDoc) {
        orderQuery = orderQuery.startAfter(lastOrderDoc);
      }

      const orderSnapshot = await orderQuery.get();
      if (orderSnapshot.empty) {
        hasMoreOrders = false;
        break;
      }

      const batch = db.batch();
      orderSnapshot.docs.forEach((doc) => {
        // Remove personally identifiable information from the order document
        // Keep critical financial/product data, but sever link to personal identity
        batch.update(doc.ref, {
          userId: admin.firestore.FieldValue.delete(), // Remove the direct link
          // Add any other PII fields you might have in your order document
          // Example: customerName: admin.firestore.FieldValue.delete(),
          // shippingAddress: admin.firestore.FieldValue.delete(),
          // email: admin.firestore.FieldValue.delete(),
          isAnonymized: true, // Mark it as anonymized for clarity
          anonymizedAt: new Date(),
        });
        ordersAnonymizedCount++;
      });

      await batch.commit();
      lastOrderDoc = orderSnapshot.docs[orderSnapshot.docs.length - 1];
      if (orderSnapshot.docs.length < 500) {
        hasMoreOrders = false;
      }
    }
    console.log(
      `Anonymized ${ordersAnonymizedCount} orders for user ${userId}.`
    );

    // Delete user from Firebase Authentication
    await admin.auth().deleteUser(userId);
    console.log(
      `User ${userId} successfully deleted from Firebase Authentication.`
    );

    // Invalidate all caches related to this user after successful deletion
    deleteCache(`user_ratings_map_${userId}`);
    deleteCache(`user_based_recommendations_${userId}`);
    deleteCache(`item_based_recommendations_${userId}`);
    deleteCache(`similar_users_${userId}`);
    deleteCache(`user_read_book_ids_${userId}`);
    deleteCache(`all_ratings`); // All ratings dataset changed

    return true;
  } catch (error) {
    // Log the error in detail for debugging
    console.error(
      `Failed to delete user ${userId} and associated data:`,
      error
    );
    throw new Error(
      `Failed to delete user: ${error.message || "Unknown error"}`
    );
  }
};

module.exports = {
  queryByEmail,
  queryById,
  getAllUsers,
  updateUser,
  deleteUser,
};
