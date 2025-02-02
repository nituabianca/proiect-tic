import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "@/views/LoginPage.vue";
import RegisterPage from "@/views/RegisterPage.vue";
import VerifyEmailPage from "@/views/VerifyEmailPage.vue";
import BooksPage from "@/views/BookPage.vue";
import DashboardPage from "@/views/DashboardPage.vue";
import ManageBooksPage from "@/views/ManageBooksPage.vue";
import axios from "axios";
import ProfilePage from "@/views/ProfilePage.vue";
import CartPage from "@/views/CartPage.vue";
import OrderDetailsPage from "@/views/OrderDetailsPage.vue";
import ManageOrdersPage from "@/views/ManageOrdersPage.vue";

const requireAuth = async (to, from, next) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      next("/login");
      return;
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    await axios.get("/api/auth/profile");
    next();
  } catch (error) {
    console.error("Auth check failed:", error);
    localStorage.removeItem("token");
    next("/login");
  }
};

const requireAdmin = async (to, from, next) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      next("/login");
      return;
    }

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    const response = await axios.get("/api/auth/profile");

    if (response.data.role === "admin") {
      next();
    } else {
      next("/books");
    }
  } catch (error) {
    console.error("Admin check failed:", error);
    next("/books");
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
    beforeEnter: requireAdmin,
  },
  {
    path: "/books/manage",
    name: "ManageBooks",
    component: ManageBooksPage,
    beforeEnter: requireAdmin,
  },
  {
    path: "/profile",
    name: "Profile",
    component: ProfilePage,
    beforeEnter: requireAuth,
  },
  {
    path: "/cart",
    name: "Cart",
    component: CartPage,
    beforeEnter: requireAuth,
  },
  {
    path: "/orders/:id",
    name: "OrderDetails",
    component: OrderDetailsPage,
    beforeEnter: requireAuth,
  },
  {
    path: "/orders/manage",
    name: "ManageOrders",
    component: ManageOrdersPage,
    beforeEnter: requireAdmin,
  },
  {
    path: "/",
    redirect: "/books",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
