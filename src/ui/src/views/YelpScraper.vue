<template>
  <div class="yelp-scraper">
    <div class="page-header">
      <h1>Yelp Scraper</h1>
      <p class="subtitle">Find competitor businesses and enrich consumer data</p>
    </div>

    <div class="scraper-content">
      <div class="search-section">
        <div class="search-card">
          <h2>Search Competitors</h2>
          <div class="search-form">
            <div class="form-group">
              <label>Competitor URL <span class="optional">(direct Yelp business page)</span></label>
              <input type="text" v-model="directUrl" placeholder="https://www.yelp.com/biz/business-name" />
            </div>
            
            <div class="divider">
              <span>OR search by category</span>
            </div>
            
            <div class="form-group">
              <label>Business Category</label>
              <input type="text" v-model="searchTerms" placeholder="e.g., Restaurants, Plumbers, Dentists" :disabled="!!directUrl" />
            </div>
            <div class="form-group">
              <label>Location</label>
              <input type="text" v-model="location" placeholder="e.g., San Francisco, CA" :disabled="!!directUrl" />
            </div>
            <div class="form-row">
              <div class="form-group half">
                <label>Max Businesses</label>
                <select v-model="searchLimit">
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
              <div class="form-group half">
                <label>Reviews per Business</label>
                <select v-model="reviewLimit">
                  <option value="3">3</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </div>
            </div>
            
            <div class="ai-mode-toggle">
              <label class="toggle-label">
                <span class="toggle-text">AI Mode</span>
                <span class="toggle-hint">Uses AI-powered scraping</span>
              </label>
              <div class="toggle-switch" :class="{ active: aiMode }" @click="aiMode = !aiMode">
                <div class="toggle-slider"></div>
              </div>
            </div>
            
            <button class="search-btn" @click="scrapeYelp" :disabled="isLoading">
              <svg v-if="!isLoading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <span v-if="isLoading" class="spinner"></span>
              {{ isLoading ? 'Scraping...' : 'Search Competitors' }}
            </button>
            <p v-if="isLoading" class="loading-note">This may take 1-2 minutes...</p>
          </div>
        </div>

        <div class="log-panel" v-if="logs.length > 0">
          <div class="log-header">
            <h3>Output Log</h3>
            <button class="clear-log-btn" @click="clearLogs">Clear</button>
          </div>
          <div class="log-content" ref="logContent">
            <div 
              v-for="(log, idx) in logs" 
              :key="idx" 
              class="log-entry"
              :class="log.type"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="results-section">
        <div class="results-header">
          <h2>Results</h2>
          <span class="result-count">{{ businesses.length }} businesses found</span>
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="results-list">
          <div v-if="businesses.length === 0 && !isLoading" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <p>Enter search criteria above to find competitors</p>
          </div>

          <div v-for="business in businesses" :key="business.id" class="business-card">
            <div class="business-header">
              <div class="business-info">
                <h3>{{ business.name }}</h3>
                <p class="address">{{ business.address }}</p>
                <p class="phone" v-if="business.phone">{{ business.phone }}</p>
                <div class="rating">
                  <div class="stars">
                    <span v-for="n in 5" :key="n" :class="{ filled: n <= Math.round(business.rating) }">★</span>
                  </div>
                  <span class="review-count">{{ business.rating }} ({{ business.reviewCount }} reviews)</span>
                </div>
                <div class="categories" v-if="business.categories">
                  <span v-for="cat in business.categories?.slice(0, 3)" :key="cat" class="category-tag">{{ cat }}</span>
                </div>
              </div>
            </div>

            <div class="reviewers-section" v-if="business.reviews?.length">
              <h4>Reviewers ({{ business.reviews.length }})</h4>
              <div class="reviewers-list">
                <div v-for="(review, idx) in business.reviews" :key="idx" class="reviewer-card">
                  <div class="reviewer-info">
                    <div class="reviewer-name">{{ review.authorName || 'Anonymous' }}</div>
                    <div class="reviewer-location">{{ review.authorLocation }}</div>
                    <div class="reviewer-rating">
                      <span v-for="n in 5" :key="n" :class="{ filled: n <= review.rating }">★</span>
                    </div>
                    <p class="review-text">{{ review.text?.substring(0, 150) }}{{ review.text?.length > 150 ? '...' : '' }}</p>
                  </div>
                  <div class="reviewer-actions">
                    <button 
                      class="enrich-btn" 
                      @click="enrichConsumer(review, business.id, idx)"
                      :disabled="review.enriching"
                      v-if="!review.enrichedData"
                    >
                      <span v-if="review.enriching" class="spinner small"></span>
                      {{ review.enriching ? 'Enriching...' : 'Enrich Consumer' }}
                    </button>
                    <div v-if="review.enrichedData" class="enriched-data">
                      <div class="enriched-badge">Enriched</div>
                      <div class="enriched-details" v-if="review.enrichedData.success">
                        <p v-if="review.enrichedData.consumer?.email"><strong>Email:</strong> {{ review.enrichedData.consumer.email }}</p>
                        <p v-if="review.enrichedData.consumer?.phone"><strong>Phone:</strong> {{ review.enrichedData.consumer.phone }}</p>
                        <p v-if="review.enrichedData.consumer?.company"><strong>Company:</strong> {{ review.enrichedData.consumer.company }}</p>
                        <p v-if="review.enrichedData.consumer?.jobTitle"><strong>Title:</strong> {{ review.enrichedData.consumer.jobTitle }}</p>
                        <p v-if="review.enrichedData.consumer?.linkedin">
                          <a :href="review.enrichedData.consumer.linkedin" target="_blank">LinkedIn Profile</a>
                        </p>
                        <p class="likelihood">Match confidence: {{ review.enrichedData.likelihood }}/10</p>
                      </div>
                      <div v-else class="no-match">
                        No matching consumer found
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="reviewers-table-section" v-if="allReviewers.length > 0">
          <div class="table-header">
            <h2>Reviewers Data Table</h2>
            <span class="reviewer-count">{{ allReviewers.length }} total reviewers</span>
          </div>
          <div class="table-container">
            <table class="reviewers-table">
              <thead>
                <tr>
                  <th @click="sortTable('authorName')" class="sortable">
                    Name
                    <span class="sort-icon" v-if="sortColumn === 'authorName'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
                  </th>
                  <th @click="sortTable('authorLocation')" class="sortable">
                    Location
                    <span class="sort-icon" v-if="sortColumn === 'authorLocation'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
                  </th>
                  <th @click="sortTable('businessName')" class="sortable">
                    Business
                    <span class="sort-icon" v-if="sortColumn === 'businessName'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
                  </th>
                  <th @click="sortTable('rating')" class="sortable">
                    Rating
                    <span class="sort-icon" v-if="sortColumn === 'rating'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
                  </th>
                  <th>Enrichment Status</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(reviewer, idx) in sortedReviewers" :key="idx">
                  <td class="name-cell">{{ reviewer.authorName || 'Anonymous' }}</td>
                  <td>{{ reviewer.authorLocation || '-' }}</td>
                  <td>{{ reviewer.businessName }}</td>
                  <td class="rating-cell">
                    <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= reviewer.rating }">★</span>
                  </td>
                  <td>
                    <span v-if="reviewer.enrichedData" class="status-badge enriched">Enriched</span>
                    <span v-else class="status-badge pending">Pending</span>
                  </td>
                  <td>{{ reviewer.enrichedData?.consumer?.email || '-' }}</td>
                  <td>{{ reviewer.enrichedData?.consumer?.phone || '-' }}</td>
                  <td>
                    <button 
                      v-if="!reviewer.enrichedData"
                      class="table-enrich-btn"
                      @click="enrichFromTable(reviewer)"
                      :disabled="reviewer.enriching"
                    >
                      <span v-if="reviewer.enriching" class="spinner small"></span>
                      {{ reviewer.enriching ? '...' : 'Enrich' }}
                    </button>
                    <span v-else class="enriched-check">✓</span>
                  </td>
                </tr>
              </tbody>
            </table>
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
      directUrl: 'https://www.yelp.com/biz/club-cat-irvine?osq=Club+Cat',
      searchTerms: '',
      location: '',
      searchLimit: '10',
      reviewLimit: '5',
      businesses: [],
      isLoading: false,
      error: null,
      logs: [],
      aiMode: false,
      sortColumn: 'authorName',
      sortDirection: 'asc'
    }
  },
  mounted() {
    this.loadBusinesses();
  },
  computed: {
    allReviewers() {
      const reviewers = [];
      this.businesses.forEach(business => {
        (business.reviews || []).forEach((review, reviewIdx) => {
          reviewers.push({
            ...review,
            businessId: business.id,
            businessName: business.name,
            reviewIdx
          });
        });
      });
      return reviewers;
    },
    sortedReviewers() {
      const sorted = [...this.allReviewers];
      sorted.sort((a, b) => {
        let aVal = a[this.sortColumn];
        let bVal = b[this.sortColumn];
        
        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      return sorted;
    }
  },
  methods: {
    addLog(message, type = 'info') {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour12: false });
      this.logs.push({ message, type, time });
      this.$nextTick(() => {
        if (this.$refs.logContent) {
          this.$refs.logContent.scrollTop = this.$refs.logContent.scrollHeight;
        }
      });
    },
    
    clearLogs() {
      this.logs = [];
    },

    sortTable(column) {
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }
    },

    async loadBusinesses() {
      try {
        const response = await fetch('/api/businesses');
        const data = await response.json();
        
        if (data.success && data.businesses) {
          this.businesses = data.businesses.map(b => ({
            ...b,
            reviews: (b.reviews || []).map(r => ({
              ...r,
              authorName: r.authorName || r.reviewer?.name || 'Anonymous',
              authorLocation: r.authorLocation || r.reviewer?.location || '',
              reviewerId: r.reviewerId || r.reviewer?.id,
              enriching: false,
              enrichedData: null
            }))
          }));
        }
      } catch (err) {
        console.error('Error loading businesses:', err);
      }
    },

    async scrapeYelp() {
      if (!this.directUrl && (!this.searchTerms || !this.location)) {
        this.error = 'Please enter a competitor URL or both business category and location';
        this.addLog('Missing required fields', 'error');
        return;
      }

      this.isLoading = true;
      this.error = null;
      
      this.addLog('Starting Yelp scrape...', 'info');
      
      if (this.directUrl) {
        this.addLog(`Target URL: ${this.directUrl}`, 'info');
      } else {
        this.addLog(`Searching: "${this.searchTerms}" in ${this.location}`, 'info');
      }
      
      const endpoint = this.aiMode ? '/api/yelp-scrape-ai' : '/api/yelp-scrape';
      
      if (this.aiMode) {
        this.addLog('AI Mode enabled - using AI-powered scraping...', 'info');
      } else {
        this.addLog('Calling Apify epctex/yelp-scraper actor...', 'info');
      }

      try {
        const payload = {
          reviewLimit: parseInt(this.reviewLimit)
        };
        
        if (this.directUrl) {
          payload.directUrl = this.directUrl;
        } else {
          payload.searchTerms = this.searchTerms;
          payload.location = this.location;
          payload.searchLimit = parseInt(this.searchLimit);
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to scrape Yelp');
        }

        if (data.logs && Array.isArray(data.logs)) {
          data.logs.forEach(log => {
            this.addLog(log.message || log, log.type || 'info');
          });
        }

        this.addLog('Received response from ' + (this.aiMode ? 'AI scraper' : 'Apify'), 'success');
        this.addLog(`Processing ${data.businesses?.length || 0} businesses...`, 'info');

        const newBusinesses = data.businesses.map(b => ({
          ...b,
          reviews: (b.reviews || []).map(r => ({ 
            ...r, 
            authorName: r.reviewer?.name || r.authorName || 'Anonymous',
            authorLocation: r.reviewer?.location || r.authorLocation || '',
            reviewerId: r.reviewer?.id || r.reviewerId,
            enriching: false, 
            enrichedData: null 
          }))
        }));

        newBusinesses.forEach(newBiz => {
          const existingIndex = this.businesses.findIndex(b => b.id === newBiz.id || b.yelpId === newBiz.yelpId);
          if (existingIndex >= 0) {
            this.businesses[existingIndex] = newBiz;
          } else {
            this.businesses.push(newBiz);
          }
        });
        
        let totalReviewers = 0;
        this.businesses.forEach(b => {
          this.addLog(`Saved: ${b.name} (${b.rating} stars, ${b.reviewCount} reviews)`, 'success');
          totalReviewers += b.reviews?.length || 0;
        });
        
        this.addLog(`Total reviewers found: ${totalReviewers}`, 'success');
        this.addLog('Scrape completed successfully!', 'success');
      } catch (err) {
        this.error = err.message;
        this.addLog(`Error: ${err.message}`, 'error');
        console.error('Scrape error:', err);
      } finally {
        this.isLoading = false;
      }
    },

    async enrichFromTable(reviewer) {
      const businessIndex = this.businesses.findIndex(b => b.id === reviewer.businessId);
      if (businessIndex === -1) return;
      
      const review = this.businesses[businessIndex].reviews[reviewer.reviewIdx];
      await this.enrichConsumer(review, reviewer.businessId, reviewer.reviewIdx);
    },

    async enrichConsumer(review, businessId, reviewIdx) {
      const businessIndex = this.businesses.findIndex(b => b.id === businessId);
      if (businessIndex === -1) return;

      if (!review.reviewerId) {
        console.error('No reviewerId for this review');
        this.addLog(`No reviewer ID for ${review.authorName}`, 'warning');
        this.businesses[businessIndex].reviews[reviewIdx].enrichedData = { 
          success: false, 
          message: 'No reviewer ID available' 
        };
        return;
      }

      this.addLog(`Enriching: ${review.authorName} (${review.authorLocation})...`, 'info');
      this.businesses[businessIndex].reviews[reviewIdx].enriching = true;

      try {
        const response = await fetch('/api/enrich-consumer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewerId: review.reviewerId,
            name: review.authorName,
            location: review.authorLocation
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to enrich consumer');
        }

        const enrichment = data.enrichment || data;
        this.businesses[businessIndex].reviews[reviewIdx].enrichedData = {
          success: enrichment.success !== false,
          alreadyEnriched: data.alreadyEnriched,
          likelihood: enrichment.likelihood,
          consumer: {
            email: enrichment.email,
            phone: enrichment.phone,
            linkedin: enrichment.linkedin,
            company: enrichment.company,
            jobTitle: enrichment.jobTitle
          }
        };
        
        if (data.alreadyEnriched) {
          this.addLog(`${review.authorName}: Using cached enrichment data`, 'info');
        } else if (enrichment.success !== false) {
          const details = [];
          if (enrichment.email) details.push(`Email: ${enrichment.email}`);
          if (enrichment.phone) details.push(`Phone: ${enrichment.phone}`);
          if (enrichment.company) details.push(`Company: ${enrichment.company}`);
          this.addLog(`${review.authorName}: ${details.length > 0 ? details.join(', ') : 'No contact info found'}`, details.length > 0 ? 'success' : 'warning');
        } else {
          this.addLog(`${review.authorName}: No match found in People Data Labs`, 'warning');
        }
      } catch (err) {
        console.error('Enrich error:', err);
        this.addLog(`${review.authorName}: ${err.message}`, 'error');
        this.businesses[businessIndex].reviews[reviewIdx].enrichedData = { 
          success: false, 
          message: err.message 
        };
      } finally {
        this.businesses[businessIndex].reviews[reviewIdx].enriching = false;
      }
    }
  }
}
</script>

