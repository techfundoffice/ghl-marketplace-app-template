<template>
  <div id="app">
    <div class="app-layout">
      <Sidebar v-if="showMainSidebar" />
      <main class="main-content" :class="{ 'full-width': !showMainSidebar }">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue'

export default {
  name: 'App',
  components: {
    Sidebar
  },
  computed: {
    showMainSidebar() {
      return !this.$route.matched.some(record => record.meta.hideMainSidebar);
    }
  },
  mounted(){
    if (window.ghl && window.ghl.getUserData) {
      window.ghl.getUserData().then(data => {
        if (data) {
          console.log("GHL user data loaded:", data);
        }
      });
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  background: #ffffff;
}

.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: #f9fafb;
}
</style>
