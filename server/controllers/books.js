const db = require("../firebase/firebase");
const { generateMockBook } = require("../helpers/books");

const bookController = {
  async createBook(req, res) {
    try {
      const bookData = req.body;
      const docRef = await db.collection("books").add(bookData);
      const newBook = await docRef.get();

      res.status(201).json({
        id: docRef.id,
        ...newBook.data(),
      });
    } catch (error) {
      console.error("Error creating book:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getAllBooks(req, res) {
    try {
      const snapshot = await db.collection("books").get();
      const books = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json(books);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getBookById(req, res) {
    try {
      const doc = await db.collection("books").doc(req.params.id).get();

      if (!doc.exists) {
        return res.status(404).json({ message: "Book not found" });
      }

      res.json({
        id: doc.id,
        ...doc.data(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateBook(req, res) {
    try {
      const bookId = req.params.id;
      const updateData = req.body;
      const bookRef = db.collection("books").doc(bookId);

      await bookRef.update({
        ...updateData,
        updatedAt: new Date(),
      });

      const updated = await bookRef.get();
      res.json({
        id: updated.id,
        ...updated.data(),
      });
    } catch (error) {
      console.error("Error updating book:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async deleteBook(req, res) {
    try {
      const bookId = req.params.id;
      await db.collection("books").doc(bookId).delete();
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async searchBooks(req, res) {
    try {
      const { title, author, genre, minPrice, maxPrice } = req.query;
      let query = db.collection("books");

      if (genre) {
        query = query.where("category.genre", "==", genre);
      }

      if (minPrice) {
        query = query.where("price", ">=", parseFloat(minPrice));
      }

      if (maxPrice) {
        query = query.where("price", "<=", parseFloat(maxPrice));
      }

      const snapshot = await query.get();
      let books = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (title) {
        books = books.filter((book) =>
          book.title.toLowerCase().includes(title.toLowerCase())
        );
      }

      if (author) {
        books = books.filter((book) =>
          book.author.toLowerCase().includes(author.toLowerCase())
        );
      }

      res.json(books);
    } catch (error) {
      console.error("Error searching books:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async generateMockBooks(req, res) {
    try {
      const booksCount = req.body.books_count || 50;
      const batch = db.batch();
      const generatedBooks = [];

      for (let i = 0; i < booksCount; i++) {
        // Create a new document reference to get its ID
        const docRef = db.collection("books").doc();
        const book = generateMockBook();

        // Add the ID to the book data
        book.id = docRef.id;

        batch.set(docRef, book);
        generatedBooks.push(book);
      }

      await batch.commit();
      console.log(`Generated ${booksCount} books`);

      return res.status(201).json({
        message: `${booksCount} books were generated successfully`,
        count: generatedBooks.length,
        books: generatedBooks,
      });
    } catch (error) {
      console.error("Error generating books:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate books",
      });
    }
  },

  async updateBookStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      if (typeof quantity !== "number" || quantity < 0) {
        return res.status(400).json({ error: "Invalid quantity" });
      }

      const bookRef = db.collection("books").doc(id);
      await bookRef.update({
        "stock.quantity": quantity,
        updatedAt: new Date(),
      });

      const updated = await bookRef.get();
      res.json({
        id: updated.id,
        ...updated.data(),
      });
    } catch (error) {
      console.error("Error updating stock:", error);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = bookController;
