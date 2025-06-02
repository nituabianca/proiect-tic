// backend/controllers/orderController.js
const orderService = require("../services/orders");
const { deleteCache } = require("../utils/cache"); // Import deleteCache

const orderController = {
  async createOrder(req, res) {
    try {
      const userId = req.user.uid;
      const orderData = { ...req.body, userId }; // Ensure userId is set

      const newOrder = await orderService.createOrder(orderData);

      // Invalidate relevant user's read book IDs cache and recommendations
      deleteCache(`user_read_book_ids_${userId}`);
      deleteCache(`user_based_recommendations_${userId}`);
      deleteCache(`item_based_recommendations_${userId}`);

      res
        .status(201)
        .json({ message: "Order created successfully", order: newOrder });
    } catch (error) {
      console.error("Error creating order:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to create order" });
    }
  },

  async getAllOrders(req, res) {
    try {
      const orders = await orderService.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error getting all orders:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getUserOrders(req, res) {
    try {
      // Allow admin to get other user's orders, otherwise default to current user
      const userId =
        req.user.role === "admin" && req.params.userId
          ? req.params.userId
          : req.user.uid;
      const orders = await orderService.getOrdersByUserId(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error getting user orders:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getOrderById(req, res) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }
      res.json(order);
    } catch (error) {
      console.error("Error getting order by ID:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateOrderStatus(req, res) {
    try {
      const { status } = req.body;
      const updatedOrder = await orderService.updateOrderStatus(
        req.params.id,
        status
      );
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found." });
      }

      // If order status implies reading progress (e.g., "completed"), invalidate caches.
      // This logic depends on how you track `user_book_progress`.
      // For now, let's assume if an order is completed, it contributes to read books.
      if (updatedOrder.userId && status === "completed") {
        // This assumes the `user_book_progress` collection is updated separately
        // (e.g., a "mark as read" endpoint). If marking an order complete also marks books as read,
        // then these cache invalidations are relevant.
        deleteCache(`user_read_book_ids_${updatedOrder.userId}`);
        deleteCache(`user_based_recommendations_${updatedOrder.userId}`);
        deleteCache(`item_based_recommendations_${updatedOrder.userId}`);
      }

      res.json({
        message: "Order status updated successfully",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async deleteOrder(req, res) {
    try {
      const order = await orderService.getOrderById(req.params.id); // Get order first to know userId
      const success = await orderService.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Order not found." });
      }

      // If deleting an order means books are no longer "read" (unlikely, but for completeness)
      if (order && order.userId) {
        deleteCache(`user_read_book_ids_${order.userId}`);
        deleteCache(`user_based_recommendations_${order.userId}`);
        deleteCache(`item_based_recommendations_${order.userId}`);
      }

      res.json({ message: "Order deleted successfully." });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = orderController;
