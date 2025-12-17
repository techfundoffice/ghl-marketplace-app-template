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
      error: null
    }
  },
  methods: {
    async scrapeYelp() {
      if (!this.directUrl && (!this.searchTerms || !this.location)) {
        this.error = 'Please enter a competitor URL or both business category and location';
        return;
      }

      this.isLoading = true;
      this.error = null;
      this.businesses = [];

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

        const response = await fetch('/api/yelp-scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to scrape Yelp');
        }

        this.businesses = data.businesses.map(b => ({
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
      } catch (err) {
        this.error = err.message;
        console.error('Scrape error:', err);
      } finally {
        this.isLoading = false;
      }
    },

    async enrichConsumer(review, businessId, reviewIdx) {
      const businessIndex = this.businesses.findIndex(b => b.id === businessId);
      if (businessIndex === -1) return;

      if (!review.reviewerId) {
        console.error('No reviewerId for this review');
        this.businesses[businessIndex].reviews[reviewIdx].enrichedData = { 
          success: false, 
          message: 'No reviewer ID available' 
        };
        return;
      }

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
      } catch (err) {
        console.error('Enrich error:', err);
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

@media (max-width: 1000px) {
  .scraper-content {
    grid-template-columns: 1fr;
  }
  
  .search-card {
    position: static;
  }
}
</style>
