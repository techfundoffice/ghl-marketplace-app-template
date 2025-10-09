<template>
  <div class="settings-page">
    <div class="settings-header">
      <h1>Settings</h1>
      <p class="subtitle">Manage your application settings and preferences</p>
    </div>

    <div class="settings-grid">
      <div class="setting-card">
        <h3>MY BUSINESS</h3>
        <ul>
          <li>Business Profile</li>
          <li>My Profile</li>
          <li>Billing</li>
          <li>My Staff</li>
          <li>Opportunities & Pipelines</li>
        </ul>
      </div>

      <div class="setting-card">
        <h3>BUSINESS SERVICES</h3>
        <ul>
          <li>Automation</li>
          <li>Calendars</li>
          <li>Conversation AI <span class="badge">New</span></li>
          <li>Knowledge Base <span class="badge">New</span></li>
          <li>Voice AI Agents</li>
          <li>Email Services</li>
          <li>Phone Numbers</li>
          <li>WhatsApp</li>
        </ul>
      </div>

      <div class="setting-card">
        <h3>OTHER SETTINGS</h3>
        <ul>
          <li>Objects <span class="badge">New</span></li>
          <li>Custom Fields</li>
          <li>Custom Values</li>
          <li>Manage Scoring</li>
          <li>Domains & URL Redirects</li>
          <li>Integrations</li>
          <li>Private Integrations</li>
          <li>Conversation Providers</li>
          <li>Tags</li>
          <li>Labs <span class="badge">New</span></li>
          <li>Audit Logs</li>
          <li>Brand Boards <span class="badge">New</span></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsSimple',
  mounted() {
    console.log('✅ SettingsSimple component mounted!');
  }
}
</script>

<style scoped>
.settings-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 32px;
}

.settings-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.setting-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
}

.setting-card h3 {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  letter-spacing: 0.5px;
  margin: 0 0 16px 0;
}

.setting-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.setting-card li {
  padding: 10px 0;
  color: #1a1a1a;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-card li:last-child {
  border-bottom: none;
}

.badge {
  background: #10b981;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}
</style>
