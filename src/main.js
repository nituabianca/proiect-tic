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
} from "@fortawesome/free-solid-svg-icons";

library.add(faPlus, faEye, faPen, faTrash, faX);

console.log("API URL:", process.env.VUE_APP_API_URL);

axios.defaults.baseURL = process.env.VUE_APP_API_URL || "http://localhost:3000";
axios.defaults.withCredentials = true;

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

app.mount("#app");

console.log("API URL:", process.env.VUE_APP_API_URL);
