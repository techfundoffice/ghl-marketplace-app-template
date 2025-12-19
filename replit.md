# GoHighLevel Marketplace App Template

## Overview
This is a GoHighLevel (GHL) Marketplace App template that demonstrates how to build an integrated application with the GHL API. The project includes both backend API functionality and a Vue.js frontend interface with a professional dashboard, settings pages, and a Yelp Scraper for building a database of competitor reviewers.

**Current Status**: Fully configured and running on Replit with Dashboard, Settings (GHL-themed), Yelp Scraper, and Reviewers Database pages
**Last Updated**: December 19, 2025

## Project Architecture

### Backend (Express.js + TypeScript)
- **Location**: `/src` directory
- **Main Entry**: `src/index.ts`
- **Port**: 5000 (bound to 0.0.0.0 for Replit)
- **Build Output**: `/dist/src` directory
- **Database**: PostgreSQL via Drizzle ORM

The backend provides:
- OAuth authorization handling for GHL
- Example API endpoints for making requests to GHL API
- SSO decryption functionality
- Webhook handling
- Yelp scraping via Apify with database persistence
- Consumer enrichment via People Data Labs with caching
- Static file serving for the Vue frontend

### Database (PostgreSQL + Drizzle ORM)
- **Schema**: `shared/schema.ts`
- **Connection**: `server/db.ts`
- **Config**: `drizzle.config.ts`

Database Tables:
- `businesses` - Scraped Yelp businesses with yelpId, name, address, rating, etc.
- `reviewers` - Individual reviewers with name, location, yelpUserId
- `reviews` - Reviews linking businesses to reviewers with rating, text, date
- `enrichments` - Cached People Data Labs enrichment results (email, phone, company, LinkedIn)

### Frontend (Vue 3)
- **Location**: `/src/ui` directory
- **Build Output**: `/src/ui/dist` (copied to `/dist/src/ui/dist` during build)
- **Framework**: Vue 3 with Vue Router (HTML5 history mode)
- **Main Views**: Dashboard, Settings, Yelp Scraper, Reviewers Database
- **Layout**: Global sidebar navigation with main content area

The frontend is a built static application served by the Express backend.

#### Yelp Scraper Page
The Yelp Scraper page (`src/ui/src/views/YelpScraper.vue`) allows users to:
- Enter a direct Yelp business URL OR search by category/location
- Toggle AI Mode for intelligent actor selection with automatic fallbacks
- Scrape businesses and their reviews via Apify actors
- View scraped businesses with ratings, categories, and reviewer info
- Reviewers Data Table showing all reviewers with sortable columns
- Enrich individual reviewers with contact data from People Data Labs
- Data is automatically persisted to PostgreSQL database

#### AI Orchestrator
The AI orchestrator (`src/ai-orchestrator.ts`) provides intelligent Apify actor management:
- Uses OpenRouter (Llama 3.3 70B) via Replit AI Integrations
- Automatically selects best Apify actor for the scraping task
- Falls back to alternative actors if primary actor fails
- Only uses pay-as-you-go Apify actors (no monthly subscriptions)
- Provides real-time logging of actor selection and fallback attempts

#### Reviewers Database Page
The Reviewers Database page (`src/ui/src/views/ReviewersDatabase.vue`) displays:
- All scraped reviewers from the database
- Enrichment status (Enriched/Pending badges)
- Contact information: email, phone, company, LinkedIn
- Button to enrich individual reviewers who haven't been enriched

## Key Routes

### Frontend Routes (Vue Router - HTML5 History Mode)
- `/` - Dashboard (main landing page)
- `/settings` - Settings page with dark navy GHL-themed sidebar
- `/settings/help-ghl-api` - Embedded GHL API documentation
- `/settings/*` - 22 nested routes for each settings section (My Profile, Company, Team, Billing, etc.)
- `/yelp-scraper` - Yelp Scraper page for finding competitors and enriching consumer data
- `/reviewers` - Reviewers Database showing all scraped reviewers with enrichment status

### Backend API Routes
- `/authorize-handler` - Handles GHL OAuth authorization
- `/example-api-call` - Example company-level API call
- `/example-api-call-location` - Example location-level API call
- `/example-webhook-handler` - Webhook endpoint
- `/decrypt-sso` - SSO decryption endpoint
- `/test-connection` - Health check showing configuration status
- `/get-contacts` - Direct API call to fetch contacts with token

