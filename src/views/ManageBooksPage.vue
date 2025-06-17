<template>
  <div class="manage-books">
    <div class="header">
      <h1>Manage Books</h1>
      <button @click="openAddModal" class="add-btn">
        <font-awesome-icon icon="plus" /> Add Book
      </button>
    </div>

    <form @submit.prevent="handleServerSearch" class="search-form">
      <input v-model="activeFilters.search" placeholder="Search title (server)..." />
      <select v-model="activeFilters.genre">
        <option value="">All Genres</option>
        <option v-for="genre in GENRES" :key="genre" :value="genre">{{ genre }}</option>
      </select>
      <button type="submit" class="search-btn">Search</button>
      <button type="button" @click="clearSearch" class="clear-btn">Clear</button>
    </form>
    
    <div class="filters">
      <input v-model="localFilterText" placeholder="Filter loaded results..." :disabled="isSearchActive" />
    </div>

    <div class="table-container">
      <div v-if="loading" class="loading-overlay">Loading...</div>
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
            <td>${{ book.price.toFixed(2) }}</td>
            <td>
              <span :class="getStockClass(book.stock.quantity)">
                {{ book.stock.quantity }}
              </span>
            </td>
            <td class="actions">
              <button @click="viewBook(book)" class="action-btn view"><font-awesome-icon icon="eye" /></button>
              <button @click="editBook(book)" class="action-btn edit"><font-awesome-icon icon="pen" /></button>
              <button @click="confirmDelete(book)" class="action-btn delete"><font-awesome-icon icon="trash" /></button>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
            <tr>
                <td colspan="6" class="no-books">No books found for the current criteria.</td>
            </tr>
        </tbody>
      </table>
    </div>

    <div class="footer-actions" v-if="!isSearchActive && hasMore">
        <button @click="loadBooks(false)" :disabled="loading" class="load-more-btn">
            {{ loading ? 'Loading...' : 'Load More' }}
        </button>
    </div>

    <BookModal v-if="showModal" :book="selectedBook" :mode="modalMode" @close="closeModal" @save="saveBook" />
    <div v-if="showDeleteModal" class="delete-modal">
        </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import BookModal from "@/components/BookModal.vue";
import { useToast } from "@/composables/useToast";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

// --- STATE MANAGEMENT ---
const allBooks = ref([]); // Holds the list for "Browse Mode" with pagination
const searchedBooks = ref(null); // Holds results for "Search Mode". `null` means search is inactive.

const localFilterText = ref(''); // For instant client-side filtering
const activeFilters = ref({ search: "", genre: "" }); // For the server-side search form

const loading = ref(false);
const nextCursor = ref(null);
const hasMore = ref(true);

const { showToast } = useToast();
const GENRES = ["Fantasy", "Science Fiction", "Mystery", "Thriller", "Romance", "Horror"];

// --- COMPUTED PROPERTIES ---

// This intelligently decides which list of books to display
const displayBooks = computed(() => {
  if (isSearchActive.value) {
    // If a server search is active, show its results
    return searchedBooks.value;
  }
  
  // Otherwise, show the client-side filtered list from the paginated "allBooks"
  if (!localFilterText.value) {
    return allBooks.value;
  }
  return allBooks.value.filter(book =>
    book.title.toLowerCase().includes(localFilterText.value.toLowerCase())
  );
});

// A helper to know which mode we are in
const isSearchActive = computed(() => searchedBooks.value !== null);

// --- DATA FETCHING & ACTIONS ---

/**
 * Main function to load books. Handles both initial load and pagination.
 * @param {boolean} isInitial - If true, clears the current list.
 */
const loadBooks = async (isInitial = false) => {
  if (loading.value || (!hasMore.value && !isInitial)) return;
  loading.value = true;

  if (isInitial) {
    allBooks.value = [];
    nextCursor.value = null;
    hasMore.value = true;
  }

  try {
    const params = new URLSearchParams({ limit: 20 });
    if (nextCursor.value) {
      params.append('nextCursor', nextCursor.value);
    }
    
    const response = await axios.get(`/api/books?${params.toString()}`);
    const { books: newBooks, nextCursor: newCursor } = response.data;
    
    allBooks.value.push(...newBooks);
    nextCursor.value = newCursor;
    if (!newCursor) {
      hasMore.value = false;
    }
  } catch (error) {
    showToast("Error fetching books", "error");
  } finally {
    loading.value = false;
  }
};

/**
 * Performs a server-side search and switches to "Search Mode".
 */
const handleServerSearch = async () => {
    loading.value = true;
    localFilterText.value = ''; // Clear local filter when doing a server search
    try {
        const params = new URLSearchParams({ limit: 100 }); // Get up to 100 results for a search
        if (activeFilters.value.search) params.append('search', activeFilters.value.search);
        if (activeFilters.value.genre) params.append('genre', activeFilters.value.genre);
        
        const response = await axios.get(`/api/books?${params.toString()}`);
        searchedBooks.value = response.data.books; // Activate search mode by setting this value
    } catch (error) {
        showToast("Error searching books", "error");
    } finally {
        loading.value = false;
    }
};

/**
 * Clears the server search results and returns to "Browse Mode".
 */
const clearSearch = () => {
    searchedBooks.value = null; // Deactivate search mode
    activeFilters.value = { search: "", genre: "" };
};

onMounted(() => {
  loadBooks(true); // Initial load
});


// --- MODAL AND CRUD LOGIC (Largely unchanged, but with better refresh) ---
const showModal = ref(false);
const showDeleteModal = ref(false);
const selectedBook = ref(null);
const modalMode = ref("add");

const openAddModal = () => { /* ... (no changes needed) ... */ };
const editBook = (book) => { /* ... (no changes needed) ... */ };
const viewBook = (book) => { /* ... (no changes needed) ... */ };
const closeModal = () => { /* ... (no changes needed) ... */ };
const confirmDelete = (book) => { /* ... (no changes needed) ... */ };

const saveBook = async (bookData) => {
  try {
    if (modalMode.value === 'add') {
      await axios.post("/api/books", bookData);
      showToast("Book added successfully", "success");
    } else {
      await axios.put(`/api/books/${bookData.id}`, bookData);
      showToast("Book updated successfully", "success");
    }
    closeModal();
    // If we were in a search, re-run it. Otherwise, refresh the main list.
    isSearchActive.value ? handleServerSearch() : loadBooks(true);
  } catch (error) {
    showToast("Error saving book", "error");
  }
};

const deleteBook = async () => {
    // ... (logic is fine, but refresh at the end)
    isSearchActive.value ? handleServerSearch() : loadBooks(true);
};

const getStockClass = (quantity) => { /* ... (no changes needed) ... */ };

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

  .search-form {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}
.search-form input, .search-form select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex-grow: 1;
}
.search-btn, .clear-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.search-btn { background-color: #3498db; color: white; }
.clear-btn { background-color: #95a5a6; color: white; }

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
.footer-actions {
    text-align: center;
    padding: 2rem 0;
}
.load-more-btn {
    background-color: #2c3e50;
    color: white;
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
.load-more-btn:disabled {
    background-color: #ccc;
}
.no-books { text-align: center; padding: 2rem; color: #666; }
</style>
