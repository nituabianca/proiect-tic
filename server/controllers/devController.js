const devService = require("../services/devService");

// Helper function to handle boilerplate try/catch
const runDevAction = (serviceFn) => async (req, res) => {
  try {
    const result = await serviceFn(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error(`Error in dev action: ${serviceFn.name}`, error);
    res.status(500).json({ error: error.message });
  }
};

const devController = {
  seedBooks: runDevAction(devService.seedBooks),
  seedUsers: runDevAction(devService.seedUsers),
  seedOrders: runDevAction(devService.seedOrders),
  deleteBooks: runDevAction(devService.deleteBooks),
  deleteUsers: runDevAction(devService.deleteUsers),
  deleteOrders: runDevAction(devService.deleteOrders),
  deleteRatings: runDevAction(devService.deleteRatings),
  resetDatabase: runDevAction(devService.resetDatabase),
  seedDatabase: runDevAction(devService.seedDatabase),
};

module.exports = devController;

module.exports = devController;