<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button type="button" @click="$emit('close')" class="close-btn">
          <font-awesome-icon icon="x" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="book-form">
        <div class="form-grid">
          <div class="form-group">
            <label>Title</label>
            <input type="text" v-model="formData.title" required :disabled="isViewMode" />
          </div>
          <div class="form-group">
            <label>Author</label>
            <input type="text" v-model="formData.author" required :disabled="isViewMode" />
          </div>

          <div class="form-group">
            <label>Publisher</label>
            <input type="text" v-model="formData.publisher" required :disabled="isViewMode" />
          </div>
          <div class="form-group">
            <label>ISBN</label>
            <input type="text" v-model="formData.isbn" required :disabled="isViewMode" />
          </div>

          <div class="form-group full-width">
            <label>Description</label>
            <textarea v-model="formData.description" rows="4" required :disabled="isViewMode"></textarea>
          </div>
          
          <div class="form-group">
            <label>Genre</label>
            <select v-model="formData.genre" required :disabled="isViewMode">
              <option value="Fantasy">Fantasy</option>
              <option value="Science Fiction">Science Fiction</option>
              <option value="Mystery">Mystery</option>
              <option value="Thriller">Thriller</option>
              <option value="Romance">Romance</option>
              <option value="Horror">Horror</option>
              <option value="Historical Fiction">Historical Fiction</option>
              <option value="Biography">Biography</option>
              <option value="Self-Help">Self-Help</option>
              <option value="Poetry">Poetry</option>
              <option value="Young Adult">Young Adult</option>
              <option value="Children">Children's</option>
            </select>
          </div>
          <div class="form-group">
             <label>Language</label>
            <select v-model="formData.language" required :disabled="isViewMode">
              <option value="English">English</option>
              <option value="Romanian">Romanian</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Spanish">Spanish</option>
            </select>
          </div>

          <div class="form-group">
            <label>Price (€)</label>
            <input type="number" v-model="formData.price" step="0.01" required :disabled="isViewMode" />
          </div>
          <div class="form-group">
            <label>Publication Date</label>
            <input type="date" v-model="formData.publicationDate" required :disabled="isViewMode" />
          </div>

          <div class="form-group">
            <label>Number of Pages</label>
            <input type="number" v-model="formData.pages" required :disabled="isViewMode" />
          </div>
          <div class="form-group">
            <label>Stock Quantity</label>
            <input type="number" v-model="formData.stock.quantity" required :disabled="isViewMode" />
          </div>
          
          <div class="form-group full-width">
            <label>Available Formats</label>
            <div class="checkbox-group">
                <label><input type="checkbox" value="Hardcover" v-model="formData.availableFormats" :disabled="isViewMode"> Hardcover</label>
                <label><input type="checkbox" value="Paperback" v-model="formData.availableFormats" :disabled="isViewMode"> Paperback</label>
                <label><input type="checkbox" value="Ebook" v-model="formData.availableFormats" :disabled="isViewMode"> Ebook</label>
                <label><input type="checkbox" value="Audiobook" v-model="formData.availableFormats" :disabled="isViewMode"> Audiobook</label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button v-if="!isViewMode" type="submit" class="save-btn">
            Save Book
          </button>
          <button type="button" @click="$emit('close')" class="cancel-btn">
            {{ isViewMode ? "Close" : "Cancel" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// --- PROPS & EMITS ---
const props = defineProps({
  book: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: "add", // 'add', 'edit', 'view'
    validator: (value) => ["add", "edit", "view"].includes(value),
  },
});

const emit = defineEmits(['close', 'save']);

// --- UTILITY FUNCTIONS ---
/**
 * Initializes the form data based on the provided book object or creates a default structure.
 * This structure now perfectly matches the backend data model.
 */
function initializeFormData(book) {
  const defaultData = {
    title: "",
    author: "",
    description: "",
    genre: "Fantasy",
    publisher: "",
    publicationDate: "",
    language: "English",
    pages: 0,
    price: 0,
    stock: { quantity: 0 },
    isbn: "",
    availableFormats: ["Paperback"],
  };

  if (book) {
    return {
      ...defaultData,
      ...book,
      stock: book.stock || { quantity: 0 },
      publicationDate: book.publicationDate
        ? new Date(book.publicationDate).toISOString().split("T")[0]
        : "",
    };
  }
  return defaultData;
}

// --- REACTIVE STATE ---
const formData = ref(initializeFormData(props.book));

// --- COMPUTED PROPERTIES ---
const modalTitle = computed(() => {
  switch (props.mode) {
    case "add": return "Add New Book";
    case "edit": return "Edit Book";
    case "view": return "Book Details";
    default: return "Book Information";
  }
});

const isViewMode = computed(() => props.mode === 'view');

// --- WATCHERS ---
// Re-initializes the form when the book prop changes.
// Crucial for reusing the modal without unmounting it.
watch(() => props.book, (newBook) => {
  formData.value = initializeFormData(newBook);
}, { deep: true });


// --- METHODS ---
const handleSubmit = () => {
  if (isViewMode.value) return;

  // Simple validation, can be expanded.
  if (!formData.value.title.trim() || !formData.value.author.trim()) {
    // In a real app, use the toast notification for feedback.
    alert("Title and Author are required.");
    return;
  }
  
  // Emit a deep copy of the data to the parent component.
  emit("save", { ...formData.value });
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
}

.book-form {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  color: #888;
}

.checkbox-group {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
}
.checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: normal;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  position: sticky;
  bottom: 0;
  background: white;
}

.save-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.save-btn {
  background: #27ae60;
  color: white;
}
.save-btn:hover {
  background: #229954;
}

.cancel-btn {
  background: #bdc3c7;
  color: #333;
}
.cancel-btn:hover {
  background: #95a5a6;
}
</style>
