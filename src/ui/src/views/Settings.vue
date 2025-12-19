<template>
  <div class="settings-wrapper">
    <div class="settings-container">
      <aside class="settings-sidebar">
        <div class="sidebar-header">
          <button class="go-back-btn" @click="goBack">
            <span class="arrow">&larr;</span> Go Back
          </button>
          <h2 class="sidebar-title">Settings</h2>
        </div>
        <nav class="sidebar-nav">
          <router-link to="/settings/my-profile" class="nav-item">My Profile</router-link>
          <router-link to="/settings/company" class="nav-item">Company</router-link>
          <router-link to="/settings/team" class="nav-item">Team</router-link>
          <router-link to="/settings/billing" class="nav-item">Billing</router-link>
          <router-link to="/settings/phone-integration" class="nav-item">Phone Integration</router-link>
          <router-link to="/settings/email-services" class="nav-item">Email Services</router-link>
          <router-link to="/settings/system-emails" class="nav-item">System Emails</router-link>
          <router-link to="/settings/announcements" class="nav-item">Announcements</router-link>
          <router-link to="/settings/workflow-premium" class="nav-item">Workflow - Premium Features</router-link>
          <router-link to="/settings/ai-employee" class="nav-item">AI Employee</router-link>
          <router-link to="/settings/ask-ai-config" class="nav-item">Ask AI Configuration</router-link>
          <router-link to="/settings/workflow-external-ai" class="nav-item">Workflow - External AI Models</router-link>
          <router-link to="/settings/domain-purchase" class="nav-item">Domain Purchase</router-link>
          <router-link to="/settings/private-integrations" class="nav-item">Private Integrations</router-link>
          <router-link to="/settings/affiliates" class="nav-item">Affiliates</router-link>
          <router-link to="/settings/custom-menu-links" class="nav-item">Custom Menu Links</router-link>
          <router-link to="/settings/stripe" class="nav-item">Stripe</router-link>
          <router-link to="/settings/compliance" class="nav-item">Compliance</router-link>
          <router-link to="/settings/labs" class="nav-item">Labs</router-link>
          <router-link to="/settings/audit-logs" class="nav-item">Audit Logs</router-link>
          <router-link to="/settings/media-storage-usage" class="nav-item">Media Storage Usage</router-link>
          <router-link to="/settings/help-ghl-api" class="nav-item">Help GHL API</router-link>
        </nav>
      </aside>

      <main class="settings-content">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Settings',
  methods: {
    goBack() {
      this.$router.push('/');
    }
  }
}
</script>

<style scoped>
.settings-wrapper {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.settings-container {
  display: flex;
  min-height: 100vh;
}

.settings-sidebar {
  width: 260px;
  min-width: 260px;
  background-color: #1e293b;
  padding: 0;
  overflow-y: auto;
  height: 100vh;
  position: sticky;
  top: 0;
}

.sidebar-header {
  padding: 20px 16px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.go-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 16px;
  transition: background 0.2s;
}

.go-back-btn:hover {
  background: #2563eb;
}

.go-back-btn .arrow {
  font-size: 16px;
}

.sidebar-title {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.sidebar-nav {
  padding: 8px 0;
}

.nav-item {
  display: block;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.15s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.nav-item.router-link-active {
  background-color: rgba(59, 130, 246, 0.15);
  color: #fff;
  border-left-color: #3b82f6;
  font-weight: 500;
}

.settings-content {
  flex: 1;
  padding: 32px 48px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .settings-container {
    flex-direction: column;
  }

  .settings-sidebar {
    position: static;
    width: 100%;
    height: auto;
    max-height: 50vh;
  }

  .settings-content {
    padding: 24px 16px;
  }
}
</style>
