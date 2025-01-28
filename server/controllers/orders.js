const db = require("../firebase/firebase");
const { generateMockOrder } = require("../helpers/orders");

const orderController = {
  async createOrder(req, res) {
    try {
      const orderData = req.body;
      const docRef = await db.collection("orders").add({
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const newOrder = await docRef.get();

      res.status(201).json({
        id: docRef.id,
        ...newOrder.data(),
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getAllOrders(req, res) {
    try {
      const snapshot = await db.collection("orders").get();
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getOrderById(req, res) {
    try {
      const doc = await db.collection("orders").doc(req.params.id).get();

      if (!doc.exists) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({
        id: doc.id,
        ...doc.data(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateOrder(req, res) {
    try {
      const orderId = req.params.id;
      const updateData = req.body;
      const orderRef = db.collection("orders").doc(orderId);

      await orderRef.update({
        ...updateData,
        updatedAt: new Date(),
      });

      const updated = await orderRef.get();
      res.json({
        id: updated.id,
        ...updated.data(),
      });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getOrdersByStatus(req, res) {
    try {
      const { status } = req.params;
      const snapshot = await db
        .collection("orders")
        .where("orderStatus", "==", status)
        .get();

      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json(orders);
    } catch (error) {
      console.error("Error getting orders by status:", error);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = orderController;
