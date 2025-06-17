<template>
  <div class="profile-container" v-if="user">
    <div class="profile-header">
      <h1>Profile Settings</h1>
      <h2>Welcome, {{ user.firstName }}!</h2>
    </div>

    <div class="profile-content">
      <form @submit.prevent="updateProfile" class="profile-form">
        <div class="form-grid">
          <div class="form-group">
            <label>First Name</label>
            <input type="text" v-model="formData.firstName" required />
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input type="text" v-model="formData.lastName" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" v-model="formData.email" required disabled />
          </div>
          <div class="form-group full-width">
            <label>Address</label>
            <div class="address-fields">
              <input type="text" v-model="formData.address.street" placeholder="Street" />
              <input type="text" v-model="formData.address.city" placeholder="City" />
              <input type="text" v-model="formData.address.state" placeholder="State" />
              <input type="text" v-model="formData.address.zipCode" placeholder="ZIP Code" />
              <input type="text" v-model="formData.address.country" placeholder="Country" />
            </div>
          </div>
          <div class="form-group">
            <label>Language</label>
            <select v-model="formData.preferences.language">
              <option value="EN">English</option>
              <option value="RO">Romanian</option>
              <option value="FR">French</option>
            </select>
          </div>
          <div class="form-group">
            <label>Preferences</label>
            <div class="checkbox-group">
              <label>
                <input type="checkbox" v-model="formData.preferences.newsletter" />
                Subscribe to Newsletter
              </label>
              <label>
                <input type="checkbox" v-model="formData.preferences.notifications" />
                Enable Notifications
              </label>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="save-btn" :disabled="loading">
            {{ loading ? "Saving..." : "Save Changes" }}
          </button>
        </div>
      </form>

      <div class="side-panel">
        <div class="recent-orders">
          <h2>Recent Orders</h2>
          <div v-if="orders.length" class="orders-list">
            <div v-for="order in orders.slice(0, 3)" :key="order.id" class="order-item">
              <div class="order-header">
                <span class="order-id">Order #{{ order.id.slice(-6) }}</span>
                <span class="order-date">{{ formatDate(order.createdAt) }}</span>
              </div>
              <div class="order-status" :class="order.status">{{ order.status }}</div>
            </div>
          </div>
          <div v-else class="no-orders">No orders yet</div>
        </div>

        <div v-if="isAdmin" class="admin-panel">
          <h2><font-awesome-icon icon="tools" /> Developer Control Panel</h2>

          <div class="panel-section">
            <h3>Seeding Tools</h3>
            <div class="action-item">
              <input type="number" v-model.number="seedCounts.books" />
              <button @click="handleSeed('books')" :disabled="loading" class="seed-btn">Seed Books</button>
            </div>
            <div class="action-item">
              <input type="number" v-model.number="seedCounts.users" />
              <button @click="handleSeed('users')" :disabled="loading" class="seed-btn">Seed Users</button>
            </div>
            <div class="action-item">
              <input type="number" v-model.number="seedCounts.orders" />
              <button @click="handleSeed('orders')" :disabled="loading" class="seed-btn">Seed Orders</button>
            </div>
          </div>

          <div class="panel-section">
            <h3>Deletion Tools (Danger Zone)</h3>
            <div class="action-item">
              <button @click="handleDelete('books')" :disabled="loading" class="delete-btn">Delete All Books</button>
              <button @click="handleDelete('orders')" :disabled="loading" class="delete-btn">Delete All Orders</button>
              <button @click="handleDelete('users')" :disabled="loading" class="delete-btn">Delete All Users</button>
            </div>
          </div>

          <div class="panel-section">
            <h3>All-In-One</h3>
            <div class="action-item">
              <button @click="handleResetDatabase" class="reset-btn" :disabled="loading">
                <font-awesome-icon icon="skull-crossbones" /> Reset Entire Database
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="loading-profile">Loading profile...</div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useToast } from "@/composables/useToast";
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from "@fortawesome/fontawesome-svg-core";
import { faSkullCrossbones, faSeedling } from "@fortawesome/free-solid-svg-icons";
import { faTools } from "@fortawesome/free-solid-svg-icons";

library.add(faTools);
library.add(faSkullCrossbones, faSeedling);

const store = useStore();
const { showToast } = useToast();
const loading = ref(false);
const orders = ref([]);

// Get user data directly from the Vuex store
const user = computed(() => store.getters['auth/currentUser']);
const isAdmin = computed(() => store.getters['auth/isAdmin']);

const formData = ref({
  firstName: "",
  lastName: "",
  email: "",
  address: { street: "", city: "", state: "", zipCode: "", country: "" },
  preferences: { language: "EN", newsletter: false, notifications: false },
});

// NEW: State for seeder counts
const seedCounts = ref({
  books: 50,
  users: 10,
  orders: 25,
});

// Watch for the user data to become available from the store and populate the form
watch(user, (newUser) => {
  if (newUser) {
    formData.value = {
      ...formData.value, // Keep default structure
      firstName: newUser.firstName || "",
      lastName: newUser.lastName || "",
      email: newUser.email || "",
      address: newUser.address || formData.value.address,
      preferences: newUser.preferences || formData.value.preferences,
    };
  }
}, { immediate: true }); // `immediate: true` runs the watcher on component load

