<template>
  <div class="reviewers-database">
    <div class="page-header">
      <h1>Reviewers Database</h1>
      <p class="subtitle">View all reviewers with business, review, and enrichment data</p>
    </div>

    <div class="content-section">
      <div class="results-header">
        <div class="header-left">
          <h2>All Reviewers</h2>
          <span class="result-count">{{ reviewers.length }} reviewers total</span>
        </div>
        <div class="export-buttons">
          <button class="export-btn csv" @click="exportCSV" :disabled="reviewers.length === 0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export CSV
          </button>
          <button class="export-btn excel" @click="exportExcel" :disabled="reviewers.length === 0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Excel
          </button>
        </div>
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
              <th @click="sortBy('businessName')" class="sortable">
                Business Name
                <span v-if="sortColumn === 'businessName'" class="sort-icon">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortBy('address')" class="sortable">
                Address
                <span v-if="sortColumn === 'address'" class="sort-icon">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortBy('city')" class="sortable">
                City
                <span v-if="sortColumn === 'city'" class="sort-icon">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortBy('state')" class="sortable">
                State
                <span v-if="sortColumn === 'state'" class="sort-icon">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortBy('zip')" class="sortable">
                Zip
                <span v-if="sortColumn === 'zip'" class="sort-icon">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortBy('reviewRating')" class="sortable">
                Stars
                <span v-if="sortColumn === 'reviewRating'" class="sort-icon">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th @click="sortBy('reviewerFirstName')" class="sortable">
                First Name
                <span v-if="sortColumn === 'reviewerFirstName'" class="sort-icon">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th>Last Init.</th>
              <th>Last Name</th>
              <th @click="sortBy('email')" class="sortable">
                Email
                <span v-if="sortColumn === 'email'" class="sort-icon">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th>Phone</th>
              <th>LinkedIn</th>
              <th>Facebook</th>
              <th>Instagram</th>
              <th>WhatsApp</th>
              <th>Twitter</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(reviewer, index) in sortedReviewers" :key="reviewer.reviewerId + '-' + index" :class="{ 'zebra-odd': index % 2 === 1 }">
              <td class="name-cell">{{ reviewer.businessName || '-' }}</td>
              <td>{{ reviewer.address || '-' }}</td>
              <td>{{ reviewer.city || '-' }}</td>
              <td>{{ reviewer.state || '-' }}</td>
              <td>{{ reviewer.zip || '-' }}</td>
              <td class="rating-cell">
                <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= reviewer.reviewRating }">★</span>
              </td>
              <td>{{ reviewer.reviewerFirstName || '-' }}</td>
              <td>{{ reviewer.reviewerLastInitial || '-' }}</td>
              <td>{{ reviewer.reviewerLastName || '-' }}</td>
              <td>{{ reviewer.email || '-' }}</td>
              <td>{{ reviewer.phone || '-' }}</td>
              <td>
                <a v-if="reviewer.linkedin" :href="reviewer.linkedin" target="_blank" class="social-link">View</a>
                <span v-else>-</span>
              </td>
              <td>
                <a v-if="reviewer.facebook" :href="reviewer.facebook" target="_blank" class="social-link">View</a>
                <span v-else>-</span>
              </td>
              <td>
                <a v-if="reviewer.instagram" :href="reviewer.instagram" target="_blank" class="social-link">View</a>
                <span v-else>-</span>
              </td>
              <td>{{ reviewer.whatsapp || '-' }}</td>
              <td>
                <a v-if="reviewer.twitter" :href="reviewer.twitter" target="_blank" class="social-link">View</a>
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
                  {{ reviewer.enriching ? '...' : 'Enrich' }}
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
      error: null,
      sortColumn: 'businessName',
      sortDirection: 'asc'
    }
  },
  computed: {
    sortedReviewers() {
      if (!this.sortColumn) return this.reviewers;
      
      return [...this.reviewers].sort((a, b) => {
        let aVal = a[this.sortColumn] || '';
        let bVal = b[this.sortColumn] || '';
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return this.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        
        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  },
  mounted() {
    this.fetchReviewers();
  },
  methods: {
    sortBy(column) {
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }
    },

    async fetchReviewers() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch('/api/reviewers-full');
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
      const index = this.reviewers.findIndex(r => r.reviewerId === reviewer.reviewerId);
      if (index === -1) return;

      this.reviewers[index].enriching = true;

      try {
        const response = await fetch('/api/enrich-consumer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewerId: reviewer.reviewerId,
            name: `${reviewer.reviewerFirstName} ${reviewer.reviewerLastName || reviewer.reviewerLastInitial}`.trim(),
            location: `${reviewer.city}, ${reviewer.state}`.trim()
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
            linkedin: enrichment.linkedin || this.reviewers[index].linkedin,
            facebook: enrichment.facebook || this.reviewers[index].facebook,
            instagram: enrichment.instagram || this.reviewers[index].instagram,
            whatsapp: enrichment.whatsapp || this.reviewers[index].whatsapp,
            twitter: enrichment.twitter || this.reviewers[index].twitter
          };
        }
      } catch (err) {
        console.error('Enrich error:', err);
        this.error = err.message;
      } finally {
        this.reviewers[index].enriching = false;
      }
    },

    exportCSV() {
      const headers = [
        'Business Name', 'Address', 'City', 'State', 'Zip', 'Review Stars',
        'First Name', 'Last Initial', 'Last Name', 'Email', 'Phone',
        'LinkedIn', 'Facebook', 'Instagram', 'WhatsApp', 'Twitter'
      ];
      
      const escapeCSV = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const rows = this.sortedReviewers.map(r => [
        escapeCSV(r.businessName),
        escapeCSV(r.address),
        escapeCSV(r.city),
        escapeCSV(r.state),
        escapeCSV(r.zip),
        escapeCSV(r.reviewRating),
        escapeCSV(r.reviewerFirstName),
        escapeCSV(r.reviewerLastInitial),
        escapeCSV(r.reviewerLastName),
        escapeCSV(r.email),
        escapeCSV(r.phone),
        escapeCSV(r.linkedin),
        escapeCSV(r.facebook),
        escapeCSV(r.instagram),
        escapeCSV(r.whatsapp),
        escapeCSV(r.twitter)
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      this.downloadFile(csvContent, 'reviewers_export.csv', 'text/csv');
    },

    exportExcel() {
      const headers = [
        'Business Name', 'Address', 'City', 'State', 'Zip', 'Review Stars',
        'First Name', 'Last Initial', 'Last Name', 'Email', 'Phone',
        'LinkedIn', 'Facebook', 'Instagram', 'WhatsApp', 'Twitter'
      ];

      const escapeTab = (val) => {
        if (val === null || val === undefined) return '';
        return String(val).replace(/\t/g, ' ').replace(/\n/g, ' ');
      };

      const rows = this.sortedReviewers.map(r => [
        escapeTab(r.businessName),
        escapeTab(r.address),
        escapeTab(r.city),
        escapeTab(r.state),
        escapeTab(r.zip),
        escapeTab(r.reviewRating),
        escapeTab(r.reviewerFirstName),
        escapeTab(r.reviewerLastInitial),
        escapeTab(r.reviewerLastName),
        escapeTab(r.email),
        escapeTab(r.phone),
        escapeTab(r.linkedin),
        escapeTab(r.facebook),
        escapeTab(r.instagram),
        escapeTab(r.whatsapp),
        escapeTab(r.twitter)
      ].join('\t'));

      const xlsContent = [headers.join('\t'), ...rows].join('\n');
      this.downloadFile(xlsContent, 'reviewers_export.xls', 'application/vnd.ms-excel');
    },

    downloadFile(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  }
}
</script>

<style scoped>
.reviewers-database {
  padding: 32px;
  max-width: 1800px;
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
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
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

.export-buttons {
  display: flex;
  gap: 12px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn.csv {
  background: #f0fdf4;
  color: #166534;
  border-color: #86efac;
}

.export-btn.csv:hover:not(:disabled) {
  background: #dcfce7;
}

.export-btn.excel {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #93c5fd;
}

.export-btn.excel:hover:not(:disabled) {
  background: #dbeafe;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  font-size: 13px;
}

.reviewers-table th,
.reviewers-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  white-space: nowrap;
}

.reviewers-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #444;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
}

.reviewers-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.reviewers-table th.sortable:hover {
  background: #f0f0f0;
}

.sort-icon {
  margin-left: 4px;
  font-size: 10px;
}

.reviewers-table tbody tr:hover {
  background: #f0f7ff;
}

.reviewers-table tbody tr.zebra-odd {
  background: #fafafa;
}

.reviewers-table tbody tr.zebra-odd:hover {
  background: #f0f7ff;
}

.name-cell {
  font-weight: 500;
  color: #1a1a1a;
}

.rating-cell {
  white-space: nowrap;
}

.star {
  color: #d1d5db;
  font-size: 14px;
}

.star.filled {
  color: #fbbf24;
}

.social-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.social-link:hover {
  text-decoration: underline;
}

.enrich-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
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
  width: 12px;
  height: 12px;
  border-width: 2px;
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: white;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1200px) {
  .reviewers-database {
    padding: 16px;
  }
  
  .reviewers-table th,
  .reviewers-table td {
    padding: 8px 10px;
    font-size: 12px;
  }
}
</style>
