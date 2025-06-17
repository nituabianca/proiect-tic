// backend/services/libraryService.js
const { db, admin } = require("../firebase/firebase");
const { deleteCache } = require("../utils/cache");

/**
 * Creates or updates the status of a book in a user's personal library.
 * @param {string} userId The user's ID.
 * @param {string} bookId The book's ID.
 * @param {'reading' | 'completed' | 'want_to_read' | 'paused'} status The new status for the book.
 * @returns {Promise<object>} The created/updated progress document.
 */
const updateBookStatus = async (userId, bookId, status) => {
  const progressRef = db.collection("user_book_progress").doc(`${userId}_${bookId}`);
  const doc = await progressRef.get();

  const data = {
    userId,
    bookId,
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!doc.exists) {
    // If this is the first time interacting with the book, set startedAt
    data.startedAt = admin.firestore.FieldValue.serverTimestamp();
  }
  if (status === 'completed') {
    // If marking as completed, set the completedAt timestamp
    data.completedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await progressRef.set(data, { merge: true });

  // Invalidate user statistics cache since 'booksRead' will change
  console.log(`[Cache] User statistics invalidated for ${userId} due to library update.`);
  deleteCache(`user_statistics_${userId}`);

  return { id: progressRef.id, ...data };
};

module.exports = {
  updateBookStatus,
};
