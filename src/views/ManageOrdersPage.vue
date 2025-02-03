<template>
  <div class="manage-orders">
    <div class="page-header">
      <h1>Manage Orders</h1>
      <div class="filters">
        <select v-model="statusFilter" class="filter-select">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search orders..."
            class="search-input"
          />
        </div>
      </div>
    </div>

    <div class="orders-table">
      <div class="table-header">
        <div class="table-actions">
          <button @click="fetchOrders" class="refresh-btn">
            <font-awesome-icon icon="sync" />
            Refresh
          </button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id">
            <td>{{ order.id }}</td>
            <td>{{ order.email }}</td>
            <td>{{ order.items.length }} items</td>
            <td>${{ calculateOrderTotal(order).toFixed(2) }}</td>
            <td>{{ formatDate(order.createdAt) }}</td>
            <td>
              <select
                v-model="order.orderStatus"
                @change="updateOrderStatus(order.id, $event.target.value)"
                :class="['status-select', order.orderStatus]"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  @click="viewOrderDetails(order.id)"
                  class="action-btn view-btn"
                >
                  <font-awesome-icon icon="eye" />
                </button>
                <button
                  @click="confirmDelete(order)"
                  class="action-btn delete-btn"
                >
                  <font-awesome-icon icon="trash" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">
        Previous
      </button>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        @click="nextPage"
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        Next
      </button>
    </div>
  </div>
  <div v-if="showDeleteModal" class="modal-overlay">
    <div class="delete-modal-content">
      <h3>Delete Order</h3>
      <p>Are you sure you want to delete order #{{ orderToDelete?.id }}?</p>
      <div class="delete-modal-actions">
        <button @click="closeModal" class="cancel-btn">Cancel</button>
        <button @click="deleteOrder" class="confirm-btn">Delete</button>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useToast } from "@/composables/useToast";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default {
  name: "ManageOrdersPage",
  components: { FontAwesomeIcon },
  setup() {
    const { showToast } = useToast();
    const router = useRouter();
    const orders = ref([]);
    const statusFilter = ref("");
    const searchQuery = ref("");
    const currentPage = ref(1);
    const itemsPerPage = 10;
    const showDeleteModal = ref(false);
    const orderToDelete = ref(null);

    const filteredOrders = computed(() => {
      let filtered = orders.value;

      if (statusFilter.value) {
        filtered = filtered.filter(
          (order) => order.orderStatus === statusFilter.value
        );
      }

      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(
          (order) =>
            order.id.toLowerCase().includes(query) ||
            order.email?.toLowerCase().includes(query)
        );
      }

      // Pagination
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filtered.slice(start, end);
    });

    const totalPages = computed(() =>
      Math.ceil(orders.value.length / itemsPerPage)
    );

    const fetchOrders = async () => {
      try {
        const response = await axios.get("/api/orders");
        orders.value = response.data;
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    const updateOrderStatus = async (orderId, status) => {
      try {
        await axios.patch(`/api/orders/${orderId}/status`, { status });
      } catch (error) {
        console.error("Error updating order status:", error);
      }
    };

    const calculateOrderTotal = (order) => {
      return order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    };

    const viewOrderDetails = (orderId) => {
      router.push(`/orders/${orderId}`);
    };

    const confirmDelete = (order) => {
      orderToDelete.value = order;
      showDeleteModal.value = true;
    };

    const closeModal = () => {
      showDeleteModal.value = false;
      orderToDelete.value = null;
    };

    const deleteOrder = async () => {
      if (!orderToDelete.value) return;

      try {
        await axios.delete(`/api/orders/${orderToDelete.value.id}`);
        await fetchOrders(); // Refresh data
        showToast("Order deleted successfully", "success");
        closeModal();
      } catch (error) {
        console.error("Error deleting order:", error);
        showToast("Error deleting order", "error");
      }
    };

    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleDateString();
    };

    const prevPage = () => {
      if (currentPage.value > 1) currentPage.value--;
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) currentPage.value++;
    };

    onMounted(fetchOrders);

    return {
      orders,
      statusFilter,
      searchQuery,
      currentPage,
      totalPages,
      filteredOrders,
      calculateOrderTotal,
      updateOrderStatus,
      viewOrderDetails,
      showDeleteModal,
      confirmDelete,
      closeModal,
      deleteOrder,
      formatDate,
      prevPage,
      nextPage,
    };
  },
};
</script>

<style scoped>
.manage-orders {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.filters {
  display: flex;
  gap: 1rem;
}

.filter-select,
.search-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

.orders-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-actions {
  margin-bottom: 1rem;
}

.refresh-btn {
  padding: 0.5rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: #2980b9;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
}

.status-select {
  padding: 0.35rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.status-select.pending {
  background: #fff3cd;
  color: #856404;
}
.status-select.processing {
  background: #cce5ff;
  color: #004085;
}
.status-select.shipped {
  background: #d4edda;
  color: #155724;
}
.status-select.delivered {
  background: #d1e7dd;
  color: #0f5132;
}
.status-select.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn {
  background: #3498db;
  color: white;
}

.view-btn:hover {
  background: #2980b9;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background: #c0392b;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-overlay {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.delete-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-btn,
.confirm-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}

.confirm-btn {
  background: #e74c3c;
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #3498db;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #2980b9;
}

.page-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.page-info {
  color: #666;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .filters {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .orders-table {
    overflow-x: auto;
  }

  th,
  td {
    min-width: 120px;
  }
}
</style>