#### Yelp Scraper API
- `POST /api/yelp-scrape` - Scrape Yelp businesses and save to database
  - Body: `{ directUrl?: string, searchTerms?: string, location?: string, searchLimit?: number }`
  - Uses epctex/yelp-scraper Apify actor with `includeReviews: true`
  - Deduplicates businesses by yelpId, reviewers by name+location
  - Returns saved businesses with reviews and reviewer database IDs

- `POST /api/yelp-scrape-ai` - AI-orchestrated Yelp scraping with automatic fallbacks
  - Body: `{ directUrl?: string, searchTerms?: string, location?: string, searchLimit?: number }`
  - Uses AI (OpenRouter Llama 3.3 70B) to select and manage Apify actors
  - Automatically falls back to alternative actors if primary fails
  - Returns saved businesses with logs of AI decisions and fallback attempts

- `POST /api/enrich-consumer` - Enrich reviewer with People Data Labs
  - Body: `{ reviewerId: number, name?: string, location?: string }`
  - Caches enrichment results in database (avoids duplicate API calls)
  - Returns enrichment data: email, phone, company, jobTitle, linkedin

- `GET /api/reviewers` - List all reviewers with enrichment status
  - Returns all reviewers with isEnriched flag and enrichment details

## Environment Variables

Required (configured via Replit Secrets):
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `APIFY_API_TOKEN` - Apify API token for Yelp scraping
- `PDL_API_KEY` - People Data Labs API key for consumer enrichment

Optional GHL Configuration:
- `GHL_APP_CLIENT_ID` - Your GHL app's client ID
- `GHL_APP_CLIENT_SECRET` - Your GHL app's client secret
- `GHL_APP_SSO_KEY` - Your GHL app's SSO key
- `GHL_API_DOMAIN` - Default: https://services.leadconnectorhq.com
- `PORT` - Server port (default: 5000)

## Build Process

The build process involves:
1. Compiling TypeScript backend (`npx tsc`) - outputs to `/dist/src/`
2. Installing UI dependencies and building Vue app (`npm run build-ui`)
3. Copying built UI assets to `/dist/src/ui/dist`

Commands:
- `npm run build` - Full build (TypeScript + Vue)
- `npm run build-ui` - Build Vue frontend only
- `npm run dev` - Development mode with hot reload
- `npm run db:push` - Push database schema changes

## Database Migrations

Using Drizzle ORM for database management:
- Schema is defined in `shared/schema.ts`
- Run `npm run db:push` to apply schema changes
- Never manually write SQL migrations

## Deployment

The project is configured for Replit deployment with:
- **Deployment Type**: Autoscale (stateless web application)
- **Build Command**: `npm install && npm run build`
- **Run Command**: `npm start`

## Dependencies

### Backend
- express - Web framework
- typescript - TypeScript compiler
- drizzle-orm - ORM for PostgreSQL
- drizzle-kit - Database migration toolkit
- pg - PostgreSQL client
- dotenv - Environment variable management
- axios - HTTP client for API calls
- crypto-js - Encryption/decryption utilities
- body-parser - Request body parsing
- apify-client - Apify client for Yelp scraping

### Frontend
- vue - Vue.js framework (v3)
- vue-router - Official router for Vue 3
- @vue/cli-service - Vue CLI tooling

## Recent Changes

### December 17, 2025: Database Persistence and Reviewers Database
- Added PostgreSQL database with Drizzle ORM
- Created normalized schema: businesses, reviewers, reviews, enrichments tables
- Switched from tri_angle/yelp-scraper to epctex/yelp-scraper (better review support)
- Updated /api/yelp-scrape to persist all data with deduplication
- Updated /api/enrich-consumer to cache results (prevents duplicate PDL API charges)
- Added /api/reviewers GET endpoint to list all reviewers with enrichment status
- Created ReviewersDatabase.vue page to view all scraped reviewers
- Added Reviewers Database link to sidebar navigation
- Fixed build output paths for proper deployment

### December 17, 2025: Initial Yelp Scraper
- Created YelpScraper.vue page for finding competitor businesses
- Added /api/yelp-scrape endpoint using Apify
- Added /api/enrich-consumer endpoint using People Data Labs
- Competitor URL field with direct Yelp business page support
- Results display shows businesses with ratings, categories, and reviewers
- "Enrich Consumer" button for each reviewer

### October 9, 2025: Dashboard and Navigation
- Created Dashboard.vue as main landing page
- Built Sidebar.vue with GHL-style navigation
- Switched to HTML5 history mode routing
- Settings page with 25 subsections

### October 2, 2025: Initial Replit Setup
- Port configuration to 5000 with 0.0.0.0 binding
- Vue dev server configured to allow all hosts
- Autoscale deployment configuration
