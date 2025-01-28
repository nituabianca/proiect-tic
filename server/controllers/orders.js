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

  async deleteOrder(req, res) {
    try {
      const orderId = req.params.id;
      await db.collection("orders").doc(orderId).delete();
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (
        ![
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ].includes(status)
      ) {
        return res.status(400).json({ error: "Invalid order status" });
      }

      const orderRef = db.collection("orders").doc(id);
      await orderRef.update({
        orderStatus: status,
        updatedAt: new Date(),
      });

      const updated = await orderRef.get();
      res.json({
        id: updated.id,
        ...updated.data(),
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async generateMockOrders(req, res) {
    try {
      const ordersCount = req.body.orders_count || 50;
      const batch = db.batch();
      const generatedOrders = [];

      for (let i = 0; i < ordersCount; i++) {
        const docRef = db.collection("orders").doc();
        const order = generateMockOrder();
        order.id = docRef.id;

        batch.set(docRef, order);
        generatedOrders.push(order);
      }

      await batch.commit();
      console.log(`Generated ${ordersCount} orders`);

      return res.status(201).json({
        message: `${ordersCount} orders were generated successfully`,
        count: generatedOrders.length,
        orders: generatedOrders,
      });
    } catch (error) {
      console.error("Error generating orders:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate orders",
      });
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
