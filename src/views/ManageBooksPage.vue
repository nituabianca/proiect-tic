<template>
  <div class="manage-books">
    <div class="header">
      <h1>Manage Books</h1>
      <button @click="openAddModal" class="add-btn">
        <font-awesome-icon icon="plus" /> Add Book
      </button>
    </div>

    <form @submit.prevent="handleServerSearch" class="search-form">
      <input v-model="activeFilters.search" placeholder="Search by Title..." />
      <input v-model="activeFilters.author" placeholder="Search by Author..." />
      <select v-model="activeFilters.genre">
        <option value="">All Genres</option>
        <option v-for="genre in availableGenres" :key="genre" :value="genre">{{ genre }}</option>
      </select>
      <button type="submit" class="search-btn">Search</button>
      <button type="button" @click="clearSearch" class="clear-btn">Clear Search</button>
    </form>

    <div class="filters">
      <input v-model="localFilterText" placeholder="Filter currently loaded results..." :disabled="isSearchActive" />
    </div>

    <div class="table-container">
      <div v-if="loading" class="loading-overlay"><span>Loading...</span></div>
      <table>
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
        <tbody v-if="displayBooks.length > 0">
        <tr v-for="book in displayBooks" :key="book.id">
          <td>{{ book.title }}</td>
          <td>{{ book.author }}</td>
          <td>{{ book.genre }}</td>
          <td>${{ (book.price || 0).toFixed(2) }}</td>
          <td><span :class="getStockClass(book.stock.quantity)">{{ book.stock.quantity }}</span></td>
          <td class="actions">
            <button @click="viewBook(book)" class="action-btn view" title="View"><font-awesome-icon icon="eye" /></button>
            <button @click="editBook(book)" class="action-btn edit" title="Edit"><font-awesome-icon icon="pen" /></button>
            <button @click="confirmDelete(book)" class="action-btn delete" title="Delete"><font-awesome-icon icon="trash" /></button>
          </td>
        </tr>
        </tbody>
        <tbody v-else>
        <tr><td colspan="6" class="no-results">No books found.</td></tr>
        </tbody>
      </table>
    </div>

    <div class="footer-actions" v-if="!isSearchActive && hasMore">
      <button @click="loadBooks" :disabled="loading" class="load-more-btn">
        {{ loading ? 'Loading...' : 'Load More' }}
      </button>
    </div>

    <BookModal v-if="showModal" :book="selectedBook" :mode="modalMode" @close="closeModal" @save="saveBook" />
    <div v-if="showDeleteModal" class="delete-modal" @click.self="closeModal">
      <div class="delete-modal-content">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete "{{ selectedBook?.title }}"?</p>
        <div class="delete-modal-actions">
          <button @click="deleteBook" class="confirm-btn">Delete</button>
          <button @click="closeModal" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import BookModal from "@/components/BookModal.vue";
import { useToast } from "@/composables/useToast";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faPlus, faEye, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";

library.add(faPlus, faEye, faPen, faTrash);

const { showToast } = useToast();

// STATE
const books = ref([]); // For browsable, paginated list
const searchedBooks = ref(null); // For server search results
const localFilterText = ref(''); // For instant client-side filtering
const activeFilters = ref({ search: "", author: "", genre: "" }); // For server-side search form
const availableGenres = ref([]);
const loading = ref(false);
const nextCursorId = ref(null);
const hasMore = ref(true);

// COMPUTED
const isSearchActive = computed(() => searchedBooks.value !== null);

const displayBooks = computed(() => {
  if (isSearchActive.value) {
    return searchedBooks.value;
  }
  if (!localFilterText.value) {
    return books.value;
  }
  const query = localFilterText.value.toLowerCase();
  return books.value.filter(book =>
    book.title.toLowerCase().includes(query) ||
    book.author.toLowerCase().includes(query)
  );
});

// METHODS
const fetchGenres = async () => {
  try {
    const response = await axios.get('/api/books/genres');
    availableGenres.value = response.data;
  } catch (error) {
    showToast("Could not load genre list", "error");
  }
};

