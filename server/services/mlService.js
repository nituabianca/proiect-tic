// backend/services/mlService.js
const { db } = require("../firebase/firebase");
const { getCache, setCache, deleteCache } = require("../utils/cache");

// Cache TTLs (Time To Live) in milliseconds
const USER_RATINGS_CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour
const ALL_RATINGS_CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour
const SIMILAR_USERS_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
const SIMILAR_BOOKS_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
const RECOMMENDATIONS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes (personal recommendations might change faster)
const ALL_BOOKS_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours for all books data (used by getPopularBooks if applicable)

// --- Helper Functions to Fetch Ratings (with Caching) ---

const getUserRatingsMap = async (userId) => {
  const cacheKey = `user_ratings_map_${userId}`;
  let ratingsMap = getCache(cacheKey);
  if (ratingsMap) {
    return ratingsMap;
  }

  const snapshot = await db
    .collection("ratings")
    .where("userId", "==", userId)
    .get();
  ratingsMap = {};
  snapshot.forEach((doc) => {
    const data = doc.data();
    ratingsMap[data.bookId] = data.rating;
  });
  setCache(cacheKey, ratingsMap, USER_RATINGS_CACHE_TTL);
  return ratingsMap;
};

const getAllRatings = async () => {
  const cacheKey = `all_ratings`;
  let allRatings = getCache(cacheKey);
  if (allRatings) {
    return allRatings;
  }

  const snapshot = await db.collection("ratings").get();
  allRatings = [];
  snapshot.forEach((doc) => {
    allRatings.push(doc.data());
  });
  setCache(cacheKey, allRatings, ALL_RATINGS_CACHE_TTL);
  return allRatings;
};

const getAllUsersRatingsMap = async () => {
  const allRatings = await getAllRatings();
  const allUsersRatings = {}; // { userId: { bookId: rating, ... }, ... }
  allRatings.forEach((rating) => {
    if (!allUsersRatings[rating.userId]) {
      allUsersRatings[rating.userId] = {};
    }
    allUsersRatings[rating.userId][rating.bookId] = rating.rating;
  });
  return allUsersRatings;
};

const getAllBooksRatingsMap = async () => {
  const allRatings = await getAllRatings();
  const allBooksRatings = {}; // { bookId: { userId: rating, ... }, ... }
  allRatings.forEach((rating) => {
    if (!allBooksRatings[rating.bookId]) {
      allBooksRatings[rating.bookId] = {};
    }
    allBooksRatings[rating.bookId][rating.userId] = rating.rating;
  });
  return allBooksRatings;
};

// --- Similarity Calculation ---

