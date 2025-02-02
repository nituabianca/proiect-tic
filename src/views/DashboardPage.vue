<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Admin Dashboard</h1>
      <div v-if="user" class="user-section">
        <div class="user-info">
          <span class="user-role">{{ user.role }}</span>
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
            <p>View and manage customer orders</p>
            <div class="order-stats">
              <div class="stat-item">
                <span class="stat-label">Pending</span>
                <span class="stat-value">{{ getPendingOrdersCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Processing</span>
                <span class="stat-value">{{ getProcessingOrdersCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="recent-activity">
        <h2>Recent Orders</h2>
        <div v-if="recentOrders.length" class="activity-list">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="activity-item"
          >
            <div class="order-header">
              <span class="order-details"> Order #{{ order.id }} </span>
              <span class="order-status" :class="order.orderStatus">
                {{ order.orderStatus }}
              </span>
            </div>
            <div class="order-info">
              <div class="order-date">{{ formatDate(order.createdAt) }}</div>
              <div class="order-amount">${{ order.total?.toFixed(2) }}</div>
            </div>
            <select
              v-model="order.orderStatus"
              @change="updateOrderStatus(order.id, $event.target.value)"
              class="status-select"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <p v-else class="no-activity">No recent orders</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

export default {
  name: "DashboardPage",
  setup() {
    const user = ref(null);
    const router = useRouter();
    const recentOrders = ref([]);

    const getPendingOrdersCount = computed(() => {
      return recentOrders.value.filter(
        (order) => order.orderStatus === "pending"
      ).length;
    });

    const getProcessingOrdersCount = computed(() => {
      return recentOrders.value.filter(
        (order) => order.orderStatus === "processing"
      ).length;
    });

    const fetchProfile = async () => {
      try {
        const response = await axios.get("/api/auth/profile");
        user.value = response.data;
        if (user.value.role !== "admin") {
          router.push("/books");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        router.push("/login");
      }
    };

    const fetchRecentOrders = async () => {
      try {
        const response = await axios.get("/api/orders");
        recentOrders.value = response.data;
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    const updateOrderStatus = async (orderId, status) => {
      try {
        await axios.patch(`/api/orders/${orderId}/status`, { status });
        await fetchRecentOrders();
      } catch (error) {
        console.error("Error updating order status:", error);
      }
    };

    const handleLogout = async () => {
      try {
        await axios.post("/api/auth/logout");
        localStorage.removeItem("token");
        router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
      }
    };

    const formatDate = (timestamp) => {
      if (!timestamp) return "Invalid Date";
      return new Date(timestamp).toLocaleDateString("en-US", {
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
      updateOrderStatus,
      getPendingOrdersCount,
      getProcessingOrdersCount,
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

.user-role {
  background: #3498db;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  text-transform: uppercase;
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
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.action-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.order-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 1rem;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  color: #666;
  font-size: 0.875rem;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.recent-activity {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.activity-item {
  padding: 1rem;
  border-bottom: 1px solid #e0e4e8;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.order-info {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.status-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.order-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
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

@media (max-width: 768px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }

  .user-info {
    flex-direction: column;
    align-items: flex-end;
  }
}
</style>
