// backend/services/mlService.js
const { db } = require("../firebase/firebase");
const { getCache, setCache } = require("../utils/cache");

const ML_CACHE_TTL = 6 * 3600 * 1000; // Cache ML results for 6 hours

/**
 * Gets popular books based on the number of ratings.
 * This is a simple, non-personalized recommendation.
 * @param {number} limit - The number of popular books to return.
 * @returns {Promise<Array<object>>} A list of popular book objects.
 */
const getPopularBooks = async (limit = 10) => {
  const cacheKey = `popular_books_${limit}`;
  const cachedBooks = getCache(cacheKey);
  if (cachedBooks) return cachedBooks;

  try {
    const snapshot = await db.collection("books")
      .orderBy("numRatings", "desc")
      .limit(limit)
      .get();
      
    const books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCache(cacheKey, books, ML_CACHE_TTL);
    return books;
  } catch (error) {
    console.error("Error fetching popular books:", error);
    return []; // Return empty on error
  }
};

/**
 * Gets recommendations using User-Based Collaborative Filtering.
 * LOGIC: "Users who liked the same books as you also liked..."
 * 1. Find the books the target user has rated highly (4+).
 * 2. Find other users who have *also* rated those same books highly.
 * 3. Aggregate all the *other* books that this group of "similar users" liked.
 * 4. Return the most frequently liked books from that aggregate pool.
 * @param {string} userId - The ID of the user to get recommendations for.
 * @returns {Promise<Array<object>>} A list of recommended book objects.
 */
const getUserBasedRecommendations = async (userId, limit = 10) => {
  const cacheKey = `user_based_recommendations_${userId}`;
  const cachedRecs = getCache(cacheKey);
  if (cachedRecs) return cachedRecs;

  try {
    // Step 1: Find books the user loves.
    const userRatingsSnapshot = await db.collection("ratings")
      .where("userId", "==", userId)
      .where("rating", ">=", 4)
      .get();
    if (userRatingsSnapshot.empty) return [];
    const lovedBookIds = userRatingsSnapshot.docs.map(doc => doc.data().bookId);

    // Step 2 & 3: Find similar users and aggregate their loved books.
    const similarUsersRatingsSnapshot = await db.collection("ratings")
      .where("bookId", "in", lovedBookIds)
      .where("rating", ">=", 4)
      .where("userId", "!=", userId) // Exclude the user themselves
      .get();
    
    const potentialRecs = {}; // { bookId: count, ... }
    similarUsersRatingsSnapshot.forEach(doc => {
      const { bookId } = doc.data();
      potentialRecs[bookId] = (potentialRecs[bookId] || 0) + 1;
    });

    // Step 4: Sort by popularity among similar users and get book details.
    const sortedRecIds = Object.keys(potentialRecs)
      .sort((a, b) => potentialRecs[b] - potentialRecs[a]);

    if (sortedRecIds.length === 0) return [];
    
    // Fetch book details for the top recommendations
    const recsSnapshot = await db.collection("books")
      .where(admin.firestore.FieldPath.documentId(), "in", sortedRecIds.slice(0, limit))
      .get();
      
    const recommendations = recsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    setCache(cacheKey, recommendations, ML_CACHE_TTL);
    return recommendations;
  } catch (error) {
    console.error(`Error in getUserBasedRecommendations for ${userId}:`, error);
    return [];
  }
};

**
 * Gets recommendations using Item-Based Collaborative Filtering.
 * LOGIC: "If you liked these specific books, you might also like these other books that are often enjoyed by the same people."
 * 1. Find the books the target user has rated highly (the "seed" set).
 * 2. Find all *other users* who also rated any of those seed books highly.
 * 3. Look at all the *other* books this "fellow fan" group rated highly.
 * 4. Aggregate these other books, rank them by how many fellow fans liked them, and return the top results.
 * @param {string} userId The user to get recommendations for.
 * @returns {Promise<Array<object>>} A list of recommended book objects.
 */
