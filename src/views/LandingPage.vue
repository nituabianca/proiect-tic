<template>
  <div class="landing-page">
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Find Your Next Story</h1>
        <p class="hero-subtitle">Personalized recommendations and a universe of books at your fingertips.</p>
        <div class="hero-actions">
          <router-link to="/books" class="btn btn-primary">Explore Books</router-link>
          <router-link to="/register" class="btn btn-secondary">Join Now</router-link>
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="feature-card">
        <div class="feature-icon"><font-awesome-icon icon="brain" /></div>
        <h3 class="feature-title">Smart Recommendations</h3>
        <p>Our ML engine learns your taste to suggest books you'll truly love.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><font-awesome-icon icon="book-open" /></div>
        <h3 class="feature-title">Vast Collection</h3>
        <p>From timeless classics to modern bestsellers, your next chapter awaits.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><font-awesome-icon icon="users" /></div>
        <h3 class="feature-title">Community Driven</h3>
        <p>See what others are reading and share your own thoughts and reviews.</p>
      </div>
    </section>

    <section class="popular-preview" v-if="popularBooks.length > 0">
      <h2 class="section-title">Popular With Our Readers</h2>
      <div class="books-carousel">
        <div v-for="book in popularBooks" :key="book.id" class="book-card-small">
          <img :src="book.coverImageUrl" :alt="book.title" class="book-cover-small" @error="handleImageError" />
          <h4 class="book-title-small">{{ book.title }}</h4>
          <p class="book-author-small">{{ book.author }}</p>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from "@fortawesome/fontawesome-svg-core";
import { faBrain, faBookOpen, faUsers } from "@fortawesome/free-solid-svg-icons";

library.add(faBrain, faBookOpen, faUsers);

const popularBooks = ref([]);
const loading = ref(false);

const fetchPopularBooks = async () => {
  loading.value = true;
  try {
    const response = await axios.get("/api/books/popular?num=10");
    popularBooks.value = response.data;
  } catch (error) {
    console.error("Error fetching popular books for landing page:", error);
  } finally {
    loading.value = false;
  }
};

const handleImageError = (event) => {
  event.target.src = "https://via.placeholder.com/150x220?text=No+Cover";
};

onMounted(() => {
  fetchPopularBooks();
});
</script>

<style scoped>
/* Scoped styles for a beautiful landing page */
.landing-page {
  width: 100%;
}

.hero-section {
  background: linear-gradient(rgba(44, 62, 80, 0.7), rgba(44, 62, 80, 0.7)), url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2070&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
  color: white;
  text-align: center;
  padding: 6rem 2rem;
}
.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 2.5rem;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
.hero-actions .btn {
  margin: 0 0.5rem;
  padding: 0.8rem 1.8rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
}
.btn-primary {
  background-color: #3498db;
  color: white;
}
.btn-primary:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}
.btn-secondary {
  background-color: transparent;
  color: white;
  border: 2px solid white;
}
.btn-secondary:hover {
  background-color: white;
  color: #2c3e50;
  transform: translateY(-2px);
}

.features-section {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 4rem 2rem;
  background-color: #f8f9fa;
  flex-wrap: wrap;
}
.feature-card {
  text-align: center;
  max-width: 300px;
}
.feature-icon {
  font-size: 2.5rem;
  color: #3498db;
  margin-bottom: 1rem;
}
.feature-title {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.popular-preview {
  padding: 4rem 2rem;
  text-align: center;
}
.section-title {
  font-size: 2.5rem;
  margin-bottom: 2rem;
}
/* Re-using carousel styles from BooksPage */
.books-carousel {
  display: flex;
  overflow-x: auto;
  gap: 1.2rem;
  padding-bottom: 1rem;
  justify-content: center; /* Center if not overflowing */
}
.book-card-small {
  flex-shrink: 0;
  width: 160px;
  text-align: left;
}
.book-cover-small {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.book-title-small { font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.book-author-small { font-size: 0.9rem; color: #666; }
</style>
