import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import axios from "axios";
import store from "@/store";
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

// Initialize store first
store.dispatch("cart/initialize").catch(console.error);

const app = createApp(App);

// Configure axios interceptor before using the app
axios.interceptors.request.use((config) => {
  const token = store.state.auth.user?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Use plugins
app.use(store);
app.use(router);

// Mount the app
app.mount("#app");
