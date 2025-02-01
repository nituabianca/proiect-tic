import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "@/views/LoginPage.vue";
import RegisterPage from "@/views/RegisterPage.vue";
import VerifyEmailPage from "@/views/VerifyEmailPage.vue";
import BooksPage from "@/views/BookPage.vue";
import DashboardPage from "@/views/DashboardPage.vue";
import ManageBooksPage from "@/views/ManageBooksPage.vue";
import axios from "axios";

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
    path: "/books/manage",
    name: "ManageBooks",
    component: ManageBooksPage,
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

router.beforeEach((to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!localStorage.getItem("token")) {
      next("/login");
      return;
    }
  }
  next();
});

export default router;
