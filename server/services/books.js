// backend/services/bookService.js
const { db } = require("../firebase/firebase");
const { getCache, setCache, deleteCache } = require("../utils/cache"); // Make sure deleteCache is imported

const USER_READ_BOOK_IDS_CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour
const ALL_BOOKS_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours for all books data

// --- Existing Functions (unchanged) ---

const getBookById = async (id) => {
  try {
    const snapshot = await db.collection("books").doc(id).get();
    if (snapshot.exists) {
      return { id: snapshot.id, ...snapshot.data() };
    }
    return null;
  } catch (error) {
    console.error("Error occurred while querying book by ID:", error);
    throw new Error("Failed to query book by ID");
  }
};

/**
 * A simplified and robust function to get books with pagination and filtering.
 * This version separates search logic from other filters to avoid indexing conflicts.
 * @param {object} options
 * @returns {Promise<{books: Array<object>, nextCursor: string|null}>}
 */
const getBooks = async ({ limit = 20, startAfterId = null, filters = {} }) => {
  try {
    let query = db.collection("books");

    // --- QUERY BUILDING LOGIC ---

    if (filters.search) {
      // IF A TITLE SEARCH IS PERFORMED: This is the only filter we apply.
      // Firestore requires the first orderBy to be on the field used for range comparisons.
      query = query.orderBy("title")
        .where("title", ">=", filters.search)
        .where("title", "<=", filters.search + "\uf8ff");
    } else {
      // IF NOT SEARCHING BY TITLE: Apply metadata filters.
      if (filters.author) {
        query = query.where("author", "==", filters.author);
      }
      if (filters.genre) {
        query = query.where("genre", "==", filters.genre);
      }
      // And apply the default sort order.
      query = query.orderBy("createdAt", "desc");
    }

    // --- PAGINATION LOGIC ---
    if (startAfterId) {
      const startAfterDoc = await db.collection("books").doc(startAfterId).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.limit(limit).get();
    const books = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = books.length < limit ? null : lastVisibleDoc?.id || null;

    return { books, nextCursor };
  } catch (error) {
    console.error("Error fetching books:", error);
    // This will now catch "missing index" errors and send a helpful message to the frontend.
    if (error.code === 9) { // 9 is FAILED_PRECONDITION
      throw new Error("A database index is required for this query. Please check your backend terminal logs for a creation link.");
    }
    throw new Error("Failed to fetch books from database.");
  }
};


const getAllBooks = async () => {
  try {
    const cacheKey = `all_books`;
    let allBooks = getCache(cacheKey);
    if (allBooks) {
      return allBooks;
    }
    const snapshot = await db.collection("books").get();
    allBooks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setCache(cacheKey, allBooks, ALL_BOOKS_CACHE_TTL);
    return allBooks;
  } catch (error) {
    console.error("Error fetching all books:", error);
    throw new Error("Failed to fetch all books");
  }
};

const getReadBookIdsByUserId = async (userId) => {
  const cacheKey = `user_read_book_ids_${userId}`;
  let readBookIds = getCache(cacheKey);
  if (readBookIds) {
    return readBookIds;
  }

  try {
    const snapshot = await db
      .collection("user_book_progress")
      .where("userId", "==", userId)
      .where("status", "==", "completed")
      .get();
    readBookIds = snapshot.docs.map((doc) => doc.data().bookId);
    setCache(cacheKey, readBookIds, USER_READ_BOOK_IDS_CACHE_TTL);
    return readBookIds;
  } catch (error) {
    console.error("Error fetching user's read book IDs:", error);
    throw new Error("Failed to fetch user's read book IDs");
  }
};

// --- NEW/MISSING Functions ---

const createBook = async (bookData) => {
  try {
    const bookRef = db.collection("books").doc(); // Let Firestore auto-generate ID
    const newBook = {
      ...bookData,
      createdAt: new Date(),
      updatedAt: new Date(),
      numRatings: 0, // Initialize new books with 0 ratings
      averageRating: 0, // Initialize with 0 average rating
      stock: bookData.stock || 0, // Ensure stock is initialized
    };
    await bookRef.set(newBook);

    // Invalidate cache for all books and popular books
    deleteCache("all_books");
    deleteCache("popular_books_5"); // Assuming a default limit of 5 for popular books

    return { id: bookRef.id, ...newBook };
  } catch (error) {
    console.error("Error creating book:", error);
    throw new Error("Failed to create book");
  }
};

const updateBook = async (id, updateData) => {
  try {
    const bookRef = db.collection("books").doc(id);
    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date(),
    };
    await bookRef.update(dataToUpdate);
    const updatedDoc = await bookRef.get();

    // Invalidate caches related to this specific book and all books
    deleteCache("all_books");
    deleteCache(`similar_books_${id}`); // If title/genre change, similarity might change
    deleteCache(`book_statistics_${id}`); // If any fields affecting stats are updated
    deleteCache("popular_books_5"); // If popularity is based on fields that can be updated

    return updatedDoc.exists
      ? { id: updatedDoc.id, ...updatedDoc.data() }
      : null;
  } catch (error) {
    console.error(`Error updating book ${id}:`, error);
    throw new Error("Failed to update book");
  }
};