const getItemBasedRecommendations = async (userId, limit = 10) => {
  const cacheKey = `item_based_recommendations_${userId}`;
  const cachedRecs = getCache(cacheKey);
  if (cachedRecs) {
    console.log(`[Cache] HIT for item-based recs: ${userId}`);
    return cachedRecs;
  }
  console.log(`[Cache] MISS for item-based recs: ${userId}. Calculating...`);

  try {
    // Step 1: Get user's highly-rated "seed" books
    const userRatingsSnapshot = await db.collection("ratings").where("userId", "==", userId).where("rating", ">=", 4).get();
    if (userRatingsSnapshot.empty) return [];
    const seedBookIds = userRatingsSnapshot.docs.map(doc => doc.data().bookId);

    // Step 2: Find "fellow fans"
    const fellowFansSnapshot = await db.collection("ratings").where("bookId", "in", seedBookIds).where("rating", ">=", 4).get();
    const fellowFanIds = [...new Set(fellowFansSnapshot.docs.map(doc => doc.data().userId))];

    // Step 3 & 4: Discover, aggregate, and filter what fellow fans liked
    if (fellowFanIds.length === 0) return [];
    const recsSnapshot = await db.collection("ratings").where("userId", "in", fellowFanIds).where("rating", ">=", 4).get();
    
    const potentialRecs = {};
    recsSnapshot.forEach(doc => {
      const { bookId } = doc.data();
      // Crucially, filter out books the user has already rated/read
      if (!seedBookIds.includes(bookId)) {
        potentialRecs[bookId] = (potentialRecs[bookId] || 0) + 1;
      }
    });

    const sortedRecIds = Object.keys(potentialRecs).sort((a, b) => potentialRecs[b] - potentialRecs[a]);
    if (sortedRecIds.length === 0) return [];

    // Step 5: Fetch book data for top recommendations
    const booksSnapshot = await db.collection("books").where(admin.firestore.FieldPath.documentId(), "in", sortedRecIds.slice(0, limit * 2)).get();
    const recommendations = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, limit);
    
    setCache(cacheKey, recommendations, ML_CACHE_TTL);
    return recommendations;
  } catch (error) {
    console.error(`Error in getItemBasedRecommendations for ${userId}:`, error);
    return [];
  }
};

/**
 * Gets recommendations using Content-Based Filtering.
 * LOGIC: "Since you are looking at Book X, here are other books with the same genre and by the same author."
 * This is perfect for a "More Like This" section on a book detail page.
 * @param {string} bookId The ID of the book to find similarities for.
 * @returns {Promise<Array<object>>} A list of similar book objects.
 */
const getContentBasedSimilarities = async (bookId, limit = 5) => {
  const cacheKey = `content_based_similarities_${bookId}`;
  const cachedRecs = getCache(cacheKey);
  if (cachedRecs) return cachedRecs;

  try {
    const bookDoc = await db.collection("books").doc(bookId).get();
    if (!bookDoc.exists) return [];
    const { genre, author } = bookDoc.data();

    // Find books with the same genre, excluding the source book itself
    const genreSnapshot = await db.collection("books")
      .where("genre", "==", genre)
      .where(admin.firestore.FieldPath.documentId(), "!=", bookId)
      .limit(limit)
      .get();
    
    const similarBooks = {};
    genreSnapshot.docs.forEach(doc => {
      similarBooks[doc.id] = { id: doc.id, ...doc.data() };
    });

    // Try to find more books by the same author to enrich the list
    if (Object.keys(similarBooks).length < limit) {
      const authorSnapshot = await db.collection("books")
        .where("author", "==", author)
        .where(admin.firestore.FieldPath.documentId(), "!=", bookId)
        .limit(limit)
        .get();
      authorSnapshot.docs.forEach(doc => {
        similarBooks[doc.id] = { id: doc.id, ...doc.data() };
      });
    }

    const recommendations = Object.values(similarBooks).slice(0, limit);
    setCache(cacheKey, recommendations, ML_CACHE_TTL);
    return recommendations;
  } catch (error) {
    console.error(`Error in getContentBasedSimilarities for ${bookId}:`, error);
    return [];
  }
};

/**
 * Gets recently added, high-quality books. A simple proxy for "trending".
 * @param {number} limit The number of books to return.
 * @returns {Promise<Array<object>>} A list of new release book objects.
 */
const getNewReleases = async (limit = 10) => {
  const cacheKey = `new_releases_${limit}`;
  const cachedBooks = getCache(cacheKey);
  if (cachedBooks) return cachedBooks;

  try {
    const snapshot = await db.collection("books")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCache(cacheKey, books, 24 * 3600 * 1000); // Cache new releases for a full day
    return books;
  } catch (error) {
    console.error("Error fetching new releases:", error);
    return [];
  }
};

module.exports = {
  getPopularBooks,
  getNewReleases,
  getUserBasedRecommendations,
  getItemBasedRecommendations,
  getContentBasedSimilarities,
};
