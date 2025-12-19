# GitHub Speckit: Yelp Scraper 96-Column Spreadsheet Implementation

## Overview
Inject all 96 field names as spreadsheet column headers into the Yelp Scraper page and populate with existing database data.

## Problem Statement
The current YelpScraper.vue has only 11 AG Grid columns and ReviewersDatabase.vue has 17 columns. User requires all 96 field names as column headers with data populated from existing database.

## Field Mapping

### Group 1: Yelp Business Data (8 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Yelp business name | `businessName` | Available |
| Yelp Review Stars | `reviewRating` | Available |
| Yelp Business Address | `businessAddress` | Available |
| Yelp Business Address 2 | - | Empty |
| Yelp Business City | `businessCity` | Available |
| Yelp Business State | `businessState` | Available |
| Yelp Business Zip Code | `businessZip` | Available |

### Group 2: Contact Information (6 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| First Name | `reviewerFirstName` | Available |
| Last Name | `reviewerLastName` | Available |
| Email | `email` | From enrichment |
| Phone | `phone` | From enrichment |
| Date Of Birth | - | Empty |
| Contact Source | 'Yelp Review' | Static value |

### Group 3: Contact Metadata (3 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Contact Type | 'Lead' | Static value |
| Where did you hear about us? | 'Yelp' | Static value |
| Discount Code | - | Empty |

### Group 4: Voice AI Cat Room (5 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| voice ai cat room check-in date | - | Empty |
| voice ai cat room check-out date | - | Empty |
| Join Cat Boarding Wait List | - | Empty |
| number of cats | - | Empty |
| number of cat rooms | - | Empty |

### Group 5: Cat Information (3 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Cat Name | - | Empty |
| Cat Breed | - | Empty |
| Cat Age | - | Empty |

### Group 6: Cloudbeds Reservation (10 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Cloudbeds Reservation ID | - | Empty |
| Cloudbeds Property ID | - | Empty |
| Cloudbeds Reservation Status | - | Empty |
| Cloudbeds Date Created | - | Empty |
| Cloudbeds Date Modified | - | Empty |
| Cloudbeds Guest ID | - | Empty |
| Cloudbeds Sub Reservation ID | - | Empty |
| Cloudbeds Start Date | - | Empty |
| Cloudbeds End Date | - | Empty |
| Cloudbeds Assigned Room | - | Empty |

### Group 7: Billing Address (6 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Billing Address - Full Name | - | Empty |
| Billing Address - Phone Number | - | Empty |
| Billing Address - Full Address | - | Empty |
| Billing Address - Country | - | Empty |
| Billing Address - State | - | Empty |
| Billing Address - Zip Code | - | Empty |
| Billing Address - City | - | Empty |

### Group 8: Services (1 field)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Select Each Service: | - | Empty |

### Group 9: Opportunity/CRM (10 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Opportunity Name | `reviewerFirstName + businessName` | Derived |
| Pipeline | 'Yelp Reviews' | Static value |
| Stage | 'New Lead' | Static value |
| Status | 'Open' | Static value |
| Lead Value | - | Empty |
| Opportunity Owner | - | Empty |
| Opportunity Source | 'Yelp' | Static value |
| Lost Reason | - | Empty |
| Meeting Notes | `reviewText` | From review |

### Group 10: Personal Attributes (2 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Hair Type | - | Empty |
| Hair Color | - | Empty |

### Group 11: Pet Information (5 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Pet Name | - | Empty |
| Pet Breed | - | Empty |
| Pet Weight | - | Empty |
| Pet Birthday | - | Empty |
| Veterinary Clinic | - | Empty |

### Group 12: Grooming Services (6 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Select Your Level Of Grooming Service | - | Empty |
| Add-On Services (optional) | - | Empty |
| Additional Comments (optional) | - | Empty |
| Day of Week | - | Empty |
| What time of day is best for you? | - | Empty |
| Choose Your Booking Type | - | Empty |

### Group 13: Grooming Notes (2 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Notes to the Groomer: | - | Empty |
| Does your cat need sedation | - | Empty |

### Group 14: Cloudbeds Guest Info (12 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Cloudbeds Guest Cell Phone | - | Empty |
| Cloudbeds Guest Address1 | - | Empty |
| Cloudbeds Guest Address2 | - | Empty |
| Cloudbeds Guest City | - | Empty |
| Cloudbeds Guest State | - | Empty |
| Cloudbeds Guest Country | - | Empty |
| Cloudbeds Guest Zip | - | Empty |
| Cloudbeds Guest Birth Date | - | Empty |
| Cloudbeds Guest Document Type | - | Empty |
| Cloudbeds Guest Document Number | - | Empty |
| Cloudbeds Guest Document Issue Date | - | Empty |
| Cloudbeds Guest Document Issue Country | - | Empty |
| Cloudbeds Guest Document Expiration Date | - | Empty |

### Group 15: Cloudbeds Room Info (7 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Cloudbeds Room ID | - | Empty |
| Cloudbeds Room Name | - | Empty |
| Cloudbeds Room Type Name | - | Empty |
| Cloudbeds Is Main Guest | - | Empty |
| Cloudbeds Estimated Arrival Time | - | Empty |
| Cloudbeds Guest Opt In | - | Empty |

### Group 16: Company/Business Info (12 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Company Name | `company` | From enrichment |
| Phone (Company) | `phone` | From enrichment |
| Email (Company) | `email` | From enrichment |
| Website | - | Empty |
| Address | `businessAddress` | Available |
| State | `businessState` | Available |
| City | `businessCity` | Available |
| Description | - | Empty |
| Postal Code | `businessZip` | Available |
| Country | 'USA' | Static value |
| Select From Below | - | Empty |
| Time Zone | - | Empty |

### Group 17: Business Location (6 fields)
| Field Name | DB Source | Notes |
|------------|-----------|-------|
| Business Name | `businessName` | Available |
| Street Address | `businessAddress` | Available |
| City (Business) | `businessCity` | Available |
| Country (Business) | 'USA' | Static value |
| State (Business) | `businessState` | Available |
| Postal Code (Business) | `businessZip` | Available |
| Website (Business) | `businessUrl` | Available |

## Implementation Steps

### Step 1: Create Column Definitions Array
Generate all 96 column definitions with proper field names, widths, and data mappings.

### Step 2: Update YelpScraper.vue
Replace the 11-column `columnDefs` array with the full 96-column definition.

### Step 3: Update gridRowData Mapping
Extend the computed property to map all 96 fields from database data.

### Step 4: Update API Endpoint
Ensure `/api/reviewers-full` returns all required fields.

### Step 5: Test and Verify
Confirm all columns display with correct data mapping.

## Success Criteria
- All 96 column headers visible in AG Grid
- Existing Yelp data populates relevant columns
- Empty columns display properly with '-' placeholder
- Export to CSV includes all 96 columns
- Sorting and filtering work on all columns

## Technical Notes
- Using AG Grid Vue 3 component
- Column groups for better organization
- Responsive column widths
- Horizontal scroll for full view
