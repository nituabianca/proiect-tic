<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <img
        v-if="!isCollapsed"
        src="../assets/logo2.png"
        alt="Logo"
        class="logo"
      />
      <button @click="toggleSidebar" class="toggle-btn">
        <component
          :is="isCollapsed ? ChevronRightIcon : ChevronLeftIcon"
          class="w-6 h-6 text-white"
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
        <component :is="item.icon" class="nav-icon" />
        <span v-if="!isCollapsed" class="nav-text">{{ item.name }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script>
/*eslint-disable*/
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import {
  HomeIcon,
  BookOpenIcon,
  ShoppingCartIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/vue/24/solid";

export default {
  name: "SidebarMenu",
  props: {
    isCollapsed: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["toggle"],
  setup(props, { emit }) {
    const route = useRoute();
    const currentRoute = computed(() => route.path);

    const menuItems = [
      { name: "Dashboard", path: "/dashboard", icon: HomeIcon },
      { name: "Books", path: "/books", icon: BookOpenIcon },
      { name: "Cart", path: "/cart", icon: ShoppingCartIcon },
      { name: "Profile", path: "/profile", icon: UserIcon },
      { name: "Settings", path: "/settings", icon: Cog6ToothIcon },
    ];

    const toggleSidebar = () => {
      emit("toggle", !props.isCollapsed);
    };

    return {
      menuItems,
      currentRoute,
      toggleSidebar,
      ChevronLeftIcon,
      ChevronRightIcon,
    };
  },
};
</script>

<style scoped>
.sidebar {
  width: 250px;
  height: 100vh;
  background-color: #2c3e50;
  position: fixed;
  left: 0;
  top: 0;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  height: 40px;
  width: auto;
}

.toggle-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
}

.nav-menu {
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background-color: #3498db;
  color: white;
}

.nav-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.nav-text {
  margin-left: 1rem;
  white-space: nowrap;
}

.collapsed .nav-text {
  display: none;
}

.collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem;
}

@media (max-width: 768px) {
  .sidebar {
    width: 80px;
  }

  .nav-text {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding: 0.75rem;
  }

  .logo {
    display: none;
  }
}
</style>
