// backend/utils/firestoreBatchDelete.js
const { db } = require("../firebase/firebase");

/**
 * Deletes documents from a Firestore collection in batches.
 * @param {FirebaseFirestore.Query | FirebaseFirestore.CollectionReference} queryOrCollectionRef
 * @returns {Promise<number>} Number of documents deleted.
 */
const batchDelete = async (queryOrCollectionRef) => {
  let deletedCount = 0;
  let lastDoc = null;
  let hasMore = true;

  while (hasMore) {
    let query = queryOrCollectionRef.limit(500); // Max batch size
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    await batch.commit();

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.docs.length < 500) {
      hasMore = false;
    }
  }
  return deletedCount;
};

module.exports = { batchDelete };
