<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="app-title">
        <span class="app-name">GoHighLevel</span>
        <span class="app-subtitle">Marketplace App</span>
      </div>
    </div>

    <div class="location-selector">
      <div class="location-info">
        <div class="location-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div class="location-text">
          <div class="location-name">Demo Location</div>
          <div class="location-address">Sample City, CA</div>
        </div>
      </div>
      <svg class="dropdown-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>

    <div class="search-box">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <input type="text" placeholder="Search" />
      <span class="search-shortcut">⌘K</span>
    </div>

    <nav class="nav-menu">
      <router-link to="/launchpad" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
        <span>Launchpad</span>
      </router-link>

      <router-link to="/" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span>Dashboard</span>
      </router-link>

      <router-link to="/conversations" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Conversations</span>
      </router-link>

      <router-link to="/calendars" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>Calendars</span>
      </router-link>

      <router-link to="/contacts" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span>Contacts</span>
      </router-link>

      <router-link to="/opportunities" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="6"></circle>
          <circle cx="12" cy="12" r="2"></circle>
        </svg>
        <span>Opportunities</span>
      </router-link>

      <router-link to="/payments" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
        <span>Payments</span>
      </router-link>

      <div class="nav-divider"></div>

      <router-link to="/ai-agents" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>
        <span>AI Agents</span>
      </router-link>

      <router-link to="/marketing" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18"></path>
          <path d="m19 9-5 5-4-4-3 3"></path>
        </svg>
        <span>Marketing</span>
      </router-link>

      <router-link to="/automation" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <span>Automation</span>
      </router-link>

      <router-link to="/sites" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        <span>Sites</span>
      </router-link>

      <router-link to="/memberships" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Memberships</span>
      </router-link>

      <router-link to="/media-storage" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Media Storage</span>
      </router-link>

      <router-link to="/reputation" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span>Reputation</span>
      </router-link>

      <router-link to="/reporting" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        <span>Reporting</span>
      </router-link>

      <router-link to="/app-marketplace" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span>App Marketplace</span>
      </router-link>

      <router-link to="/ai-site-builder" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="4"></circle>
        </svg>
        <span>AI Site Builder</span>
      </router-link>

      <router-link to="/account-booster" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
          <line x1="12" y1="6" x2="12" y2="14"></line>
          <path d="M12 14l-4-4"></path>
          <path d="M12 14l4-4"></path>
        </svg>
        <span>Account Booster</span>
      </router-link>

      <router-link to="/yelp-scraper" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
          <path d="M11 8v6"></path>
          <path d="M8 11h6"></path>
        </svg>
        <span>Yelp Scraper</span>
      </router-link>

      <router-link to="/reviewers" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span>Reviewers Database</span>
      </router-link>

      <div class="nav-divider"></div>

      <router-link to="/settings" class="nav-item">
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m5.66-13a6 6 0 0 1 0 10.4M6.34 7A6 6 0 0 0 6.34 17.4M16 12h6M2 12h6"></path>
        </svg>
        <span>Settings</span>
      </router-link>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'Sidebar'
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.app-title {
  display: flex;
  flex-direction: column;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
  color: #dc2626;
}

.app-subtitle {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.location-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: 12px 12px 8px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.location-selector:hover {
  background: #f5f5f5;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.location-icon {
  color: #666;
}

.location-text {
  display: flex;
  flex-direction: column;
}

.location-name {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}

.location-address {
  font-size: 11px;
  color: #666;
}

.dropdown-icon {
  color: #999;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 12px 16px 12px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.search-icon {
  color: #999;
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: #1a1a1a;
}

.search-box input::placeholder {
  color: #999;
}

.search-shortcut {
  font-size: 11px;
  color: #999;
  padding: 2px 6px;
  background: #f5f5f5;
  border-radius: 3px;
}

.nav-menu {
  flex: 1;
  padding: 8px 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  color: #4a5568;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  margin-bottom: 2px;
}

.nav-item:hover {
  background: #e5e7eb;
  color: #1a1a1a;
}

.nav-item.router-link-active {
  background: #2563eb;
  color: white;
}

.nav-item.router-link-active .nav-icon {
  stroke: white;
}

.nav-icon {
  flex-shrink: 0;
}

.nav-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 12px 0;
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
