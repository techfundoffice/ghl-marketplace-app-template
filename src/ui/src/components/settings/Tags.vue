<template>
  <div class="settings-page">
    <h1 class="page-title">Tags</h1>
    <p class="page-description">Manage tags for organizing your data.</p>
  </div>
</template>

<script>
export default {
  name: 'Tags'
}
</script>

<style scoped>
.settings-page {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}
</style>
