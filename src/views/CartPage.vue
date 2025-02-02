<template>
  <div class="cart-container">
    <h2 class="cart-title">Shopping Cart</h2>

    <div v-if="!items.length" class="empty-cart">
      <p>Your cart is empty</p>
      <router-link to="/books" class="continue-shopping"
        >Continue Shopping</router-link
      >
    </div>

    <div v-else class="cart-content">
      <div class="cart-items">
        <div v-for="item in items" :key="item.id" class="cart-item">
          <div class="item-details">
            <img :src="item.cover" :alt="item.title" class="item-cover" />
            <div class="item-info">
              <h3>{{ item.title }}</h3>
              <p>{{ item.author }}</p>
            </div>
          </div>

          <div class="item-actions">
            <div class="quantity-controls">
              <button
                @click="updateQuantity(item.id, item.quantity - 1)"
                :disabled="item.quantity <= 1"
              >
                -
              </button>
              <span>{{ item.quantity }}</span>
              <button
                @click="updateQuantity(item.id, item.quantity + 1)"
                :disabled="item.quantity >= item.stock?.quantity"
              >
                +
              </button>
            </div>

            <div class="item-price">
              ${{ (item.price * item.quantity).toFixed(2) }}
            </div>

            <button @click="removeItem(item.id)" class="remove-btn">
              <font-awesome-icon icon="trash" />
            </button>
          </div>
        </div>
      </div>

      <div class="cart-summary">
        <h3>Order Summary</h3>
        <div class="summary-row">
          <span>Items ({{ itemCount }})</span>
          <span>{{ itemCount }}</span>
        </div>
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${{ cartTotal.toFixed(2) }}</span>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <div class="summary-total">
          <span>Total</span>
          <span>${{ cartTotal.toFixed(2) }}</span>
        </div>

        <button @click="checkout" class="checkout-btn" :disabled="loading">
          {{ loading ? "Processing..." : "Proceed to Checkout" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export default {
  name: "CartPage",
  components: {
    FontAwesomeIcon,
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    const items = computed(() => store.state.cart.items);
    const loading = computed(() => store.state.cart.loading);
    const cartTotal = computed(() => store.getters["cart/cartTotal"]);
    const itemCount = computed(() => store.getters["cart/itemCount"]);

    const updateQuantity = (id, quantity) => {
      if (quantity > 0) {
        store.dispatch("cart/updateQuantity", { id, quantity });
      }
    };

    const removeItem = (id) => {
      store.dispatch("cart/removeFromCart", id);
    };

    const checkout = async () => {
      try {
        const order = await store.dispatch("cart/checkout");
        router.push(`/orders/${order.id}`);
      } catch (error) {
        console.error("Checkout failed:", error);
      }
    };

    return {
      items,
      loading,
      cartTotal,
      itemCount,
      updateQuantity,
      removeItem,
      checkout,
    };
  },
};
</script>

<style scoped>
.cart-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.cart-title {
  margin-bottom: 2rem;
  color: #2c3e50;
}

.cart-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.cart-items {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cart-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.item-details {
  display: flex;
  gap: 1rem;
}

.item-cover {
  width: 80px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
}

.item-info h3 {
  margin: 0;
  color: #2c3e50;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-controls button {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.quantity-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cart-summary {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin: 1rem 0;
  color: #666;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #eee;
  font-weight: bold;
  color: #2c3e50;
}

.checkout-btn {
  width: 100%;
  padding: 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 1rem;
}

.checkout-btn:hover {
  background: #2980b9;
}

.checkout-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.remove-btn {
  color: #e74c3c;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.remove-btn:hover {
  color: #c0392b;
}

.empty-cart {
  text-align: center;
  padding: 3rem;
}

.continue-shopping {
  display: inline-block;
  margin-top: 1rem;
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

@media (max-width: 768px) {
  .cart-content {
    grid-template-columns: 1fr;
  }

  .cart-container {
    padding: 1rem;
  }

  .item-actions {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
