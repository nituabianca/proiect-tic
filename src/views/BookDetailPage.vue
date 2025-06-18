<template>
  <div class="page-wrapper">
    <div v-if="loading" class="loading-container">Loading book...</div>
    <div v-else-if="error" class="error-container">{{ error }}</div>

    <div v-if="book" class="book-detail-container">
      <div class="main-content">
        <div class="cover-image-container">
          <img
            :src="`https://picsum.photos/seed/${book.id}/150/200`"
            :alt="book.title"
            class="cover-image"
            @error="handleImageErrorSmall"
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
            <span class="price">${{ (book.price || 0).toFixed(2) }}</span>
            <button @click="addToCart(book)" class="btn-cart">Add to Cart</button>
            <button @click="toggleWishlist" class="btn-wishlist" title="Add to Wishlist">
              <font-awesome-icon :icon="['far', 'heart']" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="isAuthenticated" class="review-section">
        <h3>Leave a Review</h3>
        <form @submit.prevent="submitRating" class="review-form">
          <div class="form-group">
            <label>Your Rating</label>
            <div class="interactive-stars">
              <span v-for="star in 5" :key="star" class="star" @click="setRating(star)" @mouseover="hoverRating = star" @mouseleave="hoverRating = 0">
                <font-awesome-icon :icon="star <= (hoverRating || newReview.rating) ? ['fas', 'star'] : ['far', 'star']" />
              </span>
            </div>
          </div>
          <div class="form-group">
            <label>Your Review (optional)</label>
            <textarea v-model="newReview.text" placeholder="Share your thoughts on the book..." rows="4"></textarea>
          </div>
          <button type="submit" :disabled="ratingLoading || newReview.rating === 0" class="submit-review-btn">
            {{ ratingLoading ? 'Submitting...' : 'Submit Review' }}
          </button>
        </form>
      </div>

      <div v-if="similarBooks.length > 0" class="similar-books-section">
        <h3>More Like This</h3>
        <div class="books-carousel">
          <router-link v-for="similarBook in similarBooks" :key="similarBook.id" :to="`/books/${similarBook.id}`" class="book-link">
            <div class="book-card-small">
              <img
                :src="`https://picsum.photos/seed/${book.id}/150/200`"
                :alt="book.title"
                class="book-cover-small"
                @error="handleImageErrorSmall"
              />
              <h4 class="book-title-small">{{ similarBook.title }}</h4>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import StarRating from '@/components/StarRating.vue';
import { useToast } from "@/composables/useToast";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from "@fortawesome/fontawesome-svg-core";
import { faHeart as farHeart, faStar as farStar } from '@fortawesome/free-regular-svg-icons';
import { faStar as fasStar } from '@fortawesome/free-solid-svg-icons';

library.add(farHeart, farStar, fasStar);

const route = useRoute();
const store = useStore();
const { showToast } = useToast();
const book = ref(null);
const similarBooks = ref([]);
const loading = ref(true);
const error = ref(null);

// State for the new review form
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const newReview = ref({ rating: 0, text: '' });
const hoverRating = ref(0);
const ratingLoading = ref(false);

const fetchData = async (bookId) => {
  loading.value = true;
  error.value = null;
  book.value = null;
  similarBooks.value = [];
  try {
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
  if (!isAuthenticated.value) {
    return showToast('Please log in to wishlist books.', 'error');
  }
  try {
    await axios.post(`/api/library/${book.value.id}`, { status: 'wishlisted' });
    showToast(`'${book.value.title}' added to your wishlist!`, 'success');
  } catch (err) {
    showToast('Failed to update wishlist.', 'error');
  }
};

// Method to set the star rating from the interactive form
const setRating = (rating) => {
  newReview.value.rating = rating;
};

// Method to submit the new rating and review
const submitRating = async () => {
  if (newReview.value.rating === 0) {
    return showToast("Please select a star rating first.", "error");
  }
  ratingLoading.value = true;
  try {
    await axios.put(`/api/ratings/book/${book.value.id}`, {
      rating: newReview.value.rating,
      reviewText: newReview.value.text,
    });
    showToast("Thank you for your review!", "success");
    newReview.value = { rating: 0, text: '' };
    // Refresh the page data to show the new average rating
    await fetchData(route.params.id);
  } catch (err) {
    showToast("Failed to submit review.", "error");
  } finally {
    ratingLoading.value = false;
  }
};

const handleImageError = (event) => {
  event.target.src = "https://via.placeholder.com/300x450?text=No+Cover";
};
const handleImageErrorSmall = (event) => {
  event.target.src = "https://via.placeholder.com/150x220?text=No+Cover";
};

onMounted(() => { fetchData(route.params.id); });
watch(() => route.params.id, (newId) => { if (newId) fetchData(newId); });
</script>

<style scoped>
.page-wrapper { padding: 2rem; background-color: #f8f9fa; }
.book-detail-container { max-width: 1200px; margin: 0 auto; }
.main-content { background-color: #ffffff; padding: 2.5rem; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); display: grid; grid-template-columns: 300px 1fr; gap: 3rem; margin-bottom: 3rem; }
.cover-image { width: 100%; border-radius: 8px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
.title { font-size: 2.5rem; margin-bottom: 0.5rem; }
.author { font-size: 1.5rem; color: #666; margin-bottom: 1rem; font-style: italic; }
.rating-section { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; }
.description { line-height: 1.7; margin-bottom: 1.5rem; color: #333; }
.meta-details { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem; color: #555; }
.actions { display: flex; align-items: center; gap: 1rem; margin-top: auto; padding-top: 1.5rem; border-top: 1px solid #eee;}
.price { font-size: 2rem; font-weight: bold; color: #2c3e50; }
.btn-cart, .btn-wishlist { padding: 0.8rem 1.5rem; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: all 0.2s ease; font-size: 1rem; }
.btn-cart { background-color: #3498db; color: white; }
.btn-cart:hover { background-color: #2980b9; transform: translateY(-2px); }
.btn-wishlist { background-color: transparent; border: 2px solid #e74c3c; color: #e74c3c; }
.btn-wishlist:hover { background-color: #e74c3c; color: white; transform: translateY(-2px); }

/* Review Section Styles */
.review-section { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 3rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); }
.review-section h3 { margin-top: 0; font-size: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
.review-form .form-group { margin-bottom: 1.5rem; }
.review-form label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
.interactive-stars { font-size: 1.8rem; color: #f1c40f; }
.interactive-stars .star { cursor: pointer; margin-right: 5px; }
.review-form textarea { width: 100%; padding: 0.75rem; border-radius: 6px; border: 1px solid #ddd; font-size: 1rem; }
.submit-review-btn { padding: 0.75rem 1.5rem; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; background-color: #27ae60; color: white; }
.submit-review-btn:disabled { background-color: #ccc; cursor: not-allowed; }

/* Similar Books Styles */
.similar-books-section { padding-top: 2rem; }
.similar-books-section h3 { margin-bottom: 1.5rem; font-size: 1.5rem; text-align: center; }
.books-carousel { display: flex; overflow-x: auto; gap: 1.5rem; padding: 1rem; }
.book-link { text-decoration: none; color: inherit; }
.book-card-small { flex-shrink: 0; width: 160px; text-align: center; }
.book-cover-small { width: 100%; height: 220px; object-fit: cover; border-radius: 4px; margin-bottom: 0.5rem; }
.book-title-small { font-size: 0.9rem; font-weight: bold; }

@media (max-width: 992px) {
  .main-content { grid-template-columns: 1fr; }
  .cover-image-container { max-width: 300px; margin: 0 auto; }
  .title, .author { text-align: center; }
}
</style>