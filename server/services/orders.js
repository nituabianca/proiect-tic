// backend/services/orderService.js
const { db, admin } = require("../firebase/firebase");
const { deleteCache } = require("../utils/cache");
const libraryService = require("./library");

/**
 * Creates an order, securely calculates the total amount on the backend,
 * and denormalizes the user's email onto the order document.
 */
const createOrder = async (orderData) => {
  try {
    const { userId, items } = orderData;
    if (!items || items.length === 0) throw new Error("Cannot create an order with no items.");

    const bookIds = items.map(item => item.bookId);
    const booksSnapshot = await db.collection('books').where(admin.firestore.FieldPath.documentId(), 'in', bookIds).get();
    const priceMap = {};
    booksSnapshot.forEach(doc => { priceMap[doc.id] = doc.data().price; });

    let totalAmount = 0;
    const finalItems = items.map(item => {
      const price = priceMap[item.bookId];
      if (price === undefined) throw new Error(`Book with ID ${item.bookId} not found.`);
      totalAmount += price * item.quantity;
      return { ...item, priceAtPurchase: price };
    });

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found.");
    const userEmail = userDoc.data().email;

    const orderRef = db.collection("orders").doc();
    const newOrder = {
      userId, userEmail, items: finalItems, totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: "pending", createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await orderRef.set(newOrder);

    // --- ADDED LOGIC: Add purchased books to user's library ---
    const libraryUpdatePromises = finalItems.map(item =>
      libraryService.updateBookStatus(userId, item.bookId, 'in_library')
    );
    await Promise.all(libraryUpdatePromises);
    // --- END ADDED LOGIC ---

    return { id: orderRef.id, ...newOrder };
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error(`Failed to create order: ${error.message}`);
  }
};
/**
 * Fetches a paginated and/or filtered list of orders.
 */
const getOrders = async ({ limit = 15, startAfterId = null, filters = {} }) => {
  try {
    let query = db.collection("orders");

    if (filters.status) {
      query = query.where("status", "==", filters.status);
    }
    if (filters.searchQuery) {
      query = query.where("userEmail", "==", filters.searchQuery);
    }

    query = query.orderBy("createdAt", "desc");

    if (startAfterId) {
      const startAfterDoc = await db.collection("orders").doc(startAfterId).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.limit(limit).get();
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = orders.length < limit ? null : lastVisibleDoc?.id || null;

    return { orders, nextCursor };
  } catch (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }
};


const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const orderRef = db.collection("orders").doc(orderId);
    await orderRef.update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedDoc = await orderRef.get();
    if (!updatedDoc.exists) return null;

    const updatedOrder = { id: updatedDoc.id, ...updatedDoc.data() };

    // Invalidate caches if the status change is meaningful (e.g., delivered/completed)
    if (updatedOrder.userId && (newStatus === "delivered" || newStatus === "completed")) {
      console.log(`Invalidating caches for completed order for user: ${updatedOrder.userId}`);
      deleteCache(`user_read_book_ids_${updatedOrder.userId}`);
      deleteCache(`user_based_recommendations_${updatedOrder.userId}`);
      deleteCache(`item_based_recommendations_${updatedOrder.userId}`);
    }

    return updatedOrder;
  } catch (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }
};

const deleteOrder = async (orderId) => {
  try {
    const orderRef = db.collection("orders").doc(orderId);
    const doc = await orderRef.get();
    if (!doc.exists) return false;

    const orderData = doc.data();
    await orderRef.delete();

    // Invalidate caches using the userId from the deleted order
    if (orderData.userId) {
      console.log(`Invalidating caches for deleted order for user: ${orderData.userId}`);
      deleteCache(`user_read_book_ids_${orderData.userId}`);
      deleteCache(`user_based_recommendations_${orderData.userId}`);
      deleteCache(`item_based_recommendations_${orderData.userId}`);
    }
    
    return true;
  } catch (error) {
    throw new Error(`Failed to delete order: ${error.message}`);
  }
};

const getAllOrders = async () => {
  try {
    const snapshot = await db.collection("orders").get();
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return orders;
  } catch (error) {
    console.error("Error fetching all orders:", error);
    throw new Error("Failed to fetch all orders");
  }
};

const getOrdersByUserId = async (userId) => {
  try {
    const snapshot = await db
      .collection("orders")
      .where("userId", "==", userId)
      .get();
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return orders;
  } catch (error) {
    console.error("Error fetching orders by user ID:", error);
    throw new Error("Failed to fetch orders by user ID");
  }
};

const getOrderById = async (orderId) => {
  try {
    const doc = await db.collection("orders").doc(orderId).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    throw new Error("Failed to fetch order by ID");
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrders,
  getOrdersByUserId,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
