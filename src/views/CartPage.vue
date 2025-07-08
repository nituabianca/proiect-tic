<template>
  <div class="cart-page-container">
    <div class="page-header">
      <h2 class="cart-title">Your Shopping Cart</h2>
      <p>Review your items before proceeding to checkout.</p>
    </div>

    <div v-if="!items.length" class="empty-cart-section">
      <div class="empty-cart-content">
        <font-awesome-icon icon="shopping-cart" class="empty-cart-icon" />
        <p>Your cart is looking a little empty!</p>
        <router-link to="/books" class="continue-shopping-btn">Start Shopping</router-link>
      </div>
    </div>

    <div v-else class="cart-content-grid">
      <div class="cart-items-section">
        <h3>Items in Cart ({{ itemCount }})</h3>
        <div class="cart-items-list">
          <div v-for="item in items" :key="item.id" class="cart-item-card">
            <div class="item-main-info">
              <img
                :src="`https://picsum.photos/seed/${item.id}/150/200`"
                :alt="item.title"
                class="book-cover-small"
              />
              <div class="item-details">
                <h4 class="item-title">{{ item.title }}</h4>
                <p class="item-author">{{ item.author }}</p>
                <span class="item-price-unit">${{ (item.price || 0).toFixed(2) }} / item</span>
              </div>
            </div>
            <div class="item-controls">
              <div class="quantity-controls">
                <button @click="updateQuantity(item.id, item.quantity - 1)" :disabled="item.quantity <= 1" class="quantity-btn">-</button>
                <span class="quantity-display">{{ item.quantity }}</span>
                <button @click="updateQuantity(item.id, item.quantity + 1)" :disabled="item.quantity >= item.stock?.quantity" class="quantity-btn">+</button>
              </div>
              <div class="item-subtotal">
                Subtotal:
                <span class="price-highlight">${{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
              <button @click="removeItem(item.id)" class="remove-item-btn">
                <font-awesome-icon icon="trash-alt" /> Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="cart-summary-section">
        <h3>Order Summary</h3>
        <div class="summary-details">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>${{ cartTotal.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>Shipping</span>
            <span class="shipping-info">Free</span>
          </div>
          <div class="summary-total">
            <span>Total</span>
            <span class="price-highlight large-total">${{ cartTotal.toFixed(2) }}</span>
          </div>
        </div>
        <button @click="checkout" class="checkout-btn" :disabled="loading || !items.length">
          {{ loading ? "Processing..." : "Proceed to Checkout" }}
          <font-awesome-icon v-if="!loading" icon="arrow-right" class="btn-icon"/>
          <font-awesome-icon v-else icon="spinner" spin class="btn-icon" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { useToast } from "@/composables/useToast";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faShoppingCart, faArrowRight, faSpinner, faTrashAlt } from "@fortawesome/free-solid-svg-icons";

// All imports and variables are automatically available to the template
library.add(faShoppingCart, faArrowRight, faSpinner, faTrashAlt);

const store = useStore();
const router = useRouter();
const { showToast } = useToast();

const items = computed(() => store.getters["cart/cartItems"]);
const loading = computed(() => store.state.cart.loading);
const cartTotal = computed(() => store.getters["cart/cartTotal"]);
const itemCount = computed(() => store.getters["cart/itemCount"]);

const updateQuantity = (id, quantity) => {
  if (quantity >= 1) {
    store.dispatch("cart/updateQuantity", { id, quantity });
  }
};

const removeItem = (id) => {
  store.dispatch("cart/removeFromCart", id);
  showToast("Item removed from cart", "info");
};

const checkout = async () => {
  try {
    const newOrder = await store.dispatch("cart/checkout");
    if (newOrder && newOrder.id) {
      showToast("Checkout successful! Redirecting...", "success");
      router.push(`/orders/${newOrder.id}`);
    } else {
      // Handle case where checkout action doesn't return a valid order
      showToast("There was an issue creating your order. Please try again.", "error");
    }
  } catch (error) {
    showToast(error.message || "Checkout failed. Please try again.", "error");
    console.error("Checkout failed:", error);
  }
};

const handleImageError = (event) => {
  event.target.src = "https://via.placeholder.com/100x150?text=No+Cover";
};
</script>


<style scoped>
/* Base styles for the cart container */
.cart-page-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f8f9fa; /* Light background for the page */
  min-height: calc(
    100vh - 60px
  ); /* Adjust based on your header/footer height */
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

/* Page Header for Cart */
.page-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 1.5rem 0;
  background: linear-gradient(
    to right,
    #a1c4fd,
    #c2e9fb
  ); /* Softer blue gradient */
  color: #2c3e50; /* Darker text for contrast */
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.cart-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.page-header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

/* Empty Cart Section */
.empty-cart-section {
  text-align: center;
  padding: 4rem 2rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px; /* Ensure it takes up some space */
}

.empty-cart-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.empty-cart-icon {
  font-size: 4rem;
  color: #95a5a6; /* Muted grey */
  margin-bottom: 1rem;
}

.empty-cart-section p {
  font-size: 1.2rem;
  color: #555;
  margin-bottom: 1.5rem;
}

.continue-shopping-btn {
  display: inline-block;
  padding: 0.8rem 2rem;
  background-color: #3498db; /* Primary blue */
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.continue-shopping-btn:hover {
  background-color: #2980b9; /* Darker blue on hover */
  transform: translateY(-2px);
}

/* Cart Content Grid Layout */
.cart-content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr; /* Main items column and summary column */
  gap: 2.5rem; /* Increased gap */
}

/* Cart Items Section */
.cart-items-section {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  padding: 1.5rem 2rem;
}

.cart-items-section h3 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.cart-items-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* Space between cart items */
}

.cart-item-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background-color: #fcfcfc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cart-item-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.item-main-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.item-cover {
  width: 100px; /* Slightly larger cover */
  height: 140px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #eee;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.item-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.item-author {
  font-size: 0.9rem;
  color: #777;
  font-style: italic;
}

.item-price-unit {
  font-size: 1rem;
  color: #555;
  font-weight: 500;
}

.item-controls {
  display: flex;
  flex-direction: column; /* Stack controls vertically on larger screens */
  align-items: flex-end; /* Align to the right */
  gap: 1rem;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background-color: #f0f4f7;
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  border: 1px solid #dee7ed;
}

.quantity-btn {
  background: none;
  border: none;
  color: #3498db;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0.1rem 0.3rem;
  transition: color 0.2s ease;
}

.quantity-btn:hover:enabled {
  color: #2980b9;
}

.quantity-btn:disabled {
  color: #b0c4de; /* Lighter blue for disabled */
  cursor: not-allowed;
  opacity: 0.6;
}

.quantity-display {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  min-width: 25px; /* Ensure enough space for numbers */
  text-align: center;
}

.item-subtotal {
  font-size: 1.1rem;
  color: #444;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price-highlight {
  color: #28a745; /* Green for prices */
  font-weight: 700;
}

.remove-item-btn {
  background: none;
  border: none;
  color: #e74c3c; /* Red for remove */
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: color 0.2s ease;
}

.remove-item-btn:hover {
  color: #c0392b;
}

/* Cart Summary Section */
.cart-summary-section {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  padding: 1.5rem 2rem;
  height: fit-content; /* Adjust height based on content */
  display: flex;
  flex-direction: column;
}

.cart-summary-section h3 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.summary-details {
  flex-grow: 1; /* Allows summary rows to take available space */
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 1rem;
  color: #666;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed #f0f0f0; /* Dashed separator */
}

.summary-row:last-of-type {
  border-bottom: none; /* No border for the last row */
}

.shipping-info {
  color: #28a745; /* Green for free shipping */
  font-weight: 600;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e0e0e0;
  font-weight: bold;
  color: #2c3e50;
  font-size: 1.3rem; /* Larger total font size */
}

.large-total {
  font-size: 1.6rem; /* Even larger for the total amount */
}

.checkout-btn {
  width: 100%;
  padding: 1.2rem; /* Larger padding for button */
  background: linear-gradient(to right, #28a745, #218838); /* Green gradient */
  color: white;
  border: none;
  border-radius: 10px; /* More rounded */
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 2rem; /* More space from summary */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.checkout-btn:hover:enabled {
  background: linear-gradient(to right, #218838, #1e7e34);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.checkout-btn:disabled {
  background: #95a5a6; /* Muted grey for disabled */
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  margin-left: 5px;
}

/* Media Queries for Responsiveness */
@media (max-width: 992px) {
  .cart-content-grid {
    grid-template-columns: 1fr; /* Stack columns on smaller screens */
  }

  .cart-item-card {
    flex-direction: column; /* Stack item details and controls */
    align-items: flex-start; /* Align to the left */
    gap: 1.5rem;
  }

  .item-controls {
    width: 100%; /* Take full width */
    flex-direction: row; /* Controls side-by-side */
    justify-content: space-between; /* Space out items */
    align-items: center;
  }

  .item-main-info {
    width: 100%; /* Ensure main info takes full width */
  }

  .remove-item-btn {
    margin-top: 0; /* Remove top margin from default stacking */
  }
}

@media (max-width: 576px) {
  .cart-page-container {
    padding: 1rem;
  }
  .page-header {
    margin-bottom: 2rem;
    padding: 1rem 0;
  }
  .cart-title {
    font-size: 2rem;
  }
  .page-header p {
    font-size: 0.9rem;
  }
  .empty-cart-section {
    padding: 2rem 1rem;
  }
  .empty-cart-icon {
    font-size: 3rem;
  }
  .empty-cart-section p {
    font-size: 1rem;
  }
  .continue-shopping-btn {
    padding: 0.6rem 1.5rem;
    font-size: 0.9rem;
  }

  .cart-items-section,
  .cart-summary-section {
    padding: 1rem 1.2rem;
  }
  .cart-items-section h3,
  .cart-summary-section h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    padding-bottom: 0.8rem;
  }

  .item-main-info {
    flex-direction: column; /* Stack image and details on very small screens */
    align-items: center;
    text-align: center;
  }
  .item-cover {
    width: 80px;
    height: 120px;
  }
  .item-controls {
    flex-direction: column; /* Stack controls again on very small screens */
    align-items: center;
    gap: 0.8rem;
  }
  .quantity-controls {
    width: 100%;
    justify-content: center;
  }
  .item-subtotal {
    width: 100%;
    justify-content: center;
  }
  .remove-item-btn {
    width: 100%;
    justify-content: center;
  }
  .checkout-btn {
    font-size: 1rem;
    padding: 1rem;
  }
  .summary-total {
    font-size: 1.1rem;
  }
  .large-total {
    font-size: 1.3rem;
  }
}
</style>
