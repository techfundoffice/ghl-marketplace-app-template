<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p class="subtitle">Welcome back! Here's what's happening today.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: #e3f2fd;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2196f3" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="stat-content">
          <h3>Total Contacts</h3>
          <p class="stat-number">2,547</p>
          <span class="stat-change positive">+12% from last month</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #f3e5f5;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9c27b0" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </div>
        <div class="stat-content">
          <h3>Opportunities</h3>
          <p class="stat-number">184</p>
          <span class="stat-change positive">+8% from last month</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #e8f5e9;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="stat-content">
          <h3>Revenue</h3>
          <p class="stat-number">$48,592</p>
          <span class="stat-change positive">+23% from last month</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff3e0;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff9800" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div class="stat-content">
          <h3>Appointments</h3>
          <p class="stat-number">67</p>
          <span class="stat-change neutral">Same as last month</span>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="content-left">
        <div class="card">
          <div class="card-header">
            <h2>Recent Activity</h2>
          </div>
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-dot" style="background: #2196f3;"></div>
              <div class="activity-details">
                <p class="activity-title">New contact added</p>
                <p class="activity-time">John Smith - 2 hours ago</p>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-dot" style="background: #4caf50;"></div>
              <div class="activity-details">
                <p class="activity-title">Opportunity won</p>
                <p class="activity-time">ABC Corp Deal - 5 hours ago</p>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-dot" style="background: #ff9800;"></div>
              <div class="activity-details">
                <p class="activity-title">Appointment scheduled</p>
                <p class="activity-time">Meeting with Sarah - 1 day ago</p>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-dot" style="background: #9c27b0;"></div>
              <div class="activity-details">
                <p class="activity-title">Email campaign sent</p>
                <p class="activity-time">Monthly Newsletter - 2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="content-right">
        <div class="card">
          <div class="card-header">
            <h2>Quick Actions</h2>
          </div>
          <div class="quick-actions">
            <button class="action-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Add Contact
            </button>
            <button class="action-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Schedule Meeting
            </button>
            <button class="action-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Create Opportunity
            </button>
            <button class="action-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              Send Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dashboard',
  mounted() {
    console.log('📊 Dashboard component mounted, route:', this.$route.path);
  }
}
</script>

<style scoped>
.dashboard {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 32px;
}

.dashboard-header h1 {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: box-shadow 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content h3 {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px 0;
}

.stat-change {
  font-size: 12px;
  font-weight: 500;
}

.stat-change.positive {
  color: #4caf50;
}

.stat-change.neutral {
  color: #666;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.activity-list {
  padding: 20px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

.activity-item:last-child {
  margin-bottom: 0;
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0 0 4px 0;
}

.activity-time {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.quick-actions {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
  border-color: #2563eb;
  color: #2563eb;
}

@media (max-width: 968px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}
</style>