const loadBooks = async () => {
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const params = new URLSearchParams({ limit: 20 });
    if (nextCursorId.value) params.append('nextCursor', nextCursorId.value);

    const response = await axios.get(`/api/books?${params.toString()}`);
    const { books: newBooks, nextCursor } = response.data;

    books.value.push(...newBooks);
    nextCursorId.value = nextCursor;
    if (!nextCursor) hasMore.value = false;
  } catch (error) {
    showToast("Error fetching books", "error");
  } finally {
    loading.value = false;
  }
};

const handleServerSearch = async () => {
  loading.value = true;
  localFilterText.value = '';
  try {
    const params = new URLSearchParams({ limit: 100 });
    if (activeFilters.value.search) params.append('search', activeFilters.value.search);
    if (activeFilters.value.author) params.append('author', activeFilters.value.author);
    if (activeFilters.value.genre) params.append('genre', activeFilters.value.genre);

    const response = await axios.get(`/api/books?${params.toString()}`);
    searchedBooks.value = response.data.books;
  } catch (error) {
    showToast("Error searching books", "error");
  } finally {
    loading.value = false;
  }
};

const clearSearch = () => {
  searchedBooks.value = null;
  activeFilters.value = { search: "", author: "", genre: "" };
};

const refreshBooks = () => {
  clearSearch();
  books.value = [];
  nextCursorId.value = null;
  hasMore.value = true;
  loadBooks();
};

onMounted(() => {
  refreshBooks();
  fetchGenres();
});

// MODAL AND CRUD LOGIC
const showModal = ref(false);
const showDeleteModal = ref(false);
const selectedBook = ref(null);
const modalMode = ref("add");

const openAddModal = () => {
  selectedBook.value = null;
  modalMode.value = "add";
  showModal.value = true;
};

const editBook = (book) => {
  selectedBook.value = { ...book };
  modalMode.value = "edit";
  showModal.value = true;
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

const closeModal = () => {
  showModal.value = false;
  showDeleteModal.value = false;
  selectedBook.value = null;
};

const saveBook = async (bookData) => {
  loading.value = true;
  try {
    if (modalMode.value === 'add') {
      await axios.post("/api/books", bookData);
      showToast("Book added successfully", "success");
    } else {
      await axios.put(`/api/books/${bookData.id}`, bookData);
      showToast("Book updated successfully", "success");
    }
    closeModal();
    refreshBooks();
  } catch (error) {
    showToast("Error saving book", "error");
  } finally {
    loading.value = false;
  }
};

const deleteBook = async () => {
  if (!selectedBook.value) return;
  loading.value = true;
  try {
    await axios.delete(`/api/books/${selectedBook.value.id}`);
    showToast("Book deleted successfully", "success");
    closeModal();
    refreshBooks();
  } catch (error) {
    showToast("Error deleting book", "error");
  } finally {
    loading.value = false;
  }
};

const getStockClass = (quantity) => {
  if (quantity <= 0) return "stock-out";
  if (quantity < 10) return "stock-low";
  return "stock-ok";
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

.search-form { display: flex; gap: 1rem; padding: 1rem; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 1.5rem; }
.search-form input, .search-form select { padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; flex-grow: 1; }
.search-btn, .clear-btn { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; }
.search-btn { background-color: #3498db; color: white; }

.filters {
  margin-bottom: 1.5rem;
}
.filters input {
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #ddd;
  width: 300px;
}
.table-container { position: relative; }
.loading-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  z-index: 10;
}

.clear-btn { background-color: #95a5a6; color: white; }

.footer-actions { text-align: center; padding: 2rem 0; }
.load-more-btn {
    background-color: #2c3e50;
    color: white;
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
.load-more-btn { background-color: #2c3e50; color: white; padding: 0.75rem 2rem; border: none; border-radius: 4px; cursor: pointer; }
.load-more-btn:disabled { background-color: #ccc; }
</style>
