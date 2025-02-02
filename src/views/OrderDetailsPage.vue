<template>
  <div class="order-details">
    <div v-if="loading" class="loading">Loading order details...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="order-container">
      <div class="order-header">
        <h2>Order #{{ order.id }}</h2>
        <div class="order-status" :class="order.status">
          {{ order.status }}
        </div>
      </div>

      <div class="order-items">
        <div v-for="item in order.items" :key="item.id" class="order-item">
          <img :src="item.cover" :alt="item.title" class="item-cover" />
          <div class="item-details">
            <h3>{{ item.title }}</h3>
            <p>{{ item.author }}</p>
            <p class="quantity">Quantity: {{ item.quantity }}</p>
          </div>
          <div class="item-price">
            ${{ (item.price * item.quantity).toFixed(2) }}
          </div>
        </div>
      </div>

      <div class="order-summary">
        <h3>Order Summary</h3>
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${{ order.total.toFixed(2) }}</span>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <div class="summary-total">
          <span>Total</span>
          <span>${{ order.total.toFixed(2) }}</span>
        </div>
      </div>

      <div class="actions">
        <router-link to="/books" class="continue-shopping"
          >Continue Shopping</router-link
        >
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";

export default {
  name: "OrderDetailsPage",
  setup() {
    const route = useRoute();
    const order = ref(null);
    const loading = ref(true);
    const error = ref(null);

    const fetchOrder = async () => {
      try {
        const response = await axios.get(`/api/orders/my/${route.params.id}`);
        order.value = response.data;
      } catch (err) {
        error.value = "Failed to load order details";
        console.error(err);
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchOrder);

    return {
      order,
      loading,
      error,
    };
  },
};
</script>

<style scoped>
.order-details {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.order-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.order-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
  text-transform: capitalize;
}

.order-status.pending {
  background: #ffeaa7;
  color: #d35400;
}

.order-status.processing {
  background: #81ecec;
  color: #00b894;
}

.order-status.shipped {
  background: #74b9ff;
  color: #0984e3;
}

.order-status.delivered {
  background: #55efc4;
  color: #00b894;
}

.order-items {
  margin-bottom: 2rem;
}

.order-item {
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  gap: 1rem;
}

.item-cover {
  width: 80px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
}

.item-details {
  flex-grow: 1;
}

.item-details h3 {
  margin: 0;
  color: #2c3e50;
}

.quantity {
  color: #7f8c8d;
}

.item-price {
  font-weight: bold;
  color: #2c3e50;
  align-self: center;
}

.order-summary {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin: 0.5rem 0;
}

.summary-total {
  border-top: 2px solid #dee2e6;
  margin-top: 1rem;
  padding-top: 1rem;
  font-weight: bold;
}

.actions {
  text-align: center;
}

.continue-shopping {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

.continue-shopping:hover {
  background: #2980b9;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #e74c3c;
}
</style>