const fetchOrders = async () => {
  try {
    // CORRECTED: The endpoint for a user's own orders
    const response = await axios.get("/api/orders/my-orders");
    orders.value = response.data;
  } catch (error) {
    showToast("Error fetching recent orders", "error");
  }
};

const updateProfile = async () => {
  if (!user.value) return;
  loading.value = true;
  try {
    await axios.put(`/api/users/${user.value.id}`, formData.value);
    // Refresh the user profile in the store
    await store.dispatch('auth/fetchUserProfile');
    showToast("Profile updated successfully", "success");
  } catch (error) {
    showToast("Error updating profile", "error");
  } finally {
    loading.value = false;
  }
};

const handleResetDatabase = async () => {
  if (confirm("DANGER: Are you absolutely sure you want to delete the entire database? This cannot be undone.")) {
    loading.value = true;
    try {
      await axios.post('/api/dev/reset-database');
      showToast("Database has been reset successfully!", "success");
      // Log the user out as their account no longer exists
      await store.dispatch('auth/logout');
      window.location.href = '/login';
    } catch (error) {
      showToast("Error resetting database. Check server logs.", "error");
    } finally {
      loading.value = false;
    }
  }
};

const handleSeed = async (type) => {
  const count = seedCounts.value[type] || 0;
  if (count <= 0) return showToast('Please enter a number greater than 0.', 'error');
  if (confirm(`Are you sure you want to seed ${count} ${type}?`)) {
    loading.value = true;
    try {
      const response = await axios.post(`/api/dev/seed/${type}`, { count });
      showToast(response.data.message, "success");
    } catch (error) {
      showToast(`Error seeding ${type}. Check server logs.`, "error");
    } finally {
      loading.value = false;
    }
  }
};

const handleDelete = async (type) => {
  if (confirm(`DANGER: Are you sure you want to delete ALL ${type}? This cannot be undone.`)) {
    loading.value = true;
    try {
      const response = await axios.delete(`/api/dev/delete/${type}`);
      showToast(response.data.message, "success");
    } catch (error) {
      showToast(`Error deleting ${type}. Check server logs.`, "error");
    } finally {
      loading.value = false;
    }
  }
};

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";

  // This check for `_seconds` will now correctly parse the date from your API.
  if (timestamp._seconds) {
    return new Date(timestamp._seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

onMounted(() => {
  // If user data isn't in the store yet, the router guard should be fetching it.
  // We just need to fetch the orders.
  if (user.value) {
    fetchOrders();
  }

  // return {
  //   user,
  //   formData,
  //   orders,
  //   loading,
  //   updateProfile,
  //   formatDate,
  //   handleSeedDatabase,
  // };
});
</script>

<style scoped>
/* Your existing styles are great, let's just add styles for the new button */
.seed-btn {
  background-color: #27ae60;
  color: white;
  width: 70%;
  margin-top: 1rem; /* Add some space from the reset button */
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.seed-btn:hover {
  background-color: #229954;
}
.seed-btn:disabled {
  background-color: #ccc;
}
.admin-tools {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  border-radius: 8px;
  padding: 1.5rem;
}
.admin-tools h2 {
  margin-top: 0;
}
.reset-btn {
  background-color: #dc3545;
  color: white;
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.reset-btn:hover {
  background-color: #c82333;
}
.reset-btn:disabled {
  background-color: #ccc;
}

.profile-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e4e8;
}

.email-verify-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.email-verify-status.verified {
  background: #d1e7dd;
  color: #0f5132;
}

.email-verify-status:not(.verified) {
  background: #fff3cd;
  color: #856404;
}

.profile-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #2c3e50;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.address-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-actions {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.save-btn,
.verify-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.save-btn {
  background: #3498db;
  color: white;
}

.verify-btn {
  background: #f1c40f;
  color: #34495e;
}

.save-btn:hover {
  background: #2980b9;
}
.verify-btn:hover {
  background: #f39c12;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.recent-orders {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.order-item {
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.order-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.order-status.pending {
  background: #fff3cd;
  color: #856404;
}
.order-status.processing {
  background: #cce5ff;
  color: #004085;
}
.order-status.shipped {
  background: #d4edda;
  color: #155724;
}
.order-status.delivered {
  background: #d1e7dd;
  color: #0f5132;
}
.order-status.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.order-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  color: #666;
}

.view-order-btn {
  display: block;
  text-align: center;
  padding: 0.5rem;
  background: #f8f9fa;
  color: #2c3e50;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.view-order-btn:hover {
  background: #e9ecef;
}

.admin-panel { background: #fdf2f2; border: 1px solid #fbcaca; color: #58151c; border-radius: 8px; padding: 1.5rem; }
.admin-panel h2 { margin-top: 0; display: flex; align-items: center; gap: 0.5rem; }
.panel-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #fbcaca; }
.action-item { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; align-items: center; }
.action-item input { padding: 0.5rem; border-radius: 4px; border: 1px solid #fbcaca; width: 80px; }
.action-item button { flex-shrink: 0; }
.delete-btn { background-color: #ef4444; color: white;   width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;}
.delete-btn:hover { background-color: #dc2626; }

@media (max-width: 768px) {
  .profile-content {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .address-fields {
    grid-template-columns: 1fr;
  }
}
</style>
