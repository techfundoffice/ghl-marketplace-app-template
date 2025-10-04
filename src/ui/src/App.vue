<template>
  <div id="app">
    <div style="background: red; color: white; padding: 20px; font-size: 24px; font-weight: bold;">
      VUE APP IS LOADED - If you see this, the app is working!
    </div>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
  async mounted(){
    try {
      if (window.ghl && window.ghl.getUserData) {
        const data = await window.ghl.getUserData();
        console.log("user-details", data)
      }
    } catch (error) {
      console.log("GHL initialization error:", error)
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
}
</style>