// Cosine Similarity between two rating vectors
const calculateCosineSimilarity = (vec1, vec2) => {
  const commonKeys = Object.keys(vec1).filter((key) =>
    Object.prototype.hasOwnProperty.call(vec2, key)
  );

  if (commonKeys.length === 0) {
    return 0; // No common items, similarity 0
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (const key of commonKeys) {
    dotProduct += vec1[key] * vec2[key];
  }

  for (const key of Object.keys(vec1)) {
    magnitude1 += vec1[key] ** 2;
  }
  for (const key of Object.keys(vec2)) {
    magnitude2 += vec2[key] ** 2;
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
};

// --- User-Based Collaborative Filtering ---

const findSimilarUsers = async (targetUserId, topN = 5) => {
  const cacheKey = `similar_users_${targetUserId}`;
  let similarUsers = getCache(cacheKey);
  if (similarUsers) {
    return similarUsers;
  }

  const targetUserRatings = await getUserRatingsMap(targetUserId);
  if (Object.keys(targetUserRatings).length === 0) {
    setCache(cacheKey, [], SIMILAR_USERS_CACHE_TTL);
    return [];
  }

  const allUsersRatings = await getAllUsersRatingsMap();
  const similarities = [];

  for (const userId of Object.keys(allUsersRatings)) {
    if (userId === targetUserId) continue;

    const similarity = calculateCosineSimilarity(
      targetUserRatings,
      allUsersRatings[userId]
    );
    if (similarity > 0) {
      similarities.push({ userId, similarity });
    }
  }

  similarities.sort((a, b) => b.similarity - a.similarity);
  similarUsers = similarities.slice(0, topN);
  setCache(cacheKey, similarUsers, SIMILAR_USERS_CACHE_TTL);
  return similarUsers;
};

const getUserBasedRecommendations = async (
  targetUserId,
  numRecommendations = 5
) => {
  const cacheKey = `user_based_recommendations_${targetUserId}_${numRecommendations}`; // Include num in cache key
  let cachedRecs = getCache(cacheKey);
  if (cachedRecs) {
    return cachedRecs;
  }

  const similarUsers = await findSimilarUsers(targetUserId, 10);
  if (similarUsers.length === 0) {
    setCache(cacheKey, [], RECOMMENDATIONS_CACHE_TTL);
    return [];
  }

  const targetUserRatings = await getUserRatingsMap(targetUserId);
  const recommendedBookScores = {};

  for (const { userId: similarUserId, similarity } of similarUsers) {
    const similarUserRatings = await getUserRatingsMap(similarUserId);
    for (const bookId of Object.keys(similarUserRatings)) {
      if (!Object.prototype.hasOwnProperty.call(targetUserRatings, bookId)) {
        if (!recommendedBookScores[bookId]) {
          recommendedBookScores[bookId] = 0;
        }
        recommendedBookScores[bookId] +=
          similarUserRatings[bookId] * similarity;
      }
    }
  }

  const sortedRecommendedBookIds = Object.entries(recommendedBookScores)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([bookId]) => bookId);

  const recommendedBooksDetails = [];
  for (const bookId of sortedRecommendedBookIds) {
    if (recommendedBooksDetails.length >= numRecommendations) break;
    const bookDoc = await db.collection("books").doc(bookId).get();
    if (bookDoc.exists) {
      recommendedBooksDetails.push({ id: bookDoc.id, ...bookDoc.data() });
    }
  }
  setCache(cacheKey, recommendedBooksDetails, RECOMMENDATIONS_CACHE_TTL);
  return recommendedBooksDetails;
};

// --- Item-Based Collaborative Filtering ---

const findSimilarBooks = async (targetBookId, topN = 5) => {
  const cacheKey = `similar_books_${targetBookId}_${topN}`; // Include topN in cache key
  let similarBooks = getCache(cacheKey);
  if (similarBooks) {
    return similarBooks;
  }

  const allBooksRatings = await getAllBooksRatingsMap();
  const targetBookRatings = allBooksRatings[targetBookId];

  if (!targetBookRatings || Object.keys(targetBookRatings).length === 0) {
    setCache(cacheKey, [], SIMILAR_BOOKS_CACHE_TTL);
    return [];
  }

  const similarities = [];
  for (const bookId of Object.keys(allBooksRatings)) {
    if (bookId === targetBookId) continue;

    const similarity = calculateCosineSimilarity(
      targetBookRatings,
      allBooksRatings[bookId]
    );
    if (similarity > 0) {
      similarities.push({ bookId, similarity });
    }
  }

  similarities.sort((a, b) => b.similarity - a.similarity);
  similarBooks = similarities.slice(0, topN);
  setCache(cacheKey, similarBooks, SIMILAR_BOOKS_CACHE_TTL);
  return similarBooks;
};

const getItemBasedRecommendations = async (
  targetUserId,
  numRecommendations = 5
) => {
  const cacheKey = `item_based_recommendations_${targetUserId}_${numRecommendations}`; // Include num in cache key
  let cachedRecs = getCache(cacheKey);
  if (cachedRecs) {
    return cachedRecs;
  }

  const userRatings = await getUserRatingsMap(targetUserId);
  if (Object.keys(userRatings).length === 0) {
    setCache(cacheKey, [], RECOMMENDATIONS_CACHE_TTL);
    return [];
  }

  const recommendedBookScores = {};

  for (const ratedBookId of Object.keys(userRatings)) {
    const userRatingForBook = userRatings[ratedBookId];
    const similarBooks = await findSimilarBooks(ratedBookId, 5); // Fetch a few similar books

    for (const { bookId: similarBookId, similarity } of similarBooks) {
      if (!Object.prototype.hasOwnProperty.call(userRatings, similarBookId)) {
        if (!recommendedBookScores[similarBookId]) {
          recommendedBookScores[similarBookId] = 0;
        }
        recommendedBookScores[similarBookId] += userRatingForBook * similarity;
      }
    }
  }

  const sortedRecommendedBookIds = Object.entries(recommendedBookScores)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([bookId]) => bookId);

  const recommendedBooksDetails = [];
  for (const bookId of sortedRecommendedBookIds) {
    if (recommendedBooksDetails.length >= numRecommendations) break;
    const bookDoc = await db.collection("books").doc(bookId).get();
    if (bookDoc.exists) {
      recommendedBooksDetails.push({ id: bookDoc.id, ...bookDoc.data() });
    }
  }
  setCache(cacheKey, recommendedBooksDetails, RECOMMENDATIONS_CACHE_TTL);
  return recommendedBooksDetails;
};

// --- Other potential algorithms (Conceptual/Future) ---

const getPopularBooks = async (num = 5) => {
  const cacheKey = `popular_books_${num}`;
  let popularBooks = getCache(cacheKey);
  if (popularBooks) {
    return popularBooks;
  }

  // Assuming 'averageRating' and 'numRatings' fields exist on books
  const snapshot = await db
    .collection("books")
    .orderBy("numRatings", "desc") // Or based on averageRating, or a combination
    .limit(num)
    .get();
  popularBooks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  setCache(cacheKey, popularBooks, ALL_BOOKS_CACHE_TTL);
  return popularBooks;
};

const getTrendingBooks = async (num = 5) => {
  const cacheKey = `trending_books_${num}`;
  let trendingBooks = getCache(cacheKey);
  if (trendingBooks) {
    return trendingBooks;
  }

  // This is a placeholder for trending. A true trending algorithm would involve:
  // - Tracking recent views, purchases, or new ratings.
  // - Weighting recent activity higher.
  // For this example, we'll sort recently added books by their average rating.
  const snapshot = await db
    .collection("books")
    .orderBy("createdAt", "desc") // Assuming a 'createdAt' timestamp field
    .limit(num * 2) // Fetch a few more to filter/sort
    .get();

  trendingBooks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Refine trending: filter out books with no ratings, sort by averageRating
  trendingBooks = trendingBooks
    .filter((book) => book.averageRating > 0) // Only show rated books as trending
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, num); // Take the top 'num' after sorting

  setCache(cacheKey, trendingBooks, RECOMMENDATIONS_CACHE_TTL); // Trending changes faster, so a shorter TTL
  return trendingBooks;
};

module.exports = {
  getUserBasedRecommendations,
  getItemBasedRecommendations,
  getPopularBooks,
  getTrendingBooks,
};
