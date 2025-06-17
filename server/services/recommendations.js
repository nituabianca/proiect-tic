// backend/services/recommendationService.js
const mlService = require("./mlService");
const bookService = require("./books");

/**
 * Generates a hybrid list of recommendations for a user.
 * It combines multiple strategies and provides a fallback to ensure recommendations are always available.
 * @param {string} userId The user to generate recommendations for.
 * @returns {Promise<Array<object>>} A final list of recommended books.
 */
const getHybridRecommendationsForUser = async (userId) => {
  const finalRecommendations = [];
  const recommendedIds = new Set();
  const readBookIds = await bookService.getReadBookIdsByUserId(userId);
  readBookIds.forEach(id => recommendedIds.add(id));

  const TARGET_COUNT = 10;

  // --- Strategy 1: User-Based Collaborative Filtering ---
  const userBasedRecs = await mlService.getUserBasedRecommendations(userId);
  for (const book of userBasedRecs) {
    if (finalRecommendations.length < TARGET_COUNT && !recommendedIds.has(book.id)) {
      finalRecommendations.push(book);
      recommendedIds.add(book.id);
    }
  }

  // --- Strategy 2 (Future): Item-Based Collaborative Filtering ---
  // You would add a call to mlService.getItemBasedRecommendations here
  // and loop through the results just like above.
    if (finalRecommendations.length < TARGET_COUNT) {
    const itemBasedRecs = await mlService.getItemBasedRecommendations(userId);
    for (const book of itemBasedRecs) {
      if (finalRecommendations.length < TARGET_COUNT && !recommendedIds.has(book.id)) {
        finalRecommendations.push(book);
        recommendedIds.add(book.id);
      }
    }
  }

  // --- Strategy 3 (Fallback): Popular Books ---
  // If we still don't have enough recommendations, fill the rest with popular books.
  if (finalRecommendations.length < TARGET_COUNT) {
    const popularBooks = await mlService.getPopularBooks(TARGET_COUNT * 2); // Get extra for filtering
    for (const book of popularBooks) {
      if (finalRecommendations.length < TARGET_COUNT && !recommendedIds.has(book.id)) {
        finalRecommendations.push(book);
        recommendedIds.add(book.id);
      }
    }
  }

  return finalRecommendations;
};

// --- NEW ORCHESTRATOR FUNCTION ---
/**
 * Gets recommendations for a specific book page (e.g., "More Like This").
 * @param {string} bookId The book to get similar items for.
 * @returns {Promise<Array<object>>} A list of similar books.
 */
const getRecommendationsForBookPage = async (bookId) => {
  return await mlService.getContentBasedSimilarities(bookId, 5);
};

module.exports = {
  getHybridRecommendationsForUser,
  getRecommendationsForBookPage, // Export the new function
};
