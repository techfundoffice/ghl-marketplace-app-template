<template>
  <div class="settings-wrapper">
    <div class="settings-header">
      <h1>Settings</h1>
    </div>
    <div class="settings-container">
      <aside class="settings-sidebar">
      <div class="sidebar-section">
        <h3 class="section-header">MY BUSINESS</h3>
        <nav>
          <router-link to="/business-profile" class="nav-item">Business Profile</router-link>
          <router-link to="/my-profile" class="nav-item">My Profile</router-link>
          <router-link to="/billing" class="nav-item">Billing</router-link>
          <router-link to="/my-staff" class="nav-item">My Staff</router-link>
          <router-link to="/opportunities-pipelines" class="nav-item">Opportunities & Pipelines</router-link>
        </nav>
      </div>

      <div class="sidebar-section">
        <h3 class="section-header">BUSINESS SERVICES</h3>
        <nav>
          <router-link to="/automation" class="nav-item">Automation</router-link>
          <router-link to="/calendars" class="nav-item">Calendars</router-link>
          <router-link to="/conversation-ai" class="nav-item">
            Conversation AI
            <span class="badge">New</span>
          </router-link>
          <router-link to="/knowledge-base" class="nav-item">
            Knowledge Base
            <span class="badge">New</span>
          </router-link>
          <router-link to="/voice-ai-agents" class="nav-item">Voice AI Agents</router-link>
          <router-link to="/email-services" class="nav-item">Email Services</router-link>
          <router-link to="/phone-numbers" class="nav-item">Phone Numbers</router-link>
          <router-link to="/whatsapp" class="nav-item">WhatsApp</router-link>
        </nav>
      </div>

      <div class="sidebar-section">
        <h3 class="section-header">OTHER SETTINGS</h3>
        <nav>
          <router-link to="/objects" class="nav-item">
            Objects
            <span class="badge">New</span>
          </router-link>
          <router-link to="/custom-fields" class="nav-item">Custom Fields</router-link>
          <router-link to="/custom-values" class="nav-item">Custom Values</router-link>
          <router-link to="/manage-scoring" class="nav-item">Manage Scoring</router-link>
          <router-link to="/domains-url-redirects" class="nav-item">Domains & URL Redirects</router-link>
          <router-link to="/integrations" class="nav-item">Integrations</router-link>
          <router-link to="/private-integrations" class="nav-item">Private Integrations</router-link>
          <router-link to="/conversation-providers" class="nav-item">Conversation Providers</router-link>
          <router-link to="/tags" class="nav-item">Tags</router-link>
          <router-link to="/labs" class="nav-item">
            Labs
            <span class="badge">New</span>
          </router-link>
          <router-link to="/audit-logs" class="nav-item">Audit Logs</router-link>
          <router-link to="/brand-boards" class="nav-item">
            Brand Boards
            <span class="badge">New</span>
          </router-link>
        </nav>
      </div>
    </aside>

      <main class="settings-content">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Settings'
}
</script>

<style scoped>
.settings-wrapper {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.settings-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 20px 32px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.settings-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.settings-container {
  display: flex;
  min-height: calc(100vh - 64px);
}

.settings-sidebar {
  width: 250px;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  padding: 24px 0;
  overflow-y: auto;
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
}

.sidebar-section {
  margin-bottom: 32px;
  padding: 0 16px;
}

.section-header {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
  padding: 0 8px;
  text-transform: uppercase;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin: 2px 0;
  color: #374151;
  text-decoration: none;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.nav-item.router-link-active {
  background-color: #dbeafe;
  color: #1e40af;
  font-weight: 500;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  color: #10b981;
  background-color: #d1fae5;
  border-radius: 12px;
  margin-left: 8px;
}

.settings-content {
  flex: 1;
  margin-left: 250px;
  padding: 32px 48px;
  background-color: #f5f5f5;
}

@media (max-width: 768px) {
  .settings-sidebar {
    position: static;
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .settings-content {
    margin-left: 0;
    padding: 24px 16px;
  }
}
</style>
