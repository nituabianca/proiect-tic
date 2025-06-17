<template>
  <div class="library-container">
    <div class="page-header">
      <h1>My Library</h1>
      <p>Your personal collection of owned and wishlisted books.</p>
    </div>
    <div v-if="loading" class="loading-container">Loading your library...</div>

    <section v-if="ownedBooks.length > 0" class="shelf">
      <h2>My Books (Owned)</h2>
      <div class="books-grid">
        <router-link v-for="book in ownedBooks" :key="book.id" :to="`/books/${book.id}`" class="book-link">
          <div class="book-card-library">
            <img
              :src="`https://picsum.photos/seed/${book.id}/300/400`"
              :alt="book.title"
              class="book-cover"
              @error="handleImageError"
            />
            <div class="book-info">
              <h3 class="book-title">{{ book.title }}</h3>
            </div>
          </div>
        </router-link>
      </div>
    </section>

    <section v-if="wishlistedBooks.length > 0" class="shelf">
      <h2>My Wishlist</h2>
      <div class="books-grid">
        <router-link v-for="book in wishlistedBooks" :key="book.id" :to="`/books/${book.id}`" class="book-link">
          <div class="book-card-library">
            <img
              :src="`https://picsum.photos/seed/${book.id}/300/400`"
              :alt="book.title"
              class="book-cover"
              @error="handleImageError"
            />
            <div class="book-info">
              <h3 class="book-title">{{ book.title }}</h3>
            </div>
          </div>
        </router-link>
      </div>
    </section>

    <div v-if="!loading && libraryBooks.length === 0" class="empty-library">
      <h3>Your library is empty.</h3>
      <p>Purchase books or add them to your wishlist to get started!</p>
      <router-link to="/books" class="btn">Explore Books</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const libraryBooks = ref([]);
const loading = ref(true);

// Computed properties to create the "shelves" by filtering the main list
const ownedBooks = computed(() => libraryBooks.value.filter(b => b.status === 'in_library'));
const wishlistedBooks = computed(() => libraryBooks.value.filter(b => b.status === 'wishlisted'));

const fetchLibrary = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/library/my-library');
    libraryBooks.value = response.data;
  } catch (err) {
    console.error("Failed to fetch library", err);
  } finally {
    loading.value = false;
  }
};

const handleImageError = (event) => {
  event.target.src = "https://via.placeholder.com/180x250?text=No+Cover";
};

onMounted(fetchLibrary);
</script>

<style scoped>
.library-container { padding: 2rem; }
.shelf { margin-bottom: 3rem; }
.shelf h2 { padding-bottom: 1rem; border-bottom: 1px solid #ddd; }
.books-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1.5rem; }
.book-card-library img { width: 100%; border-radius: 4px; }
</style>