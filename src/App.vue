<template>
  <div class="app-container">
    <SidebarMenu
      v-if="showSidebar"
      @toggle="handleSidebarToggle"
      :isCollapsed="isSidebarCollapsed"
    />
    <main
      class="main-content"
      :class="{
        'sidebar-expanded': showSidebar && !isSidebarCollapsed,
        'sidebar-collapsed': showSidebar && isSidebarCollapsed,
        'no-sidebar': !showSidebar,
      }"
    >
      <router-view></router-view>
    </main>
    <ToastNotification />
  </div>
</template>

<script>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import SidebarMenu from "@/components/SidebarMenu.vue";
import ToastNotification from "@/components/ToastNotification.vue";

export default {
  name: "App",
  components: {
    ToastNotification,
    SidebarMenu,
  },
  setup() {
    const route = useRoute();
    const showSidebar = ref(true);
    const isSidebarCollapsed = ref(false);

    watch(route, (newRoute) => {
      showSidebar.value = !["/login", "/register", "/verify-email"].includes(
        newRoute.path
      );
    });

    const handleSidebarToggle = (collapsed) => {
      isSidebarCollapsed.value = collapsed;
    };

    return {
      showSidebar,
      isSidebarCollapsed,
      handleSidebarToggle,
    };
  },
};
</script>

<style>
.app-container {
  display: flex;
  min-height: 100vh;
  background-color: #dbe9f4;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  transition: margin-left 0.3s ease;
  padding: 2rem;
}

.main-content.sidebar-collapsed {
  margin-left: 80px;
}

.main-content.no-sidebar {
  margin-left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  line-height: 1.6;
}

* {
  box-sizing: border-box;
}

a {
  text-decoration: none;
  color: #3498db;
}

a:hover {
  color: #2980b9;
}

.text-center {
  text-align: center;
}

.error-message {
  color: #e74c3c;
  margin: 1rem 0;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 1rem;
  }
}
</style>
