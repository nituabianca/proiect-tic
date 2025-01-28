const db = require("../firebase/firebase");
const { generateMockOrder } = require("../helpers/orders");

const orderController = {
  // Create a new order
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
};

module.exports = orderController;
