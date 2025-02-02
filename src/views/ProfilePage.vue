<template>
  <div class="profile-container">
    <div class="profile-header">
      <h1>Profile Settings</h1>
      <div class="user-info-summary">
        <div
          class="email-verify-status"
          :class="{ verified: user?.emailVerified }"
        >
          {{ user?.emailVerified ? "Email Verified" : "Email Not Verified" }}
        </div>
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
            <input type="email" v-model="formData.email" required disabled />
          </div>

          <div class="form-group full-width">
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
              />
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
          <button
            v-if="!user?.emailVerified"
            type="button"
            class="verify-btn"
            @click="resendVerification"
          >
            Resend Verification Email
          </button>
          <button type="submit" class="save-btn" :disabled="loading">
            {{ loading ? "Saving..." : "Save Changes" }}
          </button>
        </div>
      </form>

      <div class="side-panel">
        <div class="recent-orders">
          <h2>Recent Orders</h2>
          <div v-if="orders.length" class="orders-list">
            <div v-for="order in orders" :key="order.id" class="order-item">
              <div class="order-header">
                <span class="order-id">Order #{{ order.id }}</span>
                <span class="order-date">{{
                  formatDate(order.createdAt)
                }}</span>
              </div>
              <div class="order-status" :class="order.orderStatus">
                {{ order.orderStatus }}
              </div>
              <div class="order-info">
                <div class="order-items-count">
                  {{ order.items.length }} items
                </div>
                <div class="order-total">${{ order.total.toFixed(2) }}</div>
              </div>
              <router-link :to="'/orders/' + order.id" class="view-order-btn">
                View Details
              </router-link>
            </div>
          </div>
          <div v-else class="no-orders">No orders yet</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useStore } from "vuex";
import { useToast } from "@/composables/useToast";
import axios from "axios";

export default {
  name: "ProfilePage",
  setup() {
    /*eslint-disable*/
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
        const response = await axios.get("/api/orders/my");
        orders.value = response.data;
      } catch (error) {
        showToast("Error fetching orders", "error");
      }
    };

    const updateProfile = async () => {
      loading.value = true;
      try {
        await axios.put(`/api/users/${user.value.id}`, formData.value);
        await fetchProfile(); // Refresh profile data
        showToast("Profile updated successfully", "success");
      } catch (error) {
        showToast("Error updating profile", "error");
      } finally {
        loading.value = false;
      }
    };

    const resendVerification = async () => {
      try {
        await axios.post("/api/auth/verify/resend");
        showToast("Verification email sent", "success");
      } catch (error) {
        showToast("Error sending verification email", "error");
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
      loading,
      updateProfile,
      resendVerification,
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
