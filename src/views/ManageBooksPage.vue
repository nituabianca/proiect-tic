<template>
  <div class="manage-books">
    <div class="header">
      <h1>Manage Books</h1>
      <button @click="openAddModal" class="add-btn">
        <font-awesome-icon icon="plus" /> Add Book
      </button>
    </div>

    <div class="filters">
      <input v-model="filters.search" placeholder="Search books..." />
      <select v-model="filters.genre">
        <option value="">All Genres</option>
        <option v-for="genre in GENRES" :key="genre" :value="genre">
          {{ genre }}
        </option>
      </select>
    </div>

    <div class="table-container">
      <table v-if="books.length">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="book in filteredBooks" :key="book.id">
            <td>{{ book.title }}</td>
            <td>{{ book.author }}</td>
            <td>{{ book.category.genre }}</td>
            <td>${{ book.price.toFixed(2) }}</td>
            <td>
              <span :class="getStockClass(book.stock.quantity)">
                {{ book.stock.quantity }}
              </span>
            </td>
            <td class="actions">
              <button @click="viewBook(book)" class="action-btn view">
                <font-awesome-icon icon="eye" />
              </button>
              <button @click="editBook(book)" class="action-btn edit">
                <font-awesome-icon icon="pen" />
              </button>
              <button @click="confirmDelete(book)" class="action-btn delete">
                <font-awesome-icon icon="trash" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="no-books">No books found</div>
    </div>

    <BookModal
      v-if="showModal"
      :book="selectedBook"
      :mode="modalMode"
      @close="closeModal"
      @save="saveBook"
    />

    <div v-if="showDeleteModal" class="delete-modal">
      <div class="delete-modal-content">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete "{{ selectedBook?.title }}"?</p>
        <div class="delete-modal-actions">
          <button @click="deleteBook" class="delete-btn">Delete</button>
          <button @click="showDeleteModal = false" class="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from "vue";
import axios from "axios";
import BookModal from "@/components/BookModal.vue";
import { useToast } from "@/composables/useToast";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"; // We'll create this later

