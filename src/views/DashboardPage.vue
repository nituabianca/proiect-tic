<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Book Ecommerce Dashboard</h1>
      <div v-if="user" class="user-section">
        <div class="user-info">
          <span class="user-email">{{ user.email }}</span>
          <button @click="handleLogout" class="logout-button">Logout</button>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="action-grid">
          <div class="action-card">
            <h3>Manage Books</h3>
            <p>Add, edit, or remove books from your store</p>
            <router-link to="/books/manage" class="action-button">
              Manage Inventory
            </router-link>
          </div>

          <div class="action-card">
            <h3>Orders</h3>
            <p>View and manage your recent orders</p>
            <router-link to="/orders" class="action-button">
              View Orders
            </router-link>
          </div>

          <div class="action-card">
            <h3>Profile</h3>
            <p>Update your personal information</p>
            <router-link to="/profile" class="action-button">
              Edit Profile
            </router-link>
          </div>
        </div>
      </div>

      <div class="recent-activity">
        <h2>Recent Activity</h2>
        <div v-if="recentOrders.length" class="activity-list">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="activity-item"
          >
            <span class="order-details">
              Order #<span class="order-id">{{ order.id }}</span> -
              {{ formatDate(order.dates?.ordered || order.dates?.processed) }}
            </span>
            <span
              class="order-status"
              :class="(order.status || 'unknown').toLowerCase()"
            >
              {{ order.status || "Unknown Status" }}
            </span>
          </div>
        </div>
        <p v-else class="no-activity">No recent activity</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

export default {
  name: "DashboardPage",
  setup() {
    const user = ref(null);
    const router = useRouter();
    const recentOrders = ref([]);

    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/api/auth/profile`,
          { withCredentials: true }
        );
        user.value = response.data;
      } catch (error) {
        console.error("Error fetching profile:", error);
        router.push("/login");
      }
    };

    const fetchRecentOrders = async () => {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/api/orders`,
          { withCredentials: true }
        );
        console.log("Fetched orders:", response.data);
        recentOrders.value = response.data.slice(0, 5);
      } catch (error) {
        console.error("Error fetching recent orders:", error);
      }
    };

    const handleLogout = async () => {
      try {
        await axios.post(
          `${process.env.VUE_APP_API_URL}/api/auth/logout`,
          {},
          { withCredentials: true }
        );
        router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
      }
    };

    const formatDate = (timestampObj) => {
      if (!timestampObj || !timestampObj._seconds) return "Invalid Date";

      const date = new Date(timestampObj._seconds * 1000);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    onMounted(() => {
      fetchProfile();
      fetchRecentOrders();
    });

    return {
      user,
      recentOrders,
      handleLogout,
      formatDate,
    };
  },
};
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f4f6f9;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e4e8;
}

.user-section {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-email {
  font-weight: 500;
  color: #333;
}

.logout-button {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.logout-button:hover {
  background-color: #d32f2f;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.quick-actions h2,
.recent-activity h2 {
  border-bottom: 2px solid #e0e4e8;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.action-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.action-card:hover {
  transform: translateY(-5px);
}

.action-card h3 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.action-button {
  display: inline-block;
  margin-top: 1rem;
  background-color: #3498db;
  color: white;
  padding: 0.5rem 1rem;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.action-button:hover {
  background-color: #2980b9;
}

.recent-activity {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e0e4e8;
}

.order-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.order-id {
  background-color: #ff6a00; /* Bright orange */
  color: white;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: bold;
}

.order-status {
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: bold;
}

.order-status.pending {
  background-color: #ffa500; /* Orange */
  color: white;
}

.order-status.processing {
  background-color: #1e90ff; /* Dodger Blue */
  color: white;
}

.order-status.shipped {
  background-color: #4caf50; /* Green */
  color: white;
}

.order-status.delivered {
  background-color: #2e8b57; /* Sea Green */
  color: white;
}

.order-status.cancelled {
  background-color: #dc143c; /* Crimson */
  color: white;
}

.no-activity {
  text-align: center;
  color: #7f8c8d;
  padding: 1rem;
}

@media (max-width: 768px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}
</style>
