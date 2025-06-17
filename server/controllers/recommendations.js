const recommendationService = require("../services/recommendations");

const recommendationsController = {
  async getRecommendations(req, res) {
    try {
      // The user ID is securely provided by the verifyToken middleware.
      const userId = req.user.id;
      
      const recommendations = await recommendationService.getHybridRecommendationsForUser(userId);
      
      res.status(200).json(recommendations);
    } catch (error) {
      console.error("Error in recommendationsController:", error);
      res.status(500).json({ error: "Failed to retrieve recommendations." });
    }
  },
};

module.exports = recommendationsController;