export default {
  name: "ManageBooksPage",
  components: { FontAwesomeIcon, BookModal },
  setup() {
    const books = ref([]);
    const showModal = ref(false);
    const showDeleteModal = ref(false);
    const selectedBook = ref(null);
    const modalMode = ref("add");
    const { showToast } = useToast();
    const page = ref(1);
    const loading = ref(false);
    const hasMore = ref(true);
    const itemsPerPage = 20;
    const filters = ref({ search: "", genre: "" });
    const GENRES = [
      "Fiction",
      "Non-Fiction",
      "Science Fiction",
      "Mystery",
      "Romance",
    ];

    const searchParams = ref({
      title: "",
      author: "",
      genre: "",
      minPrice: "",
      maxPrice: "",
    });

    const fetchBooks = async () => {
      if (loading.value || !hasMore.value) return;
      loading.value = true;

      try {
        const response = await axios.get(
          `/api/books?page=${page.value}&limit=${itemsPerPage}`
        );
        if (response.data.length < itemsPerPage) {
          hasMore.value = false;
        }
        books.value = [...books.value, ...response.data];
        page.value++;
      } catch (error) {
        showToast("Error fetching books", "error");
      } finally {
        loading.value = false;
      }
    };

    /**
     *
     * Search function still under construction, routes not correctly called
     */

    const searchBooks = async () => {
      try {
        const params = new URLSearchParams();

        if (searchParams.value.title)
          params.append("title", searchParams.value.title);
        if (searchParams.value.author)
          params.append("author", searchParams.value.author);
        if (searchParams.value.genre)
          params.append("genre", searchParams.value.genre);
        if (searchParams.value.minPrice)
          params.append("minPrice", searchParams.value.minPrice);
        if (searchParams.value.maxPrice)
          params.append("maxPrice", searchParams.value.maxPrice);

        // Send GET request with query params
        const response = await axios.get(`/books/search?${params.toString()}`);

        // Update the books array with the new search results
        books.value = response.data;
      } catch (error) {
        console.error("Error searching books:", error);
      }
    };

    const resetFilters = async () => {
      searchParams.value = {
        title: "",
        author: "",
        genre: "",
        minPrice: "",
        maxPrice: "",
      };
      await fetchBooks(); // Fetch all books again without filters
    };

    const handleScroll = () => {
      const element = document.documentElement;
      if (
        element.scrollHeight - element.scrollTop <=
        element.clientHeight + 100
      ) {
        fetchBooks();
      }
    };

    const filteredBooks = computed(() => {
      return books.value.filter((book) => {
        const matchesSearch =
          !filters.value.search ||
          book.title.toLowerCase().includes(filters.value.search.toLowerCase());
        const matchesGenre =
          !filters.value.genre || book.category.genre === filters.value.genre;
        return matchesSearch && matchesGenre;
      });
    });

    const refreshBooks = async () => {
      books.value = [];
      page.value = 1;
      await fetchBooks();
    };

    onMounted(() => {
      fetchBooks();
      window.addEventListener("scroll", handleScroll);
    });

    onUnmounted(() => {
      window.removeEventListener("scroll", handleScroll);
    });

    const openAddModal = () => {
      selectedBook.value = null;
      modalMode.value = "add";
      showModal.value = true;
    };

    const editBook = (book) => {
      selectedBook.value = { ...book }; // Clone book data
      modalMode.value = "edit"; // Set mode to edit
      showModal.value = true; // Open modal
    };

    const viewBook = (book) => {
      selectedBook.value = { ...book };
      modalMode.value = "view";
      showModal.value = true;
    };

    const confirmDelete = (book) => {
      selectedBook.value = book;
      showDeleteModal.value = true;
    };

    const deleteBook = async () => {
      try {
        await axios.delete(`/api/books/${selectedBook.value.id}`);
        showToast("Book deleted successfully", "success");
        books.value = books.value.filter(
          (book) => book.id !== selectedBook.value.id
        );
      } catch (error) {
        showToast("Error deleting book", "error");
      }
      showDeleteModal.value = false;
    };

    const saveBook = async (bookData) => {
      try {
        if (modalMode.value === "add") {
          await axios.post("/api/books", bookData);
          showToast("Book added successfully", "success");
        } else {
          await axios.put(`/api/books/${bookData.id}`, bookData); // Update book
          showToast("Book updated successfully", "success");
        }
        showModal.value = false;
        await refreshBooks(); // Refresh the list
      } catch (error) {
        showToast("Error saving book", "error");
      }
    };

    const closeModal = () => {
      showModal.value = false;
    };

    const getStockClass = (quantity) => {
      if (quantity <= 0) return "stock-out";
      if (quantity < 10) return "stock-low";
      return "stock-ok";
    };

    return {
      books,
      showModal,
      showDeleteModal,
      selectedBook,
      modalMode,
      closeModal,
      openAddModal,
      editBook,
      viewBook,
      confirmDelete,
      deleteBook,
      saveBook,
      getStockClass,
      searchParams,
      searchBooks,
      resetFilters,
      filteredBooks,
      refreshBooks,
      genres: GENRES,
      filters,
    };
  },
};
</script>

<style scoped>
.manage-books {
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.add-btn {
  background: #4caf50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filters {
  margin-bottom: 1.5rem;
  display: flex;
  gap: 1rem;
}

.filters input,
.filters select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.filters input {
  width: 250px;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #444;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.view {
  background: #3498db;
  color: white;
}
.edit {
  background: #f39c12;
  color: white;
}
.delete {
  background: #e74c3c;
  color: white;
}

.stock-ok {
  color: #27ae60;
}
.stock-low {
  color: #f39c12;
}
.stock-out {
  color: #e74c3c;
}

.delete-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.delete-modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  text-align: center;
}

.delete-modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}
.delete-btn {
  background: #e74c3c;
  color: white;
}
</style>
