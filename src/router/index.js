// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "@/views/LoginPage.vue";
import RegisterPage from "@/views/RegisterPage.vue";
import BooksPage from "@/views/BookPage.vue";
import DashboardPage from "@/views/DashboardPage.vue";
import axios from "axios";

// Middleware for authentication check
const requireAuth = async (to, from, next) => {
  try {
    await axios.get(`${process.env.VUE_APP_API_URL}/api/auth/profile`, {
      withCredentials: true,
    });
    next(); // User is authenticated
  } catch (error) {
    // Redirect to login if not authenticated
    next("/login");
  }
};

const routes = [
  {
    path: "/books",
    name: "Books",
    component: BooksPage,
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
  },
  {
    path: "/register",
    name: "Register",
    component: RegisterPage,
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: DashboardPage,
    beforeEnter: requireAuth,
  },
  {
    path: "/",
    redirect: "/dashboard",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
