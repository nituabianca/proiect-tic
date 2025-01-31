<template>
  <div class="sidebar-menu" :class="{ 'sidebar-collapsed': isCollapsed }">
    <div class="sidebar-header">
      <img
        v-if="!isCollapsed"
        src="../assets/logo2.png"
        alt="Book Store Logo"
        class="sidebar-logo"
      />
      <button @click="toggleSidebar" class="sidebar-toggle">
        <component :is="isCollapsed ? ChevronRightIcon : ChevronLeftIcon" />
      </button>
    </div>

    <nav>
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="sidebar-item"
        active-class="active"
      >
        <component :is="item.icon" class="sidebar-icon" />
        <span v-if="!isCollapsed">{{ item.name }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  HomeIcon,
  BookOpenIcon,
  ShoppingCartIcon,
  UserIcon,
  CogIcon,
  LogoutIcon,
} from "@heroicons/vue/16/solid";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/vue/16/solid/index";

export default {
  methods: { ChevronLeftIcon, ChevronRightIcon },
  components: {
    HomeIcon,
    BookOpenIcon,
    ShoppingCartIcon,
    UserIcon,
    CogIcon,
    LogoutIcon,
  },
  setup() {
    const route = useRoute();
    const isCollapsed = ref(false);
    const showSidebar = ref(true);

    const menuItems = [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: HomeIcon,
      },
      {
        name: "Books",
        path: "/books",
        icon: BookOpenIcon,
      },
      {
        name: "Cart",
        path: "/cart",
        icon: ShoppingCartIcon,
      },
      {
        name: "Profile",
        path: "/profile",
        icon: UserIcon,
      },
      {
        name: "Settings",
        path: "/settings",
        icon: CogIcon,
      },
    ];

    const toggleSidebar = () => {
      isCollapsed.value = !isCollapsed.value;
    };

    // Hide sidebar on login/register pages
    watch(route, (newRoute) => {
      showSidebar.value = !["/login", "/register"].includes(newRoute.path);
    });

    return {
      menuItems,
      isCollapsed,
      showSidebar,
      toggleSidebar,
    };
  },
};
</script>

<style scoped>
.sidebar-menu {
  width: 250px;
  height: 100vh;
  background-color: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  position: fixed;
  left: 0;
  top: 0;
  transition: width 0.3s ease;
}

.sidebar-menu.sidebar-collapsed {
  width: 80px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.sidebar-logo {
  width: 50px;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: background-color 0.3s ease;
  border-radius: 4px;
}

.sidebar-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.sidebar-item.active {
  background-color: #3498db;
  color: white;
}

.sidebar-icon {
  height: 1rem;
  margin-right: 1rem;
  color: white;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Collapsed state */
.sidebar-collapsed .sidebar-logo {
  display: none;
}

.sidebar-collapsed nav .sidebar-item span {
  display: none;
}

.sidebar-collapsed nav .sidebar-item {
  justify-content: center;
}
</style>
