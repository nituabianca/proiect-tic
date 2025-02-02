import axios from "axios";

const state = {
  items: [],
  loading: false,
  error: null,
};

const mutations = {
  ADD_TO_CART(state, item) {
    const existing = state.items.find((i) => i.id === item.id);
    if (existing) {
      existing.quantity++;
    } else {
      state.items.push({ ...item, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(state.items));
  },

  REMOVE_FROM_CART(state, id) {
    state.items = state.items.filter((item) => item.id !== id);
    localStorage.setItem("cart", JSON.stringify(state.items));
  },

  UPDATE_QUANTITY(state, { id, quantity }) {
    const item = state.items.find((i) => i.id === id);
    if (item) {
      item.quantity = quantity;
      localStorage.setItem("cart", JSON.stringify(state.items));
    }
  },

  CLEAR_CART(state) {
    state.items = [];
    localStorage.removeItem("cart");
  },

  SET_LOADING(state, status) {
    state.loading = status;
  },

  SET_ERROR(state, error) {
    state.error = error;
  },
};

const actions = {
  initialize({ commit }) {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        items.forEach((item) => commit("ADD_TO_CART", item));
      } catch (error) {
        console.error("Failed to load cart:", error);
        localStorage.removeItem("cart");
      }
    }
  },

  addToCart({ commit }, item) {
    commit("ADD_TO_CART", item);
  },

  removeFromCart({ commit }, id) {
    commit("REMOVE_FROM_CART", id);
  },

  updateQuantity({ commit }, payload) {
    commit("UPDATE_QUANTITY", payload);
  },

  async checkout({ commit, state }) {
    commit("SET_LOADING", true);
    try {
      const orderData = {
        items: state.items.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          author: item.author,
          cover: item.cover,
        })),
        total: state.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
        orderStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = await axios.post("/api/orders", orderData);
      commit("CLEAR_CART");
      return response.data;
    } catch (error) {
      commit("SET_ERROR", error.message);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },
};

const getters = {
  cartTotal: (state) =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  itemCount: (state) => state.items.length,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
