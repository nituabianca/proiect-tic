<template>
  <div class="books-container">
    <div class="books-grid" ref="booksContainer">
      <div v-for="book in books" :key="book.id" class="book-card">
        <div class="book-cover-container">
          <img
            :src="`https://picsum.photos/seed/${book.id}/300/400`"
            :alt="book.title"
            class="book-cover"
            @error="handleImageError"
          />
        </div>
        <div class="book-details">
          <h3 class="book-title">{{ book.title }}</h3>
          <p class="book-author">{{ book.author }}</p>
          <div class="book-pricing">
            <span class="book-price">${{ book.price.toFixed(2) }}</span>
            <span class="book-stock">In Stock: {{ book.stock.quantity }}</span>
            <button @click="addToCart(book)" class="add-to-cart-btn">
              Add to Cart
            </button>
          </div>
          <div class="book-genre">Genre: {{ book.category.genre }}</div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-spinner">Loading books...</div>
    <div v-if="!loading && books.length === 0" class="no-books">
      No books found
    </div>

    <div class="cart-preview" v-if="cartItemCount > 0">
      <div class="cart-count">{{ cartItemCount }} items</div>
      <div class="cart-total">${{ cartTotal.toFixed(2) }}</div>
      <router-link to="/cart" class="view-cart-btn">View Cart</router-link>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useStore } from "vuex";
import axios from "axios";

export default {
  name: "BooksPage",
  setup() {
    const store = useStore();
    const books = ref([]);
    const loading = ref(false);
    const page = ref(1);
    const hasMore = ref(true);
    const booksContainer = ref(null);

    const cartItemCount = computed(() => store.getters["cart/itemCount"]);
    const cartTotal = computed(() => store.getters["cart/cartTotal"]);

    const fetchBooks = async () => {
      if (loading.value || !hasMore.value) return;
      loading.value = true;
      try {
        const response = await axios.get("/api/books");
        const newBooks = response.data;
        if (newBooks.length === 0) {
          hasMore.value = false;
        } else {
          books.value = [...books.value, ...newBooks];
          page.value++;
        }
      } catch (error) {
        console.error("Error fetching books:", error);
        hasMore.value = false;
      } finally {
        loading.value = false;
      }
    };

    const handleScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } =
        document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 100 && !loading.value) {
        fetchBooks();
      }
    };

    const handleImageError = (event) => {
      event.target.src = "https://picsum.photos/300/400";
    };

    const addToCart = (book) => {
      store.dispatch("cart/addToCart", book);
    };

    onMounted(() => {
      fetchBooks();
      window.addEventListener("scroll", handleScroll);
    });

    onUnmounted(() => {
      window.removeEventListener("scroll", handleScroll);
    });

    return {
      books,
      loading,
      hasMore,
      booksContainer,
      handleImageError,
      addToCart,
      cartItemCount,
      cartTotal,
    };
  },
};
</script>

<style scoped>
.books-container {
  padding: 2rem;
  background-color: #f4f6f9;
  min-height: 100vh;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.book-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.book-card:hover {
  transform: translateY(-5px);
}

.book-cover-container {
  height: 200px;
  overflow: hidden;
}

.book-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-details {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.book-title {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: bold;
}

.book-author {
  color: #666;
  margin-bottom: 0.5rem;
  font-style: italic;
}

.book-pricing {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.book-price {
  font-weight: bold;
  color: #2c3e50;
}

.book-stock {
  font-size: 0.9rem;
  color: #27ae60;
}

.book-genre {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-top: auto;
}

.add-to-cart-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 0.5rem;
}

.add-to-cart-btn:hover {
  background-color: #2980b9;
}

.loading-spinner,
.no-books {
  text-align: center;
  padding: 2rem;
  color: #666;
}
.cart-preview {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1000;
}

.cart-count {
  font-size: 0.9rem;
  color: #666;
}

.cart-total {
  font-weight: bold;
  color: #2c3e50;
}

.view-cart-btn {
  background-color: #3498db;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-align: center;
  transition: background-color 0.3s ease;
}

.view-cart-btn:hover {
  background-color: #2980b9;
}

.low-stock {
  color: #e74c3c;
}
</style>