const deleteBook = async (id) => {
  try {
    const bookRef = db.collection("books").doc(id);
    const bookDoc = await bookRef.get();

    if (!bookDoc.exists) {
      return false; // Book not found
    }

    await bookRef.delete();

    // Invalidate all caches that might contain this book or depend on its existence
    deleteCache("all_books");
    deleteCache("popular_books_5");
    deleteCache(`similar_books_${id}`);
    deleteCache(`book_statistics_${id}`);
    // Clear all ratings cache as a book's ratings are gone, impacting ML
    deleteCache("all_ratings");
    // For recommendations, relying on TTL for user-based/item-based is generally okay
    // as it's not feasible to clear every user's recommendations just because one book is deleted.
    // However, if you have user's read book progress linked to this book, you might need to clean those too.
    // This is beyond the scope of this single function, likely needs a background task.

    return true;
  } catch (error) {
    console.error(`Error deleting book ${id}:`, error);
    throw new Error("Failed to delete book");
  }
};

const searchBooks = async (title, author, genre, minPrice, maxPrice) => {
  try {
    let query = db.collection("books");

    if (title) {
      // Basic search: checks if title contains the search term (case-insensitive, startsWith is common for simple search)
      // For more advanced full-text search, consider dedicated solutions like Algolia or a custom index.
      query = query
        .where("title", ">=", title)
        .where("title", "<=", title + "\uf8ff");
    }
    if (author) {
      query = query.where("author", "==", author);
    }
    if (genre) {
      query = query.where("genre", "==", genre);
    }
    if (minPrice !== undefined) {
      query = query.where("price", ">=", parseFloat(minPrice));
    }
    if (maxPrice !== undefined) {
      query = query.where("price", "<=", parseFloat(maxPrice));
    }

    const snapshot = await query.get();
    const books = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return books;
  } catch (error) {
    console.error("Error searching books:", error);
    throw new Error("Failed to search books");
  }
};

const updateBookStock = async (id, quantity) => {
  try {
    const bookRef = db.collection("books").doc(id);
    const bookDoc = await bookRef.get();

    if (!bookDoc.exists) {
      return null; // Book not found
    }

    const currentStock = bookDoc.data()?.stock ?? 0;
    const newStock = currentStock + quantity; // `quantity` can be positive (add) or negative (subtract)

    if (newStock < 0) {
      throw new Error("Stock cannot be negative.");
    }

    await bookRef.update({
      stock: newStock,
      updatedAt: new Date(),
    });

    const updatedDoc = await bookRef.get();
    return updatedDoc.exists
      ? { id: updatedDoc.id, ...updatedDoc.data() }
      : null;
  } catch (error) {
    console.error(`Error updating stock for book ${id}:`, error);
    throw new Error("Failed to update book stock");
  }
};

module.exports = {
  getBookById,
  getBooks,
  getAllBooks,
  getReadBookIdsByUserId,
  createBook, // Export new functions
  updateBook,
  deleteBook,
  searchBooks,
  updateBookStock,
};
