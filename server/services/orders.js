// backend/services/orderService.js
const { db } = require("../firebase/firebase");

const createOrder = async (orderData) => {
  try {
    const orderRef = db.collection("orders").doc(); // Let Firestore generate ID
    const newOrder = {
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: orderData.status || "pending", // Default status
    };
    await orderRef.set(newOrder);
    return { id: orderRef.id, ...newOrder };
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error("Failed to create order");
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

const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const orderRef = db.collection("orders").doc(orderId);
    await orderRef.update({
      status: newStatus,
      updatedAt: new Date(),
    });
    const updatedDoc = await orderRef.get();
    return updatedDoc.exists
      ? { id: updatedDoc.id, ...updatedDoc.data() }
      : null;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error("Failed to update order status");
  }
};

const deleteOrder = async (orderId) => {
  try {
    const docRef = db.collection("orders").doc(orderId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return false; // Order not found
    }
    await docRef.delete();
    return true;
  } catch (error) {
    console.error("Error deleting order:", error);
    throw new Error("Failed to delete order");
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
