<template>
  <div class="profile-container">
    <div class="profile-header">
      <h1>Profile Settings</h1>
      <div class="user-info-summary">
        <font-awesome-icon icon="user" class="user-icon" />
        <span>{{ user?.email }}</span>
      </div>
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
            <input type="email" v-model="formData.email" required />
          </div>

          <div class="form-group">
            <label>Preferred Language</label>
            <select v-model="formData.preferences.language">
              <option value="EN">English</option>
              <option value="RO">Romanian</option>
              <option value="FR">French</option>
            </select>
          </div>

          <div class="form-group">
            <label>Address</label>
            <div class="address-fields">
              <input
                type="text"
                v-model="formData.address.street"
                placeholder="Street"
              />
              <input
                type="text"
                v-model="formData.address.city"
                placeholder="City"
              />
              <input
                type="text"
                v-model="formData.address.state"
                placeholder="State"
              />
              <input
                type="text"
                v-model="formData.address.zipCode"
                placeholder="ZIP Code"
              />
              <input
                type="text"
                v-model="formData.address.country"
                placeholder="Country"
                class="full-width"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Notification Preferences</label>
            <div class="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  v-model="formData.preferences.newsletter"
                />
                Subscribe to Newsletter
              </label>
              <label>
                <input
                  type="checkbox"
                  v-model="formData.preferences.notifications"
                />
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

      <div class="recent-orders">
        <h2>Recent Orders</h2>
        <div v-if="orders.length" class="orders-list">
          <div v-for="order in orders" :key="order.id" class="order-item">
            <div class="order-header">
              <span class="order-id">Order #{{ order.id }}</span>
              <span class="order-date">{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="order-status" :class="order.status">
              {{ order.status }}
            </div>
            <div class="order-total">${{ order.totalAmount.toFixed(2) }}</div>
          </div>
        </div>
        <div v-else class="no-orders">No orders yet</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useStore } from "vuex";
import { useToast } from "@/composables/useToast";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default {
  name: "ProfilePage",
  components: { FontAwesomeIcon },
  setup() {
    const store = useStore();
    const { showToast } = useToast();
    const loading = ref(false);
    const user = ref(null);
    const orders = ref([]);

    const formData = ref({
      firstName: "",
      lastName: "",
      email: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      preferences: {
        language: "EN",
        newsletter: false,
        notifications: false,
      },
    });

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`/api/auth/profile`);
        user.value = response.data;
        formData.value = {
          firstName: response.data.firstName || "",
          lastName: response.data.lastName || "",
          email: response.data.email || "",
          address: response.data.address || {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },
          preferences: response.data.preferences || {
            language: "EN",
            newsletter: false,
            notifications: false,
          },
        };
      } catch (error) {
        showToast("Error fetching profile", "error");
      }
    };

    const fetchOrders = async () => {
      try {
        const response = await axios.get(`/api/users/${user.value.id}/orders`);
        orders.value = response.data;
      } catch (error) {
        showToast("Error fetching orders", "error");
      }
    };

    const updateProfile = async () => {
      loading.value = true;
      try {
        await axios.put(`/api/users/${user.value.id}`, formData.value);
        showToast("Profile updated successfully", "success");
      } catch (error) {
        showToast("Error updating profile", "error");
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleDateString();
    };

    onMounted(() => {
      fetchProfile();
      fetchOrders();
    });

    return {
      user,
      formData,
      orders,
      store,
      loading,
      updateProfile,
      formatDate,
    };
  },
};
</script>

<style scoped>
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

.user-info-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.user-icon {
  font-size: 1.5rem;
  color: #3498db;
}

.profile-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.profile-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #444;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.address-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.address-fields .full-width {
  grid-column: 1 / -1;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-actions {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.save-btn {
  background: #4caf50;
  color: white;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Rest of the previous styles remain the same */
.recent-orders {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.recent-orders h2 {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e4e8;
}

.order-item {
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.order-id {
  font-weight: 500;
  color: #3498db;
}

.order-date {
  color: #666;
}

.order-status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
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

.no-orders {
  text-align: center;
  color: #666;
  padding: 2rem;
}
</style>
