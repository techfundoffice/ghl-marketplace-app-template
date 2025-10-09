# GoHighLevel Marketplace App Template

## Overview
This is a GoHighLevel (GHL) Marketplace App template that demonstrates how to build an integrated application with the GHL API. The project includes both backend API functionality and a Vue.js frontend interface with a professional dashboard and settings pages.

**Current Status**: Fully configured and running on Replit with Dashboard and Settings pages
**Last Updated**: October 9, 2025

## Project Architecture

### Backend (Express.js + TypeScript)
- **Location**: `/src` directory
- **Main Entry**: `src/index.ts`
- **Port**: 5000 (bound to 0.0.0.0 for Replit)
- **Build Output**: `/dist` directory

The backend provides:
- OAuth authorization handling for GHL
- Example API endpoints for making requests to GHL API
- SSO decryption functionality
- Webhook handling
- Static file serving for the Vue frontend

### Frontend (Vue 3)
- **Location**: `/src/ui` directory
- **Build Output**: `/src/ui/dist` (copied to `/dist/ui/dist` during build)
- **Framework**: Vue 3 with Vue Router (HTML5 history mode)
- **Main Views**: Dashboard (landing page) and Settings page
- **Layout**: Global sidebar navigation with main content area

The frontend is a built static application served by the Express backend.

#### Dashboard Page
The Dashboard page (`src/ui/src/views/Dashboard.vue`) is the main landing page featuring:
- Welcome header with subtitle
- 4 metric cards: Total Contacts, Opportunities, Revenue, Appointments (with growth indicators)
- Recent Activity feed showing latest events with color-coded status dots
- Quick Actions panel with buttons for common tasks (Add Contact, Schedule Meeting, Create Opportunity, Send Campaign)

#### Global Sidebar Navigation
The Sidebar component (`src/ui/src/components/Sidebar.vue`) provides GHL-style navigation with:
- App branding (GoHighLevel Marketplace App)
- Location selector showing Demo Location
- Search box with keyboard shortcut (⌘K)
- Main navigation items: Launchpad, Dashboard, Conversations, Calendars, Contacts, Opportunities, Payments, AI Agents, Marketing, Automation, Sites, Memberships, Media Storage, Reputation, Reporting, App Marketplace, AI Site Builder, Account Booster, Settings
- Active route highlighting

#### Settings Page Structure
The Settings page (`src/ui/src/views/Settings.vue`) includes:
- **MY BUSINESS** section: Business Profile, My Profile, Billing, My Staff, Opportunities & Pipelines
- **BUSINESS SERVICES** section: Automation, Calendars, Conversation AI (New), Knowledge Base (New), Voice AI Agents, Email Services, Phone Numbers, WhatsApp
- **OTHER SETTINGS** section: Objects (New), Custom Fields, Custom Values, Manage Scoring, Domains & URL Redirects, Integrations, Private Integrations, Conversation Providers, Tags, Labs (New), Audit Logs, Brand Boards (New)

All 25 settings sections have placeholder components in `src/ui/src/components/settings/`.

## Key Routes

### Frontend Routes (Vue Router - HTML5 History Mode)
- `/` - Dashboard (main landing page)
- `/launchpad`, `/conversations`, `/calendars`, etc. - Placeholder routes (currently show Dashboard)
- `/settings` - Settings page with sidebar navigation (redirects to `/settings/business-profile`)
- `/settings/*` - 25 nested routes for each settings section (e.g., `/settings/business-profile`, `/settings/integrations`)

### Backend API Routes
- `/authorize-handler` - Handles GHL OAuth authorization
- `/example-api-call` - Example company-level API call
- `/example-api-call-location` - Example location-level API call
- `/example-webhook-handler` - Webhook endpoint
- `/decrypt-sso` - SSO decryption endpoint

## Environment Variables

The following environment variables are required (configured via Replit Secrets):

- `GHL_APP_CLIENT_ID` - Your GHL app's client ID
- `GHL_APP_CLIENT_SECRET` - Your GHL app's client secret
- `GHL_APP_SSO_KEY` - Your GHL app's SSO key
- `GHL_API_DOMAIN` - Default: https://services.leadconnectorhq.com
- `PORT` - Server port (default: 5000)

## Build Process

The build process involves:
1. Compiling TypeScript backend (`npx tsc`)
2. Installing UI dependencies and building Vue app (`npm run build-ui`)
3. Copying built UI assets to dist directory

Command: `npm run build`

## Development

For development, you can use:
- `npm run dev` - Builds UI and runs backend with hot reload using ts-node-dev

## Deployment

The project is configured for Replit deployment with:
- **Deployment Type**: Autoscale (stateless web application)
- **Build Command**: `npm install && npm run build`
- **Run Command**: `npm start`

## Replit-Specific Configuration

### Vue Configuration
The Vue dev server is configured in `src/ui/vue.config.js` to allow all hosts (`allowedHosts: 'all`), which is required for Replit's proxy setup.

### Backend Configuration
The Express server binds to `0.0.0.0` instead of localhost to be accessible through Replit's infrastructure.

## Dependencies

### Backend
- express - Web framework
- typescript - TypeScript compiler
- dotenv - Environment variable management
- axios - HTTP client for API calls
- crypto-js - Encryption/decryption utilities
- body-parser - Request body parsing

### Frontend
- vue - Vue.js framework (v3)
- vue-router - Official router for Vue 3
- @vue/cli-service - Vue CLI tooling

## Recent Changes
- October 9, 2025: Added Dashboard page and global navigation
  - Created Dashboard.vue as main landing page with stats, activity feed, and quick actions
  - Built Sidebar.vue component with GHL-style navigation (17 menu items)
  - Updated App.vue to use sidebar + main content layout
  - Switched to HTML5 history mode routing (from hash mode) for cleaner URLs
  - Settings page now has nested routing with 25 subsections
  - Express server configured with catch-all route for SPA support
  
- October 2, 2025: Initial setup for Replit environment
  - Updated port configuration to 5000 with 0.0.0.0 binding
  - Configured Vue dev server to allow all hosts for Replit proxy
  - Set up deployment configuration for autoscale
  - Configured workflow to run on port 5000
