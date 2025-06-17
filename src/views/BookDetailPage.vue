<template>
  <div v-if="loading" class="loading-container">Loading book...</div>
  <div v-if="error" class="error-container">{{ error }}</div>

  <div v-if="book" class="book-detail-container">
    <div class="main-content">
      <div class="cover-image-container">
        <img
          :src="`https://picsum.photos/seed/${book.id}/300/400`"
          :alt="book.title"
          class="cover-image"
        />
      </div>
      <div class="book-info">
        <h1 class="title">{{ book.title }}</h1>
        <h2 class="author">by {{ book.author }}</h2>
        <div class="rating-section">
          <StarRating :rating="book.averageRating" />
          <span>({{ book.numRatings }} ratings)</span>
        </div>
        <p class="description">{{ book.description }}</p>
        <div class="meta-details">
          <span><strong>Genre:</strong> {{ book.genre }}</span>
          <span><strong>Publisher:</strong> {{ book.publisher }}</span>
          <span><strong>Pages:</strong> {{ book.pages }}</span>
        </div>
        <div class="actions">
          <span class="price">${{ book.price.toFixed(2) }}</span>
          <button @click="addToCart(book)" class="btn-cart">Add to Cart</button>
          <button @click="toggleWishlist" class="btn-wishlist" title="Add to Wishlist">
            <font-awesome-icon :icon="['far', 'heart']" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="similarBooks.length > 0" class="similar-books-section">
      <h3>More Like This</h3>
      <div class="books-carousel">
        <router-link v-for="similarBook in similarBooks" :key="similarBook.id" :to="`/books/${similarBook.id}`" class="book-link">
          <div class="book-card-small">
            <img :src="similarBook.coverImageUrl" :alt="similarBook.title" class="book-cover-small" />
            <h4 class="book-title-small">{{ similarBook.title }}</h4>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import StarRating from '@/components/StarRating.vue';
import { useToast } from "@/composables/useToast";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from "@fortawesome/fontawesome-svg-core";
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';

library.add(farHeart);

const route = useRoute();
const store = useStore();
const { showToast } = useToast();
const book = ref(null);
const similarBooks = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchData = async (bookId) => {
  loading.value = true;
  error.value = null;
  book.value = null;
  similarBooks.value = [];

  try {
    // Fetch both requests in parallel for speed
    const [bookResponse, similarResponse] = await Promise.all([
      axios.get(`/api/books/${bookId}`),
      axios.get(`/api/recommendations/similar-to/${bookId}`)
    ]);
    book.value = bookResponse.data;
    similarBooks.value = similarResponse.data;
  } catch (err) {
    error.value = "Failed to load book details. Please try again later.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const addToCart = (bookToAdd) => {
  store.dispatch('cart/addToCart', bookToAdd);
  showToast(`${bookToAdd.title} added to cart!`, 'success');
};

const toggleWishlist = async () => {
  if (!store.getters['auth/isAuthenticated']) {
    return showToast('Please log in to wishlist books.', 'error');
  }
  try {
    // This now correctly calls our upgraded backend endpoint
    await axios.post(`/api/library/${book.value.id}`, { status: 'wishlisted' });
    showToast(`'${book.value.title}' added to your wishlist!`, 'success');
  } catch (err) {
    showToast('Failed to update wishlist.', 'error');
  }
};

// Fetch data when component mounts
onMounted(() => { fetchData(route.params.id); });
watch(() => route.params.id, (newId) => { if(newId) fetchData(newId); });
</script>

<style scoped>
/* Add styles for a beautiful book detail page */
.book-detail-container { padding: 2rem; }
.main-content {
  /* --- NEW STYLES FOR THE CARD --- */
  background-color: #ffffff;    /* The white background */
  padding: 2.5rem;              /* The user-requested padding */
  border-radius: 16px;          /* Soft, modern rounded corners */
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08); /* A subtle shadow to lift the card */

  /* --- Existing Styles --- */
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3rem; /* Increased gap for better spacing inside the card */
  margin-bottom: 3rem;
}
.cover-image { width: 100%; border-radius: 8px; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
.title { font-size: 2.5rem; margin-bottom: 0.5rem; }
.author { font-size: 1.5rem; color: #666; margin-bottom: 1rem; font-style: italic; }
.rating-section { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
.description { line-height: 1.7; margin-bottom: 1.5rem; }
.meta-details { display: flex; gap: 1.5rem; margin-bottom: 2rem; color: #333; }
.actions { display: flex; align-items: center; gap: 1rem; }
.price { font-size: 2rem; font-weight: bold; color: #2c3e50; }
.btn-cart, .btn-library { padding: 0.8rem 1.5rem; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-cart { background-color: #3498db; color: white; }
.btn-library { background-color: #f1c40f; color: #333; }
.similar-books-section { border-top: 1px solid #eee; padding-top: 2rem; }
.similar-books-section h3 { margin-bottom: 1rem; }
/* Reuse carousel styles from BooksPage */
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

@media (max-width: 992px) {
  .main-content {
    grid-template-columns: 1fr; /* Stack image on top of details */
    padding: 1.5rem;
    gap: 2rem;
  }

  .cover-image-container {
    max-width: 300px;
    margin: 0 auto; /* Center the cover image on mobile */
  }

  .title {
    font-size: 2rem;
    text-align: center;
  }

  .author {
    font-size: 1.25rem;
    text-align: center;
  }
}
</style>