<style scoped>
.yelp-scraper {
  padding: 32px;
  max-width: 1400px;
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
  grid-template-columns: 380px 1fr;
  gap: 24px;
  align-items: start;
}

.search-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
  position: sticky;
  top: 20px;
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

.form-row {
  display: flex;
  gap: 12px;
}

.form-group.half {
  flex: 1;
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

.form-group input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.optional {
  font-weight: 400;
  color: #888;
  font-size: 11px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 8px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.divider span {
  padding: 0 12px;
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
}

.ai-mode-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
  border: 1px solid #c7d7fe;
  border-radius: 8px;
  margin-top: 4px;
}

.toggle-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-text {
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
}

.toggle-hint {
  font-size: 11px;
  color: #6b7280;
}

.toggle-switch {
  width: 48px;
  height: 26px;
  background: #d1d5db;
  border-radius: 13px;
  cursor: pointer;
  transition: background 0.3s ease;
  position: relative;
}

.toggle-switch.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.toggle-slider {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: transform 0.3s ease;
}

.toggle-switch.active .toggle-slider {
  transform: translateX(22px);
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

.search-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.search-btn:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.loading-note {
  font-size: 12px;
  color: #666;
  text-align: center;
  margin: 0;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner.small {
  width: 14px;
  height: 14px;
  border-width: 2px;
  border-color: rgba(37,99,235,0.3);
  border-top-color: #2563eb;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results-section {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
  min-height: 400px;
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

.error-message {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  margin-bottom: 16px;
  font-size: 14px;
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

.results-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.business-card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.business-header {
  padding: 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e0e0e0;
}

.business-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.address, .phone {
  font-size: 14px;
  color: #666;
  margin: 0 0 6px 0;
}

.rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.stars {
  color: #d0d0d0;
  font-size: 14px;
}

.stars .filled {
  color: #f59e0b;
}

.review-count {
  font-size: 13px;
  color: #666;
}

.categories {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.category-tag {
  padding: 4px 10px;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 12px;
  font-size: 12px;
}

.reviewers-section {
  padding: 20px;
}

.reviewers-section h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 16px 0;
}

.reviewers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reviewer-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.reviewer-info {
  flex: 1;
}

.reviewer-name {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 14px;
}

.reviewer-location {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.reviewer-rating {
  font-size: 12px;
  color: #d0d0d0;
  margin-bottom: 8px;
}

.reviewer-rating .filled {
  color: #f59e0b;
}

.review-text {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
  margin: 0;
}

.reviewer-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 160px;
}

.enrich-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.enrich-btn:hover:not(:disabled) {
  background: #059669;
}

.enrich-btn:disabled {
  background: #86efac;
  cursor: not-allowed;
}

.enriched-data {
  text-align: right;
}

.enriched-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #dcfce7;
  color: #166534;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 8px;
}

.enriched-details p {
  font-size: 12px;
  color: #444;
  margin: 4px 0;
}

.enriched-details a {
  color: #2563eb;
  text-decoration: none;
}

.enriched-details a:hover {
  text-decoration: underline;
}

.likelihood {
  color: #888 !important;
  font-style: italic;
}

.no-match {
  font-size: 12px;
  color: #888;
  font-style: italic;
}

.log-panel {
  margin-top: 20px;
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #3d3d3d;
}

.log-header h3 {
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0;
}

.clear-log-btn {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid #555;
  border-radius: 4px;
  color: #999;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-log-btn:hover {
  background: #3d3d3d;
  border-color: #666;
  color: #ccc;
}

.log-content {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
}

.log-entry {
  display: flex;
  gap: 12px;
  padding: 4px 16px;
}

.log-time {
  color: #666;
  flex-shrink: 0;
}

.log-message {
  word-break: break-word;
}

.log-entry.info .log-message {
  color: #64b5f6;
}

.log-entry.success .log-message {
  color: #81c784;
}

.log-entry.warning .log-message {
  color: #ffb74d;
}

.log-entry.error .log-message {
  color: #e57373;
}

.log-content::-webkit-scrollbar {
  width: 8px;
}

.log-content::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.log-content::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: #666;
}

.reviewers-table-section {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.table-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.reviewer-count {
  font-size: 13px;
  color: #666;
}

.table-container {
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.reviewers-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.reviewers-table thead {
  background: #f8fafc;
}

.reviewers-table th {
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.reviewers-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.reviewers-table th.sortable:hover {
  background: #f1f5f9;
}

.sort-icon {
  margin-left: 6px;
  font-size: 10px;
  color: #6b7280;
}

.reviewers-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}

.reviewers-table tbody tr:nth-child(even) {
  background: #f9fafb;
}

.reviewers-table tbody tr:nth-child(odd) {
  background: #ffffff;
}

.reviewers-table tbody tr:hover {
  background: #f0f4ff;
}

.name-cell {
  font-weight: 500;
  color: #1a1a1a;
}

.rating-cell .star {
  color: #d1d5db;
  font-size: 12px;
}

.rating-cell .star.filled {
  color: #f59e0b;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.enriched {
  background: #dcfce7;
  color: #166534;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.table-enrich-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.table-enrich-btn:hover:not(:disabled) {
  background: #059669;
}

.table-enrich-btn:disabled {
  background: #86efac;
  cursor: not-allowed;
}

.enriched-check {
  color: #10b981;
  font-size: 16px;
  font-weight: bold;
}

@media (max-width: 1000px) {
  .scraper-content {
    grid-template-columns: 1fr;
  }
  
  .search-card {
    position: static;
  }
}
</style>
