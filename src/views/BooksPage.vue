<template>
  <div class="books-page-container">
    <header class="page-header">
      <h1>Explore Our Books</h1>
      <p>Discover your next favorite read, personalized just for you!</p>
    </header>

    <div class="recommendations-layout">
      <section
        v-if="isAuthenticated && userRecommendations.length > 0"
        class="recommendations-section"
      >
        <h2>📚 Recommendations for You</h2>
        <p>Based on your reading history and preferences:</p>
        <div class="books-carousel">
          <router-link v-for="book in userRecommendations" :key="book.id" :to="`/books/${book.id}`" class="book-link">
          <div

            class="book-card-small"
          >
            <img
              :src="`https://picsum.photos/seed/${book.id}/150/200`"
              :alt="book.title"
              class="book-cover-small"
              @error="handleImageErrorSmall"
            />
            <h4 class="book-title-small">{{ book.title }}</h4>
            <p class="book-author-small">{{ book.author }}</p>
            <div class="rating-container-small">
              <StarRating :rating="book.averageRating" />
              <span class="num-ratings-small">({{ book.numRatings }})</span>
            </div>
            <span class="book-price-small">${{ book.price.toFixed(2) }}</span>
            <button @click="addToCart(book)" class="add-to-cart-btn-small">
              Add
            </button>
          </div>
          </router-link>
          <div v-if="loadingRecommendations" class="loading-spinner-small">
            Loading...
          </div>
        </div>
      </section>
      <section
        v-else-if="isAuthenticated && loadingRecommendations"
        class="recommendations-section"
      >
        <p>Loading personalized recommendations...</p>
      </section>
      <section
        v-else-if="
          isAuthenticated &&
          !loadingRecommendations &&
          userRecommendations.length === 0
        "
        class="recommendations-section"
      >
        <p>
          No personalized recommendations yet. Rate some books to get started!
        </p>
      </section>

      <section v-if="popularBooks.length > 0" class="recommendations-section">
        <h2>🔥 Popular Books</h2>
        <p>Most loved by our community:</p>
        <div class="books-carousel">
          <router-link v-for="book in popularBooks" :key="book.id" :to="`/books/${book.id}`" class="book-link">
          <div
            class="book-card-small"
          >
            <img
              :src="`https://picsum.photos/seed/${book.id}/150/200`"
              :alt="book.title"
              class="book-cover-small"
              @error="handleImageErrorSmall"
            />
            <h4 class="book-title-small">{{ book.title }}</h4>
            <p class="book-author-small">{{ book.author }}</p>
              <div class="rating-container">
                <StarRating :rating="book.averageRating" />
                <span class="num-ratings-small">({{ book.numRatings }} ratings)</span>
              </div>
            <span class="book-price-small">${{ book.price.toFixed(2) }}</span>
            <button @click="addToCart(book)" class="add-to-cart-btn-small">
              Add
            </button>
          </div>
          </router-link>
          <div v-if="loadingRecommendations" class="loading-spinner-small">
            Loading...
          </div>
        </div>
      </section>
      <section
        v-else-if="loadingRecommendations"
        class="recommendations-section"
      >
        <p>Loading popular books...</p>
      </section>

      <section v-if="trendingBooks.length > 0" class="recommendations-section">
        <h2>📈 Trending Books</h2>
        <p>What's hot right now:</p>
        <div class="books-carousel">
          <router-link v-for="book in trendingBooks" :key="book.id" :to="`/books/${book.id}`" class="book-link">v
          <div
            class="book-card-small"
          >
            <img
              :src="`https://picsum.photos/seed/${book.id}/150/200`"
              :alt="book.title"
              class="book-cover-small"
              @error="handleImageErrorSmall"
            />
            <h4 class="book-title-small">{{ book.title }}</h4>
            <p class="book-author-small">{{ book.author }}</p>
            <div class="rating-container-small">
              <StarRating :rating="book.averageRating" />
              <span class="num-ratings-small">({{ book.numRatings }})</span>
            </div>
            <span class="book-price-small">${{ book.price.toFixed(2) }}</span>
            <button @click="addToCart(book)" class="add-to-cart-btn-small">
              Add
            </button>
          </div>
          </router-link>
          <div v-if="loadingRecommendations" class="loading-spinner-small">
            Loading...
          </div>
        </div>
      </section>
      <section
        v-else-if="loadingRecommendations"
        class="recommendations-section"
      >
        <p>Loading trending books...</p>
      </section>

      <section class="all-books-section">
        <h2>All Books</h2>
        <div class="books-grid" ref="booksContainer">
          <router-link v-for="book in books" :key="book.id" :to="`/books/${book.id}`" class="book-link">
          <div class="book-card">
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
              <div class="rating-container">
                <StarRating :rating="book.averageRating" />
                <span class="num-ratings">({{ book.numRatings }} ratings)</span>
              </div>
              <div class="book-pricing">
                <span class="book-price">${{ book.price.toFixed(2) }}</span>
                <span
                  class="book-stock"
                  :class="{ 'low-stock': book.stock.quantity < 5 }"
                >
                  In Stock: {{ book.stock.quantity }}
                </span>
                <button @click="addToCart(book)" class="add-to-cart-btn">
                  Add to Cart
                </button>
              </div>
              <div class="book-genre">Genre: {{ book.genre }}</div>
            </div>
          </div>
          </router-link>
        </div>
      </section>
    </div>
    <div v-if="loading" class="loading-spinner">Loading more books...</div>
    <div
      v-if="!loading && books.length === 0 && !loadingRecommendations"
      class="no-books"
    >
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
/* eslint-disable */
import StarRating from '@/components/StarRating.vue';
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useStore } from "vuex";
import axios from "axios";

