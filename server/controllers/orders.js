const orderService = require("../services/orders");

const orderController = {
  async createOrder(req, res) {
    try {
      // The user ID comes securely from the verified token.
      const userId = req.user.id; 
      const newOrder = await orderService.createOrder({ ...req.body, userId });
      res.status(201).json({ message: "Order created successfully", order: newOrder });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // For admins to get all orders
  async getAllOrders(req, res) {
    try {
      const { limit, nextCursor, status, searchQuery } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (searchQuery) filters.searchQuery = searchQuery;

      const result = await orderService.getOrders({
        limit: parseInt(limit) || 15,
        startAfterId: nextCursor || null,
        filters,
      });

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // For a user to get their own orders
  async getMyOrders(req, res) {
    try {
      const orders = await orderService.getOrdersByUserId(req.user.id);
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // For an admin to get any user's orders
  async getUserOrders(req, res) {
    try {
      const orders = await orderService.getOrdersByUserId(req.params.userId);
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getOrderById(req, res) {
    try {
      // Middleware has already confirmed permission.
      const order = await orderService.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }
      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateOrderStatus(req, res) {
    try {
      const { status } = req.body;
      const updatedOrder = await orderService.updateOrderStatus(req.params.id, status);
      if (!updatedOrder) return res.status(404).json({ error: "Order not found." });
      res.status(200).json({ message: "Order status updated", order: updatedOrder });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteOrder(req, res) {
    try {
      const success = await orderService.deleteOrder(req.params.id);
      if(!success) return res.status(404).json({ error: "Order not found." });
      res.status(200).json({ message: "Order deleted successfully." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = orderController;
