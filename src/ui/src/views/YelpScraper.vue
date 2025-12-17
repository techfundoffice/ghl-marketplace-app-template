<template>
  <div class="yelp-scraper">
    <div class="page-header">
      <h1>Yelp Scraper</h1>
      <p class="subtitle">Find and analyze competitor businesses on Yelp</p>
    </div>

    <div class="scraper-content">
      <div class="search-section">
        <div class="search-card">
          <h2>Search Competitors</h2>
          <div class="search-form">
            <div class="form-group">
              <label>Business Category</label>
              <input type="text" v-model="category" placeholder="e.g., Restaurants, Plumbers, Dentists" />
            </div>
            <div class="form-group">
              <label>Location</label>
              <input type="text" v-model="location" placeholder="e.g., San Francisco, CA" />
            </div>
            <div class="form-group">
              <label>Radius (miles)</label>
              <select v-model="radius">
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
              </select>
            </div>
            <button class="search-btn" @click="searchCompetitors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Search Competitors
            </button>
          </div>
        </div>
      </div>

      <div class="results-section">
        <div class="results-header">
          <h2>Results</h2>
          <span class="result-count">{{ competitors.length }} competitors found</span>
        </div>
        <div class="results-list">
          <div v-if="competitors.length === 0" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <p>Enter search criteria above to find competitors</p>
          </div>
          <div v-for="competitor in competitors" :key="competitor.id" class="competitor-card">
            <div class="competitor-info">
              <h3>{{ competitor.name }}</h3>
              <p class="address">{{ competitor.address }}</p>
              <div class="rating">
                <div class="stars">
                  <span v-for="n in 5" :key="n" :class="{ filled: n <= competitor.rating }">★</span>
                </div>
                <span class="review-count">{{ competitor.reviews }} reviews</span>
              </div>
            </div>
            <div class="competitor-actions">
              <button class="action-btn">View Details</button>
              <button class="action-btn secondary">Add to List</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'YelpScraper',
  data() {
    return {
      category: '',
      location: '',
      radius: '10',
      competitors: []
    }
  },
  methods: {
    searchCompetitors() {
      console.log('Searching for competitors:', this.category, this.location, this.radius);
    }
  }
}
</script>

<style scoped>
.yelp-scraper {
  padding: 32px;
  max-width: 1200px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #666;
  font-size: 15px;
  margin: 0;
}

.scraper-content {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
}

.search-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
}

.search-card h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 20px 0;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #444;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 14px;
  color: #1a1a1a;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #2563eb;
}

.form-group input::placeholder {
  color: #999;
}

.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
}

.search-btn:hover {
  background: #1d4ed8;
}

.results-section {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.results-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.result-count {
  font-size: 13px;
  color: #666;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.competitor-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  transition: border-color 0.2s;
}

.competitor-card:hover {
  border-color: #c0c0c0;
}

.competitor-info h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px 0;
}

.address {
  font-size: 13px;
  color: #666;
  margin: 0 0 8px 0;
}

.rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stars {
  color: #d0d0d0;
  font-size: 14px;
  letter-spacing: 1px;
}

.stars .filled {
  color: #f59e0b;
}

.review-count {
  font-size: 12px;
  color: #888;
}

.competitor-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:not(.secondary) {
  background: #2563eb;
  color: white;
  border: none;
}

.action-btn:not(.secondary):hover {
  background: #1d4ed8;
}

.action-btn.secondary {
  background: white;
  color: #444;
  border: 1px solid #d0d0d0;
}

.action-btn.secondary:hover {
  background: #f5f5f5;
}

@media (max-width: 900px) {
  .scraper-content {
    grid-template-columns: 1fr;
  }
}
</style>
