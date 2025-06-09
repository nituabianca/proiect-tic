import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import axios from "axios";
import store from "@/store"; // Assuming your Vuex store is correctly imported
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faPlus,
  faEye,
  faPen,
  faTrash,
  faX,
  faShoppingCart,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

library.add(
  faPlus,
  faEye,
  faPen,
  faTrash,
  faX,
  faShoppingCart,
  faChevronLeft,
  faChevronRight
);

axios.defaults.baseURL = process.env.VUE_APP_API_URL || "http://localhost:3000";
axios.defaults.withCredentials = true;

// --- IMPORTANT: Dispatch initializeAuth before configuring interceptor and mounting ---
// This ensures the initial state (token from localStorage) is loaded into Vuex
// before any requests are made, and before the interceptor might try to use it.
store.dispatch("auth/initializeAuth").catch(console.error); // 'auth' is your namespaced module

// Initialize store for cart (ensure this is in correct order if it depends on auth)
store.dispatch("cart/initialize").catch(console.error);

const app = createApp(App);

// Configure axios interceptor before using the app
axios.interceptors.request.use((config) => {
  // --- CRITICAL FIX HERE: Get token from store.state.auth.token ---
  const token = store.state.auth.token; // CORRECTED PATH!
  // --- END CRITICAL FIX ---

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // console.log("Axios Interceptor: Adding Authorization header:", config.headers.Authorization); // For debugging
  } else {
    // console.log("Axios Interceptor: No token found for Authorization header."); // For debugging
  }
  return config;
});

// Use plugins
app.use(store);
app.use(router);

// Mount the app
app.mount("#app");
