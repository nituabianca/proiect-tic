<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <img src="../assets/logo2.png" alt="Logo" class="logo" />
      <button @click="toggleSidebar" class="toggle-btn">
        <font-awesome-icon
          :icon="isCollapsed ? 'chevron-right' : 'chevron-left'"
        />
      </button>
    </div>

    <nav class="nav-menu">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: currentRoute === item.path }"
      >
        <div class="nav-icon">
          <font-awesome-icon :icon="item.icon" />
        </div>
        <span v-if="!isCollapsed" class="nav-text">{{ item.name }}</span>
      </router-link>

      <button @click="handleLogout" class="nav-item logout-btn">
        <div class="nav-icon">
          <font-awesome-icon icon="sign-out-alt" />
        </div>
        <span v-if="!isCollapsed" class="nav-text">Logout</span>
      </button>
    </nav>
  </div>
</template>

<script>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faUser,
  faHome,
  faBook,
  faShoppingCart,
  faEdit,
  faChevronLeft,
  faChevronRight,
  faSignOutAlt,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
import { faBookReader } from "@fortawesome/free-solid-svg-icons";
library.add(faBookReader);
library.add(
  faHome,
  faBook,
  faShoppingCart,
  faUser,
  faEdit,
  faChevronLeft,
  faChevronRight,
  faSignOutAlt,
  faClipboardList
);

export default {
  name: "SidebarMenu",
  components: {
    FontAwesomeIcon,
  },
  props: {
    isCollapsed: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["toggle"],

  setup(props, { emit }) {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();

    const currentRoute = computed(() => route.path);
    // Directly use the isAdmin getter from the store
    const isAdmin = computed(() => store.getters["auth/isAdmin"]);
    // Also get the full user object from store for potential re-fetches if needed
    const currentUser = computed(() => store.getters["auth/getUser"]);

    // Define menu items based on role
    const adminMenuItems = [
      { name: "Dashboard", path: "/dashboard", icon: "home" },
      { name: "Books", path: "/books", icon: "book" },
      { name: "Manage Books", path: "/books/manage", icon: "edit" },
      { name: "Manage Orders", path: "/orders/manage", icon: "clipboard-list" },
      { name: "Cart", path: "/cart", icon: "shopping-cart" },
      { name: "My Library", path: "/my-library", icon: "book-reader" }, // <-- NEW
      { name: "Profile", path: "/profile", icon: "user" },
    ];

    const userMenuItems = [
      { name: "Books", path: "/books", icon: "book" },
      { name: "My Library", path: "/my-library", icon: "book-reader" }, // <-- NEW
      { name: "Cart", path: "/cart", icon: "shopping-cart" },
      { name: "Profile", path: "/profile", icon: "user" },
    ];

    // Compute menu items based on the isAdmin getter
    const menuItems = computed(() =>
      isAdmin.value ? adminMenuItems : userMenuItems
    );

    // Initial fetch of profile when component mounts (if user is authenticated but no user data in store)
    // This is a fallback/redundancy for store's initialisation/router guard
    onMounted(async () => {
      if (store.getters["auth/isAuthenticated"] && !currentUser.value) {
        try {
          await store.dispatch("auth/fetchUserProfile");
          console.log(
            "SidebarMenu: User profile re-fetched on mount as it was missing."
          );
        } catch (error) {
          console.error(
            "SidebarMenu: Failed to re-fetch user profile on mount:",
            error
          );
          // If this fails, the navigation guard should have already handled the logout/redirect
          // But as a safeguard, ensure logout happens if token is bad
          if (error.response && error.response.status === 401) {
            await store.dispatch("auth/logout");
            router.push("/login");
          }
        }
      }
    });

    const handleLogout = async () => {
      try {
        console.log("SidebarMenu: Attempting to logout via Vuex action...");
        await store.dispatch("auth/logout");
        console.log("SidebarMenu: Logout successful. Redirecting to login.");
        router.push("/login");
      } catch (error) {
        console.error("SidebarMenu: Logout error:", error);
        router.push("/login"); // Ensure redirection happens regardless of backend error
      }
    };

    const toggleSidebar = () => {
      emit("toggle", !props.isCollapsed);
    };

    return {
      menuItems,
      currentRoute,
      toggleSidebar,
      handleLogout,
      // No need to expose userRole directly, menuItems computed property uses isAdmin
    };
  },
};
</script>

<style scoped>
/* Your existing styles (copy-pasted from your prompt) */
.sidebar {
  width: 240px;
  height: 100vh;
  background: linear-gradient(180deg, #1a237e 0%, #283593 100%);
  position: fixed;
  left: 0;
  top: 0;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 0 20px 20px 0;
  transition: width 0.3s ease;
  z-index: 1000;
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 1.5rem;
}

.logo {
  height: 60px;
  width: auto;
  transition: opacity 0.3s ease;
}

.collapsed .logo {
  opacity: 0;
}

.toggle-btn {
  position: absolute;
  right: -12px;
  top: 20px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  color: #1a237e;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-menu {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: calc(100vh - 100px);
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: 12px;
  margin: 0.25rem 0;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.nav-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.nav-text {
  font-weight: 500;
  font-size: 1.1rem;
  white-space: nowrap;
}

.collapsed .nav-item {
  padding: 1rem;
  justify-content: center;
}

.collapsed .nav-icon {
  margin-right: 0;
}

.logout-btn {
  margin-top: auto;
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background-color: rgba(255, 105, 97, 0.2);
  color: rgb(255, 105, 97);
  transform: translateX(5px);
}

.logout-btn:hover .nav-icon {
  color: rgb(255, 105, 97);
}
</style>