export default {
  name: "BooksPage",
  components:{
    StarRating,
  },
  setup() {

    const store = useStore();
    const books = ref([]);
    const loading = ref(false);
    const hasMore = ref(true); // Will be controlled by the presence of a nextCursor
    const nextCursorId = ref(null); // <-- NEW: State to hold the cursor for the next page

    const popularBooks = ref([]);
    const trendingBooks = ref([]);
    const userRecommendations = ref([]); // For personalized/hybrid recommendations

    const loadingRecommendations = ref(false); // For fetching recommendations
    const page = ref(1);
    const booksContainer = ref(null);

    const cartItemCount = computed(() => store.getters["cart/itemCount"]);
    const cartTotal = computed(() => store.getters["cart/cartTotal"]);
    const isAuthenticated = computed(
      () => store.getters["auth/isAuthenticated"]
    );

    // --- Core Functions for All Books (Infinite Scroll) ---
    const fetchBooks = async () => {
  // We can still call if loading is true to "reset" the feed, but not if there are no more pages.
  if (!hasMore.value) return; 
  loading.value = true;
  
  try {
    let apiUrl = `/api/books?limit=12`;
    // If we have a cursor from the previous fetch, add it to the query
    if (nextCursorId.value) {
      apiUrl += `&nextCursor=${nextCursorId.value}`;
    }

    const response = await axios.get(apiUrl);
    const { books: newBooks, nextCursor } = response.data;

    if (newBooks.length > 0) {
      // Append the new books to our existing list
      books.value = [...books.value, ...newBooks];
    }
    
    // Update the cursor for the *next* call
    nextCursorId.value = nextCursor;

    // If the API returns no next cursor, we've reached the end
    if (!nextCursor) {
      hasMore.value = false;
    }

  } catch (error) {
    console.error("Error fetching all books:", error);
    hasMore.value = false; // Stop trying on error
  } finally {
    loading.value = false;
  }
};

const handleScroll = () => {
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
  // Trigger fetch when user is 100px from the bottom
  if (scrollTop + clientHeight >= scrollHeight - 100 && !loading.value && hasMore.value) {
    fetchBooks();
  }
};
    // --- New Functions for ML Recommendations ---

    const fetchPopularBooks = async () => {
      // No need to check isAuthenticated for popular/trending
      try {
        const response = await axios.get("/api/books/popular?num=8"); // Fetching 8 popular books
        popularBooks.value = response.data;
      } catch (error) {
        console.error("Error fetching popular books:", error);
      }
    };

    const fetchTrendingBooks = async () => {
      try {
        const response = await axios.get("/api/books/trending?num=8"); // Fetching 8 trending books
        trendingBooks.value = response.data;
      } catch (error) {
        console.error("Error fetching trending books:", error);
      }
    };

    const fetchUserRecommendations = async () => {
      if (!isAuthenticated.value) {
        console.log(
          "User not authenticated, skipping personalized recommendations."
        );
        userRecommendations.value = []; // Clear previous recommendations if user logs out
        return;
      }
      loadingRecommendations.value = true; // Start loading for personal recs
      try {
        // Call the single /api/recommendations endpoint that now provides the hybrid list
        const response = await axios.get("/api/recommendations");
        userRecommendations.value = response.data;
        console.log(
          "Hybrid Recommendations for User:",
          userRecommendations.value
        );
      } catch (error) {
        console.error("Error fetching user recommendations:", error);
        if (error.response && error.response.status === 401) {
          console.warn("User token expired or invalid for recommendations.");
          // Optionally, dispatch logout here if you want to force re-login
          // store.dispatch("auth/logout");
        }
      } finally {
        loadingRecommendations.value = false; // End loading for personal recs
      }
    };

    // --- Utility Functions ---
    const handleImageError = (event) => {
      event.target.src = "https://via.placeholder.com/300x400?text=No+Cover"; // Fallback for larger cards
      event.target.alt = "No Cover Available";
    };

    const handleImageErrorSmall = (event) => {
      event.target.src = "https://via.placeholder.com/150x200?text=No+Cover"; // Fallback for smaller cards
      event.target.alt = "No Cover Available";
    };

    const addToCart = (book) => {
      store.dispatch("cart/addToCart", book);
    };

    // --- Lifecycle Hooks ---
    onMounted(() => {
  // Initial fetch (without a cursor)
  fetchBooks(); 
  
  fetchPopularBooks();
  fetchTrendingBooks();
  fetchUserRecommendations();

  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
    // You might want to re-fetch user recommendations if auth state changes
    // (e.g., user logs in after page load)
    // watch(isAuthenticated, (newValue, oldValue) => {
    //   if (newValue && !oldValue) {
    //     fetchUserRecommendations();
    //   }
    // });

    return {
      books,
      popularBooks,
      trendingBooks,
      userRecommendations,
      loading,
      loadingRecommendations, // Expose for showing loading state in recommendations
      hasMore,
      booksContainer,
      handleImageError,
      handleImageErrorSmall,
      addToCart,
      cartItemCount,
      cartTotal,
      isAuthenticated, // Expose for conditional rendering
    };
  },
};
</script>

<style scoped>
.books-page-container {
  padding: 2rem;
  background-color: #f4f6f9;
  min-height: 100vh;
  font-family: "Arial", sans-serif;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
  background: linear-gradient(
    to right,
    #6dd5ed,
    #2193b0
  ); /* Modern blue gradient */
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  font-size: 2.8rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.page-header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.recommendations-layout {
  display: flex;
  flex-direction: column;
  gap: 3rem; /* Space between main sections */
}

.recommendations-section {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  padding: 1.5rem 2rem;
}

.recommendations-section h2 {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.recommendations-section p {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 1rem;
}

.books-carousel {
  display: flex;
  overflow-x: auto; /* Enable horizontal scrolling */
  gap: 1.2rem;
  padding-bottom: 1rem; /* Space for scrollbar */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: #888 #f1f1f1; /* Firefox */
}

/* For Webkit browsers (Chrome, Safari) */
.books-carousel::-webkit-scrollbar {
  height: 8px;
}
.books-carousel::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 10px;
}
.books-carousel::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}

.book-card-small {
  flex-shrink: 0; /* Prevent shrinking */
  width: 160px; /* Fixed width for small cards */
  background-color: #fcfcfc;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.book-card-small:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}

.book-cover-small {
  width: 100%;
  height: 200px; /* Fixed height for small covers */
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
}

.book-title-small {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap; /* Prevent text wrapping */
  overflow: hidden; /* Hide overflowed text */
  text-overflow: ellipsis; /* Add ellipsis for overflow */
}

.book-author-small {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-price-small {
  font-weight: bold;
  color: #2c3e50;
  font-size: 0.95rem;
  margin-top: auto; /* Push to bottom */
}

.add-to-cart-btn-small {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  margin-top: 10px;
  transition: background-color 0.3s ease;
}

.add-to-cart-btn-small:hover {
  background-color: #2980b9;
}

/* All Books Section (Existing Grid) */
.all-books-section {
  padding-top: 2rem;
  background-color: white; /* Match recommendations section background */
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  padding: 1.5rem 2rem;
}

.all-books-section h2 {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 1.5rem;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(220px, 1fr)
  ); /* Slightly adjusted for better fit */
  gap: 1.5rem;
}

.book-card {
  background-color: #fcfcfc; /* Lighter background for individual cards */
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.book-cover-container {
  height: 280px; /* Adjusted height for larger cards */
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
  font-size: 1.2rem; /* Slightly larger title */
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-author {
  color: #666;
  margin-bottom: 0.5rem;
  font-style: italic;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-pricing {
  display: flex;
  flex-direction: column; /* Stack price and stock */
  align-items: flex-start; /* Align left */
  margin-top: 1rem; /* More space from title/author */
  margin-bottom: 0.5rem;
}

.book-price {
  font-weight: bold;
  color: #2c3e50;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.book-stock {
  font-size: 0.85rem; /* Smaller stock text */
  color: #27ae60;
  font-weight: 600;
}

.low-stock {
  color: #e74c3c; /* Red for low stock */
}

.book-genre {
  font-size: 0.85rem; /* Smaller genre text */
  color: #7f8c8d;
  margin-top: auto; /* Push to bottom */
  padding-top: 10px;
  border-top: 1px solid #eee; /* Separator */
}

.add-to-cart-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem; /* Larger button */
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: 100%; /* Full width button */
  margin-top: 1rem; /* Space from stock info */
}

.add-to-cart-btn:hover {
  background-color: #2980b9;
}

.loading-spinner,
.no-books {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.1rem;
}

.loading-spinner-small {
  text-align: center;
  width: 100%;
  color: #999;
  font-size: 0.9rem;
  padding: 10px;
}

/* Cart Preview */
.cart-preview {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background-color: white;
  padding: 1rem;
  border-radius: 12px; /* Slightly more rounded */
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15); /* Stronger shadow */
  display: flex;
  flex-direction: column;
  gap: 0.8rem; /* More space */
  z-index: 1000;
  align-items: center; /* Center items */
}

.cart-count {
  font-size: 1rem;
  color: #555;
  font-weight: bold;
}

.cart-total {
  font-weight: bold;
  color: #2c3e50;
  font-size: 1.2rem;
}

.view-cart-btn {
  background-color: #28a745; /* Green for cart action */
  color: white;
  text-decoration: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  text-align: center;
  transition: background-color 0.3s ease;
  font-weight: bold;
}

.view-cart-btn:hover {
  background-color: #218838;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .books-page-container {
    padding: 1rem;
  }
  .page-header h1 {
    font-size: 2rem;
  }
  .page-header p {
    font-size: 1rem;
  }
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }
  .book-card-small {
    width: 120px;
    padding: 8px;
  }
  .book-cover-small {
    height: 160px;
  }
  .book-title-small {
    font-size: 0.9rem;
  }
  .book-author-small {
    font-size: 0.8rem;
  }
  .add-to-cart-btn-small {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }
  .cart-preview {
    bottom: 1rem;
    right: 1rem;
    padding: 0.8rem;
  }
  .rating-container-small {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}
.num-ratings-small {
  font-size: 0.75rem;
  color: #7f8c8d;
}

.rating-container {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 1rem;
}
.num-ratings {
  font-size: 0.9rem;
  color: #7f8c8d;
}
}
</style>
