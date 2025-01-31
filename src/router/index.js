import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "@/views/LoginPage.vue";
import RegisterPage from "@/views/RegisterPage.vue";
import VerifyEmailPage from "@/views/VerifyEmailPage.vue";
import BooksPage from "@/views/BookPage.vue";
import DashboardPage from "@/views/DashboardPage.vue";
import axios from "axios";

// Auth guard middleware
const requireAuth = async (to, from, next) => {
  try {
    // Check if there's a token in localStorage
    const token = localStorage.getItem("token");

    if (!token) {
      next("/login");
      return;
    }

    // Set token in axios headers
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Verify token by making a request to get user profile
    await axios.get("/api/auth/profile");

    // If we get here, the token is valid
    next();
  } catch (error) {
    console.error("Auth check failed:", error);
    // If token is invalid or expired, redirect to login
    localStorage.removeItem("token");
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
    path: "/verify-email",
    name: "VerifyEmail",
    component: VerifyEmailPage,
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

// Global navigation guard (optional)
router.beforeEach((to, from, next) => {
  // If route requires auth and user isn't authenticated
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!localStorage.getItem("token")) {
      next("/login");
      return;
    }
  }
  next();
});

export default router;
