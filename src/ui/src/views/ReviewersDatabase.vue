<template>
  <div class="reviewers-database">
    <div class="page-header">
      <h1>Reviewers Database</h1>
      <p class="subtitle">View all reviewers and their enrichment status</p>
    </div>

    <div class="content-section">
      <div class="results-header">
        <h2>All Reviewers</h2>
        <span class="result-count">{{ reviewers.length }} reviewers total</span>
      </div>

      <div v-if="isLoading" class="loading-state">
        <span class="spinner"></span>
        <p>Loading reviewers...</p>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="!isLoading && reviewers.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <p>No reviewers found in the database</p>
      </div>

      <div v-if="!isLoading && reviewers.length > 0" class="table-container">
        <table class="reviewers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Enrichment Status</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>LinkedIn</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reviewer in reviewers" :key="reviewer.id">
              <td class="name-cell">{{ reviewer.name || 'Anonymous' }}</td>
              <td>{{ reviewer.location || '-' }}</td>
              <td>
                <span v-if="reviewer.isEnriched" class="badge badge-enriched">Enriched</span>
                <span v-else class="badge badge-pending">Pending</span>
              </td>
              <td>{{ reviewer.email || '-' }}</td>
              <td>{{ reviewer.phone || '-' }}</td>
              <td>{{ reviewer.company || '-' }}</td>
              <td>
                <a v-if="reviewer.linkedin" :href="reviewer.linkedin" target="_blank" class="linkedin-link">
                  View Profile
                </a>
                <span v-else>-</span>
              </td>
              <td>
                <button 
                  v-if="!reviewer.isEnriched"
                  class="enrich-btn"
                  @click="enrichReviewer(reviewer)"
                  :disabled="reviewer.enriching"
                >
                  <span v-if="reviewer.enriching" class="spinner small"></span>
                  {{ reviewer.enriching ? 'Enriching...' : 'Enrich' }}
                </button>
                <span v-else class="enriched-text">✓</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReviewersDatabase',
  data() {
    return {
      reviewers: [],
      isLoading: false,
      error: null
    }
  },
  mounted() {
    this.fetchReviewers();
  },
  methods: {
    async fetchReviewers() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch('/api/reviewers');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch reviewers');
        }

        this.reviewers = (data.reviewers || []).map(r => ({
          ...r,
          enriching: false
        }));
      } catch (err) {
        this.error = err.message;
        console.error('Fetch error:', err);
      } finally {
        this.isLoading = false;
      }
    },

    async enrichReviewer(reviewer) {
      const index = this.reviewers.findIndex(r => r.id === reviewer.id);
      if (index === -1) return;

      this.reviewers[index].enriching = true;

      try {
        const response = await fetch('/api/enrich-consumer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewerId: reviewer.yelpId || reviewer.id,
            name: reviewer.name,
            location: reviewer.location
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to enrich reviewer');
        }

        const enrichment = data.enrichment || data;
        if (enrichment.success !== false) {
          this.reviewers[index] = {
            ...this.reviewers[index],
            isEnriched: true,
            email: enrichment.email || this.reviewers[index].email,
            phone: enrichment.phone || this.reviewers[index].phone,
            company: enrichment.company || this.reviewers[index].company,
            linkedin: enrichment.linkedin || this.reviewers[index].linkedin
          };
        }
      } catch (err) {
        console.error('Enrich error:', err);
        this.error = err.message;
      } finally {
        this.reviewers[index].enriching = false;
      }
    }
  }
}
</script>

<style scoped>
.reviewers-database {
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

.content-section {
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.loading-state p {
  margin-top: 16px;
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

.table-container {
  overflow-x: auto;
}

.reviewers-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.reviewers-table th,
.reviewers-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.reviewers-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #444;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reviewers-table tbody tr:hover {
  background: #f9fafb;
}

.name-cell {
  font-weight: 500;
  color: #1a1a1a;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-enriched {
  background: #dcfce7;
  color: #166534;
}

.badge-pending {
  background: #f3f4f6;
  color: #6b7280;
}

.linkedin-link {
  color: #2563eb;
  text-decoration: none;
}

.linkedin-link:hover {
  text-decoration: underline;
}

.enrich-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
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

.enriched-text {
  color: #10b981;
  font-weight: 600;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(37, 99, 235, 0.3);
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner.small {
  width: 14px;
  height: 14px;
  border-width: 2px;
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: white;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1000px) {
  .reviewers-database {
    padding: 16px;
  }
  
  .reviewers-table th,
  .reviewers-table td {
    padding: 8px 12px;
  }
}
</style>
