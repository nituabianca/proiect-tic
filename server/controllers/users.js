// backend/controllers/userController.js
const userService = require("../services/user");

const userController = {
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getUserById(req, res) {
    try {
      // The middleware (isOwnerOrAdmin) has already authorized this request.
      const user = await userService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateUser(req, res) {
    try {
      // The middleware (isOwnerOrAdmin) has already authorized this request.
      const updatedUser = await userService.updateUser(req.params.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found." });
      }
      // The cache invalidation is now correctly handled by the service.
      res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteUser(req, res) {
    try {
      // The middleware (isAdmin) has already authorized this request.
      const result = await userService.deleteUser(req.params.id);
      if (!result.success) {
        return res.status(404).json({ error: result.message });
      }
      // The cache invalidation is correctly handled by the service.
      res.status(200).json({ message: result.message });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = userController;
