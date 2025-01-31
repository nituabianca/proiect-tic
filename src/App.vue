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
  </div>
</template>

<script>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import SidebarMenu from "@/components/SidebarMenu.vue";

export default {
  name: "App",
  components: {
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
}

.main-content {
  flex: 1;
  transition: margin-left 0.3s ease;
}

.main-content.sidebar-expanded {
  margin-left: 250px;
}

.main-content.sidebar-collapsed {
  margin-left: 80px;
}

.main-content.no-sidebar {
  margin-left: 0;
}
/* Global styles */
body {
  margin: 0;
  font-family: Arial, sans-serif;
  line-height: 1.6;
  background-color: #f4f6f9;
}

* {
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
}
/*
.main-content {
  margin-left: 250px;
  width: calc(100% - 250px);
  min-height: 100vh;
  transition: all 0.3s ease;
}

.main-content.full-width {
  margin-left: 0;
  width: 100%;
}
*/

/* Reset link styles */
a {
  text-decoration: none;
  color: #3498db;
}

a:hover {
  color: #2980b9;
}

#app {
  display: flex;
}

.main-content {
  flex: 1;
  margin-left: 250px;
  transition: margin-left 0.3s ease;
}

.with-sidebar .main-content {
  margin-left: 250px;
}

.sidebar-collapsed .main-content {
  margin-left: 80px;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
}

/* Utility classes */
.text-center {
  text-align: center;
}

.error-message {
  color: #e74c3c;
  margin: 1rem 0;
}
</style>
