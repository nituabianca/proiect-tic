<template>
  <div id="app">
    <SidebarMenu v-if="showSidebar" />
    <div class="main-content" :class="{ 'full-width': !showSidebar }">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
// import SidebarMenu from "@/components/SidebarMenu.vue";

export default {
  name: "App",
  components: {
    // SidebarMenu,
  },
  setup() {
    const route = useRoute();
    const showSidebar = ref(true);

    watch(route, (newRoute) => {
      showSidebar.value = !["/login", "/register"].includes(newRoute.path);
    });

    return {
      showSidebar,
    };
  },
};
</script>

<style>
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

/* Utility classes */
.text-center {
  text-align: center;
}

.error-message {
  color: #e74c3c;
  margin: 1rem 0;
}
</style>
