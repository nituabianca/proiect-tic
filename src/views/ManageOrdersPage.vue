<template>
  <div class="manage-orders">
    <div class="page-header">
      <h1>Manage Orders</h1>
      <div class="filters">
        <select v-model="filters.status" @change="loadOrders(true)" class="filter-select">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <form @submit.prevent="loadOrders(true)" class="search-box">
          <input type="text" v-model="filters.searchQuery" placeholder="Search by Customer Email..." class="search-input" />
          <button type="submit" class="search-btn">Search</button>
        </form>
      </div>
    </div>

    <div class="orders-table">
      <div v-if="loading" class="loading-overlay"><span>Loading...</span></div>
      <table>
        <thead>
        <tr>
          <th>Order ID</th>
          <th>Customer Email</th>
          <th>Items</th>
          <th>Total</th>
          <th>Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="order in orders" :key="order.id">
          <td>#{{ order.id.slice(-6).toUpperCase() }}</td>
          <td>{{ order.userEmail }}</td>
          <td>{{ order.items.length }}</td>
          <td>${{ (order.totalAmount || 0).toFixed(2) }}</td>
          <td>{{ formatDate(order.createdAt) }}</td>
          <td>
            <select v-model="order.status" @change="updateOrderStatus(order.id, $event.target.value)" :class="['status-select', order.status]">
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </td>
          <td>
            <div class="action-buttons">
              <button @click="viewOrderDetails(order.id)" class="action-btn view-btn" title="View Details"><font-awesome-icon icon="eye" /></button>
              <button @click="confirmDelete(order)" class="action-btn delete-btn" title="Delete Order"><font-awesome-icon icon="trash" /></button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
      <p v-if="!loading && orders.length === 0" class="no-results">No orders found for the current filters.</p>
    </div>

    <div class="pagination-controls">
      <button @click="changePage('prev')" :disabled="currentPage === 1" class="page-btn">Previous</button>
      <span class="page-info">Page {{ currentPage }}</span>
      <button @click="changePage('next')" :disabled="!hasNextPage" class="page-btn">Next</button>
    </div>
  </div>

  <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeModal">
    <div class="delete-modal-content">
      <h3>Delete Order</h3>
      <p>Are you sure you want to delete order #{{ orderToDelete?.id.slice(-6).toUpperCase() }}?</p>
      <div class="delete-modal-actions">
        <button @click="closeModal" class="cancel-btn">Cancel</button>
        <button @click="deleteOrder" class="confirm-btn">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useToast } from "@/composables/useToast";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from "@fortawesome/fontawesome-svg-core";
import { faEye, faTrash, faSync } from "@fortawesome/free-solid-svg-icons";

library.add(faEye, faTrash, faSync);

const { showToast } = useToast();
const router = useRouter();
const orders = ref([]);
const loading = ref(false);

const filters = ref({
  status: "",
  searchQuery: "",
});

const currentPage = ref(1);
const cursorHistory = ref([null]); // [null] is the cursor for page 1
const hasNextPage = ref(false);

const loadOrders = async (isNewSearch = false) => {
  loading.value = true;
  if (isNewSearch) {
    currentPage.value = 1;
    cursorHistory.value = [null];
  }

  const cursor = cursorHistory.value[currentPage.value - 1];

  try {
    const params = new URLSearchParams({ limit: 10 });
    if (filters.value.status) params.append('status', filters.value.status);
    if (filters.value.searchQuery) params.append('searchQuery', filters.value.searchQuery);
    if (cursor) params.append('nextCursor', cursor);

    const response = await axios.get(`/api/orders?${params.toString()}`);
    const { orders: newOrders, nextCursor } = response.data;

    orders.value = newOrders;
    hasNextPage.value = !!nextCursor;

    if (nextCursor && cursorHistory.value.length === currentPage.value) {
      cursorHistory.value.push(nextCursor);
    }
  } catch (error) {
    showToast("Error fetching orders", "error");
  } finally {
    loading.value = false;
  }
};

const changePage = (direction) => {
  if (direction === 'next' && hasNextPage.value) {
    currentPage.value++;
    loadOrders();
  } else if (direction === 'prev' && currentPage.value > 1) {
    currentPage.value--;
    loadOrders();
  }
}

const updateOrderStatus = async (orderId, status) => {
  try {
    // THE FIX: The method must be PUT and the URL must include '/status'
    await axios.put(`/api/orders/${orderId}/status`, { status });
    showToast("Order status updated successfully", "success");
    // No need to reload the whole page, we can just update the local data
    const orderInList = orders.value.find(o => o.id === orderId);
    if (orderInList) {
      orderInList.status = status;
    }
  } catch (error) {
    showToast("Error updating order status", "error");
  }
};

const viewOrderDetails = (orderId) => {
  router.push(`/orders/${orderId}`);
};

const showDeleteModal = ref(false);
const orderToDelete = ref(null);

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
    showToast("Order deleted successfully", "success");
    loadOrders(true); // Refresh data
    closeModal();
  } catch (error) {
    showToast("Error deleting order", "error");
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
  loadOrders(true);
});

</script>

<style scoped>
.manage-orders { padding: 2rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.filters { display: flex; gap: 1rem; }
.search-box { display: flex; gap: 0.5rem; }
.search-btn { background-color: #3498db; color: white; border: none; padding: 0 1rem; border-radius: 6px; cursor: pointer; }
.orders-table { position: relative; min-height: 200px; /* To show loading spinner */ }
.loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; z-index: 10; }
.pagination-controls { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem; }


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

.page-btn { padding: 0.5rem 1rem; border: none; border-radius: 4px; background: #3498db; color: white; cursor: pointer; transition: background-color 0.2s ease; }
.page-btn:hover:not(:disabled) { background: #2980b9; }
.page-btn:disabled { background: #95a5a6; cursor: not-allowed; }
.page-info { color: #666; font-weight: 500; }

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
