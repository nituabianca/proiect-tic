<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button type="button" @click="$emit('close')" class="close-btn">
          X
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="book-form">
        <div class="form-grid">
          <div class="form-group">
            <label>Title</label>
            <input
              type="text"
              v-model="formData.title"
              required
              :disabled="isViewMode"
            />
          </div>
          <div class="form-group">
            <label>Author</label>
            <input
              type="text"
              v-model="formData.author"
              required
              :disabled="isViewMode"
            />
          </div>
          <div class="form-group">
            <label>Publisher</label>
            <input
              type="text"
              v-model="formData.publisher"
              required
              :disabled="isViewMode"
            />
          </div>
          <div class="form-group">
            <label>ISBN</label>
            <input
              type="text"
              v-model="formData.isbn"
              required
              :disabled="isViewMode"
            />
          </div>
          <div class="form-group">
            <label>Price</label>
            <input
              type="number"
              v-model="formData.price"
              step="0.01"
              required
              :disabled="isViewMode"
            />
          </div>
          <div class="form-group">
            <label>Publication Date</label>
            <input
              type="date"
              v-model="formData.publicationDate"
              required
              :disabled="isViewMode"
            />
          </div>
          <div class="form-group">
            <label>Genre</label>
            <select
              v-model="formData.category.genre"
              required
              :disabled="isViewMode"
            >
              <option value="Fiction">Fiction</option>
              <option value="Non-Fiction">Non-Fiction</option>
              <option value="Science Fiction">Science Fiction</option>
              <option value="Mystery">Mystery</option>
              <option value="Romance">Romance</option>
            </select>
          </div>
          <div class="form-group">
            <label>Format</label>
            <select
              v-model="formData.category.format"
              required
              :disabled="isViewMode"
            >
              <option value="Hardcover">Hardcover</option>
              <option value="Paperback">Paperback</option>
              <option value="E-book">E-book</option>
              <option value="Audiobook">Audiobook</option>
            </select>
          </div>

          <div class="form-group">
            <label>Stock Quantity</label>
            <input
              type="number"
              v-model="formData.stock.quantity"
              required
              :disabled="isViewMode"
            />
          </div>
          <div class="form-group">
            <label>Warehouse</label>
            <input
              type="text"
              v-model="formData.stock.warehouse"
              required
              :disabled="isViewMode"
            />
          </div>

          <div class="form-group full-width">
            <label>Series</label>
            <input
              type="text"
              v-model="formData.descriptiveAtributes.series"
              :disabled="isViewMode"
            />
          </div>
          <div class="form-group">
            <label>Number of Pages</label>
            <input
              type="number"
              v-model="formData.descriptiveAtributes.numberOfPages"
              required
              :disabled="isViewMode"
            />
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

<script>
import { computed, ref } from "vue";

export default {
  name: "BookModal",
  components: {},
  props: {
    book: {
      type: Object,
      default: null,
    },
    mode: {
      type: String,
      default: "add",
    },
  },
  emits: ["close", "save"],
  setup(props, { emit }) {
    const formData = ref(
      props.book
        ? {
            ...props.book,
            publicationDate: props.book.publicationDate
              ? props.book.publicationDate.split("T")[0] // Extract "YYYY-MM-DD"
              : "",
          }
        : {
            title: "",
            author: "",
            publisher: "",
            isbn: "",
            price: 0,
            publicationDate: "",
            category: {
              genre: "Fiction",
              format: "Paperback",
            },
            stock: {
              quantity: 0,
              warehouse: "",
            },
            descriptiveAtributes: {
              series: "",
              numberOfPages: 0,
            },
          }
    );

    const modalTitle = computed(() => {
      switch (props.mode) {
        case "add":
          return "Add New Book";
        case "edit":
          return "Edit Book";
        case "view":
          return "Book Details";
        default:
          return "";
      }
    });

    const isViewMode = computed(() => props.mode === "view");

    const handleSubmit = () => {
      emit("save", { ...formData.value });
    };

    return {
      formData,
      modalTitle,
      isViewMode,
      handleSubmit,
    };
  },
};
</script>

<style scoped>
.modal-overlay {
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

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.book-form {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
  color: #444;
}

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:disabled,
.form-group select:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.modal-footer {
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.save-btn,
.cancel-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn {
  background: #4caf50;
  color: white;
  border: none;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}
</style>
