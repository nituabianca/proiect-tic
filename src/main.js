import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import axios from "axios";
import store from "@/store";

// Log the API URL
console.log("API URL:", process.env.VUE_APP_API_URL);

// Configure axios defaults
axios.defaults.baseURL = process.env.VUE_APP_API_URL || "http://localhost:3000";
axios.defaults.withCredentials = true;

// Create the Vue app
const app = createApp(App);

app.use(router);
app.use(store);

axios.interceptors.request.use((config) => {
  const token = store.state.auth.user?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mount the app
app.mount("#app");

console.log("API URL:", process.env.VUE_APP_API_URL);
