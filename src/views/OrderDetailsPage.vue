<template>
  <div class="order-details-page">
    <div v-if="loading" class="loading-container">Loading order details...</div>
    <div v-else-if="error" class="error-container">{{ error }}</div>

    <div v-else-if="order" class="order-container">
      <div class="order-header">
        <h2>Order Details</h2>
        <p>Order #{{ order.id }}</p>
        <div class="order-status" :class="order.status">
          Status: {{ order.status }}
        </div>
      </div>

      <div class="order-summary">
        <h3>Items Ordered</h3>
        <div v-for="item in order.items" :key="item.bookId" class="order-item">
          <div class="item-info">
            <span class="item-quantity">{{ item.quantity }}x</span>
            <span class="item-title">{{ item.title }}</span>
          </div>
          <div class="item-price">
            ${{ (item.priceAtPurchase * item.quantity).toFixed(2) }}
          </div>
        </div>
      </div>

      <div class="order-totals">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${{ (order.totalAmount || 0).toFixed(2) }}</span>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <div class="summary-total">
          <span>Total Paid</span>
          <span>${{ (order.totalAmount || 0).toFixed(2) }}</span>
        </div>
      </div>

      <div class="actions">
        <router-link to="/books" class="continue-shopping">
          <font-awesome-icon icon="arrow-left" /> Back to Books
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable */
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

library.add(faArrowLeft);

const route = useRoute();
const order = ref(null);
const loading = ref(true);
const error = ref(null);

const fetchOrder = async () => {
  loading.value = true;
  error.value = null;
  try {
    // This API call is now correct.
    const response = await axios.get(`/api/orders/${route.params.id}`);
    order.value = response.data;
  } catch (err) {
    error.value = "Failed to load order details or you do not have permission to view it.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchOrder);
</script>

<style scoped>
/* Styles for a beautiful Order Details Page */
.order-details-page { max-width: 800px; margin: 2rem auto; padding: 2rem; font-family: "Segoe UI", sans-serif; }
.order-container { background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 2.5rem; }
.order-header { text-align: center; margin-bottom: 2.5rem; }
.order-header h2 { font-size: 2.2rem; color: #2c3e50; margin: 0; }
.order-header p { color: #7f8c8d; }
.order-status { display: inline-block; margin-top: 1rem; padding: 0.5rem 1.5rem; border-radius: 20px; font-weight: 500; text-transform: capitalize; }
.order-status.pending { background: #fff3cd; color: #856404; }
.order-status.delivered { background: #d1e7dd; color: #0f5132; }
/* ... other status styles */

.order-summary, .order-totals { margin-bottom: 2rem; }
.order-summary h3, .order-totals h3 { font-size: 1.5rem; color: #34495e; padding-bottom: 1rem; border-bottom: 1px solid #eee; margin-bottom: 1rem; }

.order-item { display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px dashed #e0e0e0; align-items: center; }
.item-info { display: flex; align-items: center; gap: 1rem; }
.item-quantity { background-color: #ecf0f1; color: #7f8c8d; font-weight: bold; border-radius: 4px; padding: 0.2rem 0.6rem; font-size: 0.9rem; }
.item-title { font-weight: 500; }
.item-price { font-weight: 600; }

.summary-row, .summary-total { display: flex; justify-content: space-between; margin: 0.8rem 0; }
.summary-total { border-top: 2px solid #dee2e6; margin-top: 1rem; padding-top: 1rem; font-weight: bold; font-size: 1.2rem; }

.actions { text-align: center; margin-top: 2rem; }
.continue-shopping { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #3498db; color: white; text-decoration: none; border-radius: 6px; transition: background-color 0.3s ease; }
.continue-shopping:hover { background: #2980b9; }

.loading-container, .error-container { text-align: center; padding: 3rem; font-size: 1.2rem; color: #666; }
.error-container { color: #e74c3c; }
</style>
