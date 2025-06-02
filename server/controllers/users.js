// backend/controllers/userController.js
const userService = require("../services/user");
const { deleteCache } = require("../utils/cache"); // Import deleteCache

const userController = {
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getUserById(req, res) {
    try {
      const user = await userService.queryById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
      res.json(user);
    } catch (error) {
      console.error("Error getting user by ID:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateUser(req, res) {
    try {
      const userId = req.params.id; // User ID from URL
      const updateData = req.body; // Data to update

      const updatedUser = await userService.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found." });
      }

      // Invalidate user-specific caches if user data changes
      // especially if preferences or other fields affecting recommendations change
      deleteCache(`user_ratings_map_${userId}`);
      deleteCache(`user_based_recommendations_${userId}`);
      deleteCache(`item_based_recommendations_${userId}`);
      deleteCache(`similar_users_${userId}`);
      // If user's read book progress changes (handled via order/rating controller)
      // deleteCache(`user_read_book_ids_${userId}`); // This key would be in bookService.js if we cached it.

      res.json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      const success = await userService.deleteUser(userId); // This is where the magic happens
      if (!success) {
        return res
          .status(404)
          .json({ error: "User not found or could not be deleted." });
      }
      // Invalidate all caches related to this user
      deleteCache(`user_ratings_map_${userId}`);
      deleteCache(`user_based_recommendations_${userId}`);
      deleteCache(`item_based_recommendations_${userId}`);
      deleteCache(`similar_users_${userId}`);
      // Clear specific read book IDs for this user
      deleteCache(`user_read_book_ids_${userId}`); // Assuming this cache key exists in bookService

      res.json({ message: "User and associated data deleted successfully." });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = userController;
