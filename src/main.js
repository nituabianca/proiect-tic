import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import axios from "axios";

// Log the API URL
console.log("API URL:", process.env.VUE_APP_API_URL);

// Configure axios defaults
axios.defaults.baseURL = process.env.VUE_APP_API_URL || "http://localhost:3000";
axios.defaults.withCredentials = true;

// Create the Vue app
const app = createApp(App);

// Use router
app.use(router);

// Mount the app
app.mount("#app");

console.log("API URL:", process.env.VUE_APP_API_URL);
