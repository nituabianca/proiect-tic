// router/index.js (Full updated file)
import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "@/views/LoginPage.vue";
import RegisterPage from "@/views/RegisterPage.vue";
import VerifyEmailPage from "@/views/VerifyEmailPage.vue";
import BooksPage from "@/views/BookPage.vue";
import DashboardPage from "@/views/DashboardPage.vue";
import ManageBooksPage from "@/views/ManageBooksPage.vue";
import ProfilePage from "@/views/ProfilePage.vue";
import CartPage from "@/views/CartPage.vue";
import OrderDetailsPage from "@/views/OrderDetailsPage.vue";
import ManageOrdersPage from "@/views/ManageOrdersPage.vue";

import store from "@/store"; // Make sure this path is correct

const routes = [
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { requiresAuth: false },
  },
  {
    path: "/register",
    name: "Register",
    component: RegisterPage,
    meta: { requiresAuth: false },
  },

  {
    path: "/books",
    name: "Books",
    component: BooksPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: DashboardPage,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/books/manage",
    name: "ManageBooks",
    component: ManageBooksPage,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/profile",
    name: "Profile",
    component: ProfilePage,
    meta: { requiresAuth: true },
  },
  {
    path: "/cart",
    name: "Cart",
    component: CartPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/orders/:id",
    name: "OrderDetails",
    component: OrderDetailsPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/orders/manage",
    name: "ManageOrders",
    component: ManageOrdersPage,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/",
    name: "Home",
    component: LandingPage,
    meta:{requiresAuth: false},
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    redirect: "/",
  },
  
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// --- GLOBAL NAVIGATION GUARD ---
router.beforeEach(async (to, from, next) => {
  const isAuthenticated = store.getters["auth/isAuthenticated"];
  const requiresAuth = to.meta.requiresAuth;
  const requiresAdmin = to.meta.requiresAdmin;

  const publicPaths = ["/login", "/register", "/verify-email", "/books"];

  // Always attempt to fetch profile if authenticated but user data isn't in store
  // This helps ensure the role is up-to-date in Vuex for navigation guards and components
  if (isAuthenticated && !store.getters["auth/getUser"]) {
    try {
      await store.dispatch("auth/fetchUserProfile");
      console.log("Router: User profile fetched and updated in store.");
    } catch (error) {
      console.error("Router: Failed to re-fetch user profile.", error);
      // If fetching profile fails (e.g., token expired, invalid), assume not authenticated
      // and perform a logout to clear stale token.
      await store.dispatch("auth/logout");
      return next("/login");
    }
  }

  // 1. If trying to access a protected route AND not authenticated
  if (requiresAuth && !isAuthenticated) {
    console.log(
      `Router: Redirecting to login. Target: ${to.path}, Auth: ${isAuthenticated}`
    );
    return next("/login");
  }

  // 2. If authenticated AND trying to access login/register
  if (
    isAuthenticated &&
    publicPaths.includes(to.path) &&
    to.path !== "/books" // Allow logged in users to browse books
  ) {
    console.log(
      `Router: Redirecting logged-in user from public page. Target: ${to.path}`
    );
    // If logged in, send them to dashboard by default, unless they're explicitly going to /books
    return next("/dashboard");
  }

  // 3. If authenticated AND route requires admin role
  if (isAuthenticated && requiresAdmin) {
    const isAdmin = store.getters["auth/isAdmin"]; // Get role from Vuex getter

    if (!isAdmin) {
      console.log(
        `Router: Access denied. User is not admin, but ${to.path} requires admin.`
      );
      return next("/books"); // Redirect non-admins
    }
  }

  // If none of the above conditions, allow navigation
  next();
});

export default router;
