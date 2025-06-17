// backend/services/orderService.js
const { db, admin } = require("../firebase/firebase");
const { deleteCache } = require("../utils/cache");

const createOrder = async (orderData) => {
  try {
    const orderRef = db.collection("orders").doc();
    const newOrder = {
      ...orderData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: orderData.status || "pending",
    };
    await orderRef.set(newOrder);

    // Invalidate caches as a side-effect of creating an order.
    console.log(`Invalidating caches for new order by user: ${orderData.userId}`);
    deleteCache(`user_read_book_ids_${orderData.userId}`);
    deleteCache(`user_based_recommendations_${orderData.userId}`);
    deleteCache(`item_based_recommendations_${orderData.userId}`);

    return { id: orderRef.id, ...newOrder };
  } catch (error) {
    throw new Error(`Failed to create order: ${error.message}`);
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
  getOrdersByUserId,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
