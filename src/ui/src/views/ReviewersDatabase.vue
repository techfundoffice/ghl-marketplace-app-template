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
              <!-- GROUP 1: Yelp Data -->
              <th class="group-header" colspan="7">Yelp Data</th>
            </tr>
            <tr>
              <th @click="sortBy('businessName')" class="sortable">Yelp business name</th>
              <th @click="sortBy('reviewRating')" class="sortable">Yelp Review Stars</th>
              <th @click="sortBy('businessAddress')" class="sortable">Yelp Business Address</th>
              <th>Yelp Business Address 2</th>
              <th @click="sortBy('businessCity')" class="sortable">Yelp Business City</th>
              <th @click="sortBy('businessState')" class="sortable">Yelp Business State</th>
              <th>Yelp Business Zip Code</th>
              <!-- GROUP 2: Contact Info -->
              <th @click="sortBy('reviewerFirstName')" class="sortable">First Name</th>
              <th>Last Name</th>
              <th @click="sortBy('email')" class="sortable">Email</th>
              <th>Phone</th>
              <th>Date Of Birth</th>
              <th>Contact Source</th>
              <th>Contact Type</th>
              <th>Where did you hear about us?</th>
              <th>Discount Code</th>
              <!-- GROUP 3: Cat Boarding -->
              <th>voice ai cat room check-in date</th>
              <th>voice ai cat room check-out date</th>
              <th>Join Cat Boarding Wait List</th>
              <th>number of cats</th>
              <th>number of cat rooms</th>
              <th>Cat Name</th>
              <th>Cat Breed</th>
              <th>Cat Age</th>
              <!-- GROUP 4: Cloudbeds Reservation -->
              <th>Cloudbeds Reservation ID</th>
              <th>Cloudbeds Property ID</th>
              <th>Cloudbeds Reservation Status</th>
              <th>Cloudbeds Date Created</th>
              <th>Cloudbeds Date Modified</th>
              <th>Cloudbeds Guest ID</th>
              <!-- GROUP 5: Billing Address -->
              <th>Billing Address - Full Name</th>
              <th>Billing Address - Phone Number</th>
              <th>Billing Address - Full Address</th>
              <th>Billing Address - Country</th>
              <th>Billing Address - State</th>
              <th>Billing Address - Zip Code</th>
              <th>Billing Address - City</th>
              <!-- GROUP 6: Opportunity/CRM -->
              <th>Select Each Service:</th>
              <th>Opportunity Name</th>
              <th>Pipeline</th>
              <th>Stage</th>
              <th>Status</th>
              <th>Lead Value</th>
              <th>Opportunity Owner</th>
              <th>Opportunity Source</th>
              <th>Lost Reason</th>
              <th>Meeting Notes</th>
              <!-- GROUP 7: Pet/Grooming -->
              <th>Hair Type</th>
              <th>Hair Color</th>
              <th>Pet Name</th>
              <th>Pet Breed</th>
              <th>Pet Weight</th>
              <th>Pet Birthday</th>
              <th>Veterinary Clinic</th>
              <th>Select Your Level Of Grooming Service</th>
              <th>Add-On Services (optional)</th>
              <th>Additional Comments (optional)</th>
              <th>Day of Week</th>
              <th>What time of day is best for you?</th>
              <th>Choose Your Booking Type</th>
              <th>Notes to the Groomer:</th>
              <th>Does your cat need sedation</th>
              <!-- GROUP 8: Cloudbeds Guest -->
              <th>Cloudbeds Guest Cell Phone</th>
              <th>Cloudbeds Guest Address1</th>
              <th>Cloudbeds Guest Address2</th>
              <th>Cloudbeds Guest City</th>
              <th>Cloudbeds Guest State</th>
              <th>Cloudbeds Guest Country</th>
              <th>Cloudbeds Guest Zip</th>
              <th>Cloudbeds Guest Birth Date</th>
              <th>Cloudbeds Guest Document Type</th>
              <th>Cloudbeds Guest Document Number</th>
              <th>Cloudbeds Guest Document Issue Date</th>
              <th>Cloudbeds Guest Document Issue Country</th>
              <th>Cloudbeds Guest Document Expiration Date</th>
              <th>Cloudbeds Sub Reservation ID</th>
              <th>Cloudbeds Start Date</th>
              <th>Cloudbeds End Date</th>
              <th>Cloudbeds Assigned Room</th>
              <th>Cloudbeds Room ID</th>
              <th>Cloudbeds Room Name</th>
              <th>Cloudbeds Room Type Name</th>
              <th>Cloudbeds Is Main Guest</th>
              <th>Cloudbeds Estimated Arrival Time</th>
              <th>Cloudbeds Guest Opt In</th>
              <!-- GROUP 9: Business Info -->
              <th>Company Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Website</th>
              <th>Address</th>
              <th>State</th>
              <th>City</th>
              <th>Description</th>
              <th>Postal Code</th>
              <th>Country</th>
              <th>Select From Below</th>
              <th>Business Name</th>
              <th>Street Address</th>
              <th>Time Zone</th>
              <!-- Actions -->
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(reviewer, index) in sortedReviewers" :key="reviewer.reviewerId + '-' + index" :class="{ 'zebra-odd': index % 2 === 1 }">
              <!-- GROUP 1: Yelp Data (7 columns) -->
              <td class="name-cell">{{ reviewer.businessName || '-' }}</td>
              <td class="rating-cell">
                <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= reviewer.reviewRating }">★</span>
              </td>
              <td>{{ reviewer.businessAddress || reviewer.address || '-' }}</td>
              <td>-</td>
              <td>{{ reviewer.businessCity || reviewer.city || '-' }}</td>
              <td>{{ reviewer.businessState || reviewer.state || '-' }}</td>
              <td>{{ reviewer.businessZip || reviewer.zip || '-' }}</td>
              <!-- GROUP 2: Contact Info (9 columns) -->
              <td>{{ reviewer.reviewerFirstName || '-' }}</td>
              <td>{{ reviewer.reviewerLastName || reviewer.reviewerLastInitial || '-' }}</td>
              <td>{{ reviewer.email || '-' }}</td>
              <td>{{ reviewer.phone || '-' }}</td>
              <td>-</td>
              <td>Yelp Review</td>
              <td>Lead</td>
              <td>Yelp</td>
              <td>-</td>
              <!-- GROUP 3: Cat Boarding (8 columns) -->
              <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
              <!-- GROUP 4: Cloudbeds Reservation (6 columns) -->
              <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
              <!-- GROUP 5: Billing Address (7 columns) -->
              <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
              <!-- GROUP 6: Opportunity/CRM (10 columns) -->
              <td>-</td>
              <td>{{ reviewer.reviewerFirstName || 'Lead' }} - {{ reviewer.businessName || 'Yelp' }}</td>
              <td>Yelp Reviews</td>
              <td>New Lead</td>
              <td>Open</td>
              <td>-</td>
              <td>-</td>
              <td>Yelp</td>
              <td>-</td>
              <td class="notes-cell">{{ (reviewer.reviewText || '').substring(0, 100) }}{{ (reviewer.reviewText || '').length > 100 ? '...' : '' }}</td>
              <!-- GROUP 7: Pet/Grooming (15 columns) -->
              <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
              <!-- GROUP 8: Cloudbeds Guest (23 columns) -->
              <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
              <!-- GROUP 9: Business Info (14 columns) -->
              <td>{{ reviewer.company || '-' }}</td>
              <td>{{ reviewer.phone || '-' }}</td>
              <td>{{ reviewer.email || '-' }}</td>
              <td>{{ reviewer.businessUrl || '-' }}</td>
              <td>{{ reviewer.businessAddress || reviewer.address || '-' }}</td>
              <td>{{ reviewer.businessState || reviewer.state || '-' }}</td>
              <td>{{ reviewer.businessCity || reviewer.city || '-' }}</td>
              <td>-</td>
              <td>{{ reviewer.businessZip || reviewer.zip || '-' }}</td>
              <td>USA</td>
              <td>-</td>
              <td>{{ reviewer.businessName || '-' }}</td>
              <td>{{ reviewer.businessAddress || reviewer.address || '-' }}</td>
              <td>-</td>
              <!-- Actions -->
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
      // All 96 column headers
      const headers = [
        'Yelp business name', 'Yelp Review Stars', 'Yelp Business Address', 'Yelp Business Address 2',
        'Yelp Business City', 'Yelp Business State', 'Yelp Business Zip Code',
        'First Name', 'Last Name', 'Email', 'Phone', 'Date Of Birth', 'Contact Source',
        'Contact Type', 'Where did you hear about us?', 'Discount Code',
        'voice ai cat room check-in date', 'voice ai cat room check-out date', 'Join Cat Boarding Wait List',
        'number of cats', 'number of cat rooms', 'Cat Name', 'Cat Breed', 'Cat Age',
        'Cloudbeds Reservation ID', 'Cloudbeds Property ID', 'Cloudbeds Reservation Status',
        'Cloudbeds Date Created', 'Cloudbeds Date Modified', 'Cloudbeds Guest ID',
        'Billing Address - Full Name', 'Billing Address - Phone Number', 'Billing Address - Full Address',
        'Billing Address - Country', 'Billing Address - State', 'Billing Address - Zip Code', 'Billing Address - City',
        'Select Each Service:', 'Opportunity Name', 'Pipeline', 'Stage', 'Status', 'Lead Value',
        'Opportunity Owner', 'Opportunity Source', 'Lost Reason', 'Meeting Notes',
        'Hair Type', 'Hair Color', 'Pet Name', 'Pet Breed', 'Pet Weight', 'Pet Birthday',
        'Veterinary Clinic', 'Select Your Level Of Grooming Service', 'Add-On Services (optional)',
        'Additional Comments (optional)', 'Day of Week', 'What time of day is best for you?',
        'Choose Your Booking Type', 'Notes to the Groomer:', 'Does your cat need sedation',
        'Cloudbeds Guest Cell Phone', 'Cloudbeds Guest Address1', 'Cloudbeds Guest Address2',
        'Cloudbeds Guest City', 'Cloudbeds Guest State', 'Cloudbeds Guest Country', 'Cloudbeds Guest Zip',
        'Cloudbeds Guest Birth Date', 'Cloudbeds Guest Document Type', 'Cloudbeds Guest Document Number',
        'Cloudbeds Guest Document Issue Date', 'Cloudbeds Guest Document Issue Country',
        'Cloudbeds Guest Document Expiration Date', 'Cloudbeds Sub Reservation ID', 'Cloudbeds Start Date',
        'Cloudbeds End Date', 'Cloudbeds Assigned Room', 'Cloudbeds Room ID', 'Cloudbeds Room Name',
        'Cloudbeds Room Type Name', 'Cloudbeds Is Main Guest', 'Cloudbeds Estimated Arrival Time',
        'Cloudbeds Guest Opt In', 'Company Name', 'Phone', 'Email', 'Website',
        'Address', 'State', 'City', 'Description', 'Postal Code', 'Country', 'Select From Below',
        'Business Name', 'Street Address', 'Time Zone'
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
        // Yelp Data
        escapeCSV(r.businessName), escapeCSV(r.reviewRating), escapeCSV(r.businessAddress || r.address), '',
        escapeCSV(r.businessCity || r.city), escapeCSV(r.businessState || r.state), escapeCSV(r.businessZip || r.zip),
        // Contact Info
        escapeCSV(r.reviewerFirstName), escapeCSV(r.reviewerLastName || r.reviewerLastInitial),
        escapeCSV(r.email), escapeCSV(r.phone), '', 'Yelp Review', 'Lead', 'Yelp', '',
        // Cat Boarding (8 empty)
        '', '', '', '', '', '', '', '',
        // Cloudbeds Reservation (6 empty)
        '', '', '', '', '', '',
        // Billing Address (7 empty)
        '', '', '', '', '', '', '',
        // Opportunity/CRM
        '', `${r.reviewerFirstName || 'Lead'} - ${r.businessName || 'Yelp'}`, 'Yelp Reviews', 'New Lead', 'Open',
        '', '', 'Yelp', '', escapeCSV(r.reviewText),
        // Pet/Grooming (15 empty)
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        // Cloudbeds Guest (23 empty)
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        // Business Info
        escapeCSV(r.company), escapeCSV(r.phone), escapeCSV(r.email), escapeCSV(r.businessUrl),
        escapeCSV(r.businessAddress || r.address), escapeCSV(r.businessState || r.state),
        escapeCSV(r.businessCity || r.city), '', escapeCSV(r.businessZip || r.zip), 'USA', '',
        escapeCSV(r.businessName), escapeCSV(r.businessAddress || r.address), ''
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      this.downloadFile(csvContent, 'club_cat_crm_export.csv', 'text/csv');
    },

    exportExcel() {
      // All 96 column headers
      const headers = [
        'Yelp business name', 'Yelp Review Stars', 'Yelp Business Address', 'Yelp Business Address 2',
        'Yelp Business City', 'Yelp Business State', 'Yelp Business Zip Code',
        'First Name', 'Last Name', 'Email', 'Phone', 'Date Of Birth', 'Contact Source',
        'Contact Type', 'Where did you hear about us?', 'Discount Code',
        'voice ai cat room check-in date', 'voice ai cat room check-out date', 'Join Cat Boarding Wait List',
        'number of cats', 'number of cat rooms', 'Cat Name', 'Cat Breed', 'Cat Age',
        'Cloudbeds Reservation ID', 'Cloudbeds Property ID', 'Cloudbeds Reservation Status',
        'Cloudbeds Date Created', 'Cloudbeds Date Modified', 'Cloudbeds Guest ID',
        'Billing Address - Full Name', 'Billing Address - Phone Number', 'Billing Address - Full Address',
        'Billing Address - Country', 'Billing Address - State', 'Billing Address - Zip Code', 'Billing Address - City',
        'Select Each Service:', 'Opportunity Name', 'Pipeline', 'Stage', 'Status', 'Lead Value',
        'Opportunity Owner', 'Opportunity Source', 'Lost Reason', 'Meeting Notes',
        'Hair Type', 'Hair Color', 'Pet Name', 'Pet Breed', 'Pet Weight', 'Pet Birthday',
        'Veterinary Clinic', 'Select Your Level Of Grooming Service', 'Add-On Services (optional)',
        'Additional Comments (optional)', 'Day of Week', 'What time of day is best for you?',
        'Choose Your Booking Type', 'Notes to the Groomer:', 'Does your cat need sedation',
        'Cloudbeds Guest Cell Phone', 'Cloudbeds Guest Address1', 'Cloudbeds Guest Address2',
        'Cloudbeds Guest City', 'Cloudbeds Guest State', 'Cloudbeds Guest Country', 'Cloudbeds Guest Zip',
        'Cloudbeds Guest Birth Date', 'Cloudbeds Guest Document Type', 'Cloudbeds Guest Document Number',
        'Cloudbeds Guest Document Issue Date', 'Cloudbeds Guest Document Issue Country',
        'Cloudbeds Guest Document Expiration Date', 'Cloudbeds Sub Reservation ID', 'Cloudbeds Start Date',
        'Cloudbeds End Date', 'Cloudbeds Assigned Room', 'Cloudbeds Room ID', 'Cloudbeds Room Name',
        'Cloudbeds Room Type Name', 'Cloudbeds Is Main Guest', 'Cloudbeds Estimated Arrival Time',
        'Cloudbeds Guest Opt In', 'Company Name', 'Phone', 'Email', 'Website',
        'Address', 'State', 'City', 'Description', 'Postal Code', 'Country', 'Select From Below',
        'Business Name', 'Street Address', 'Time Zone'
      ];

      const escapeTab = (val) => {
        if (val === null || val === undefined) return '';
        return String(val).replace(/\t/g, ' ').replace(/\n/g, ' ');
      };

      const rows = this.sortedReviewers.map(r => [
        // Yelp Data
        escapeTab(r.businessName), escapeTab(r.reviewRating), escapeTab(r.businessAddress || r.address), '',
        escapeTab(r.businessCity || r.city), escapeTab(r.businessState || r.state), escapeTab(r.businessZip || r.zip),
        // Contact Info
        escapeTab(r.reviewerFirstName), escapeTab(r.reviewerLastName || r.reviewerLastInitial),
        escapeTab(r.email), escapeTab(r.phone), '', 'Yelp Review', 'Lead', 'Yelp', '',
        // Cat Boarding (8 empty)
        '', '', '', '', '', '', '', '',
        // Cloudbeds Reservation (6 empty)
        '', '', '', '', '', '',
        // Billing Address (7 empty)
        '', '', '', '', '', '', '',
        // Opportunity/CRM
        '', `${r.reviewerFirstName || 'Lead'} - ${r.businessName || 'Yelp'}`, 'Yelp Reviews', 'New Lead', 'Open',
        '', '', 'Yelp', '', escapeTab(r.reviewText),
        // Pet/Grooming (15 empty)
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        // Cloudbeds Guest (23 empty)
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        // Business Info
        escapeTab(r.company), escapeTab(r.phone), escapeTab(r.email), escapeTab(r.businessUrl),
        escapeTab(r.businessAddress || r.address), escapeTab(r.businessState || r.state),
        escapeTab(r.businessCity || r.city), '', escapeTab(r.businessZip || r.zip), 'USA', '',
        escapeTab(r.businessName), escapeTab(r.businessAddress || r.address), ''
      ].join('\t'));

      const xlsContent = [headers.join('\t'), ...rows].join('\n');
      this.downloadFile(xlsContent, 'club_cat_crm_export.xls', 'application/vnd.ms-excel');
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

.group-header {
  background: #1e40af !important;
  color: white !important;
  text-align: center;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.notes-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
