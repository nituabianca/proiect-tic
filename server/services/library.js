const { db, admin } = require("../firebase/firebase");
const { deleteCache } = require("../utils/cache");

/**
 * Creates or updates the status of a book in a user's library.
 * @param {string} userId The user's ID.
 * @param {string} bookId The book's ID.
 * @param {'in_library' | 'wishlisted'} status The new status for the book.
 * @returns {Promise<object>}
 */
const updateBookStatus = async (userId, bookId, status) => {
  const progressRef = db.collection("user_book_progress").doc(`${userId}_${bookId}`);

  const validStatuses = ['in_library', 'wishlisted'];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid library status provided.");
  }

  const data = {
    userId,
    bookId,
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await progressRef.set(data, { merge: true });
  deleteCache(`user_statistics_${userId}`);
  return { id: progressRef.id, ...data };
};

/**
 * Fetches all of a user's library items (both owned and wishlisted)
 * and merges them with full book details.
 * @param {string} userId The user's ID.
 * @returns {Promise<Array<object>>}
 */
const getMyLibrary = async (userId) => {
  const progressSnapshot = await db.collection("user_book_progress").where("userId", "==", userId).get();
  if (progressSnapshot.empty) return [];

  const progressData = progressSnapshot.docs.map(doc => doc.data());
  const bookIds = progressData.map(p => p.bookId).filter(id => id); // Filter out any undefined ids

  if (bookIds.length === 0) return [];

  const booksSnapshot = await db.collection("books").where(admin.firestore.FieldPath.documentId(), 'in', bookIds).get();
  const booksMap = new Map();
  booksSnapshot.forEach(doc => booksMap.set(doc.id, doc.data()));

  const myLibrary = progressData.map(p => ({
    ...booksMap.get(p.bookId),
    id: p.bookId,
    status: p.status,
    dateAdded: p.updatedAt,
  }));

  return myLibrary;
};

module.exports = {
  updateBookStatus,
  getMyLibrary,
};