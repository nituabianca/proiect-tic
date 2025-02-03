<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Admin Dashboard</h1>
      <div v-if="user" class="user-section">
        <div class="user-info">
          <span class="user-role">{{ user.role }}</span>
          <span class="user-email">{{ user.email }}</span>
        </div>
      </div>
    </div>

    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon pending">
          <font-awesome-icon icon="clock" />
        </div>
        <div class="stat-content">
          <h3>Pending Orders</h3>
          <div class="stat-value">{{ getPendingOrdersCount }}</div>
          <div class="stat-label">Awaiting processing</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon processing">
          <font-awesome-icon icon="spinner" />
        </div>
        <div class="stat-content">
          <h3>Processing</h3>
          <div class="stat-value">{{ getProcessingOrdersCount }}</div>
          <div class="stat-label">In progress</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon total">
          <font-awesome-icon icon="dollar-sign" />
        </div>
        <div class="stat-content">
          <h3>Total Revenue</h3>
          <div class="stat-value">${{ calculateTotalRevenue.toFixed(2) }}</div>
          <div class="stat-label">All time</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orders">
          <font-awesome-icon icon="shopping-bag" />
        </div>
        <div class="stat-content">
          <h3>Total Orders</h3>
          <div class="stat-value">{{ recentOrders.length }}</div>
          <div class="stat-label">All orders</div>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="action-grid">
          <router-link to="/books/manage" class="action-card">
            <div class="action-icon">
              <font-awesome-icon icon="book" />
            </div>
            <div class="action-content">
              <h3>Manage Books</h3>
              <p>Add, edit, or remove books</p>
            </div>
          </router-link>

          <router-link to="/orders/manage" class="action-card">
            <div class="action-icon">
              <font-awesome-icon icon="shopping-cart" />
            </div>
            <div class="action-content">
              <h3>Manage Orders</h3>
              <p>View and process all orders</p>
            </div>
          </router-link>
        </div>
      </div>

      <div class="recent-orders">
        <div class="section-header">
          <h2>Recent Orders</h2>
          <router-link to="/orders/manage" class="view-all"
            >View All</router-link
          >
        </div>

        <div v-if="recentOrders.length" class="orders-list">
          <div
            v-for="order in recentOrders.slice(0, 5)"
            :key="order.id"
            class="order-item"
          >
            <div class="order-header">
              <span class="order-details">Order #{{ order.id }}</span>
              <span class="order-status" :class="order.orderStatus">
                {{ order.orderStatus }}
              </span>
            </div>
            <div class="order-info">
              <div class="info-group">
                <div class="order-date">{{ formatDate(order.createdAt) }}</div>
                <div class="order-items">{{ order.items.length }} items</div>
              </div>
              <div class="order-amount">
                ${{ calculateOrderTotal(order).toFixed(2) }}
              </div>
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
        <p v-else class="no-orders">No recent orders</p>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faClock,
  faSpinner,
  faDollarSign,
  faShoppingBag,
  faBook,
  faShoppingCart,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(
  faClock,
  faSpinner,
  faDollarSign,
  faShoppingBag,
  faBook,
  faShoppingCart
);

export default {
  name: "DashboardPage",
  components: { FontAwesomeIcon },
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

    const calculateTotalRevenue = computed(() => {
      return recentOrders.value.reduce((total, order) => {
        const orderTotal = calculateOrderTotal(order);
        return !isNaN(orderTotal) ? total + orderTotal : total;
      }, 0);
    });

    const calculateOrderTotal = (order) => {
      if (!order.items?.length) return 0;
      return order.items.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        return !isNaN(itemTotal) ? sum + itemTotal : sum;
      }, 0);
    };

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
      formatDate,
      updateOrderStatus,
      getPendingOrdersCount,
      getProcessingOrdersCount,
      calculateTotalRevenue,
      calculateOrderTotal,
    };
  },
};
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
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

.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-icon.pending {
  background: #fff3cd;
  color: #856404;
}
.stat-icon.processing {
  background: #cce5ff;
  color: #004085;
}
.stat-icon.total {
  background: #d4edda;
  color: #155724;
}
.stat-icon.orders {
  background: #f8d7da;
  color: #721c24;
}

.stat-content h3 {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 0.25rem 0;
}

.stat-label {
  font-size: 0.75rem;
  color: #666;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.action-card:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #3498db;
  opacity: 0.6;
}

.action-card:nth-child(1):before {
  background: #ff9aa2;
}

.action-card:nth-child(2):before {
  background: #ffb7b2;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
}

.action-icon {
  font-size: 1.5rem;
  color: #3498db;
  transition: transform 0.2s ease;
}

.action-card:hover .action-icon {
  transform: scale(1.1);
}

.recent-orders {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.view-all {
  color: #3498db;
  text-decoration: none;
}

.order-item {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.order-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-group {
  display: flex;
  gap: 1rem;
  color: #666;
  font-size: 0.875rem;
}

.order-amount {
  font-weight: bold;
  color: #2c3e50;
}

.status-select {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

@media (max-width: 1024px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }

  .stats-overview {
    grid-template-columns: 1fr;
  }
}
</style>
