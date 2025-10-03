# GoHighLevel Marketplace App Template

## Overview
This is a GoHighLevel (GHL) Marketplace App template that demonstrates how to build an integrated application with the GHL API. The project includes both backend API functionality and a Vue.js frontend interface.

**Current Status**: Fully configured and running on Replit with Settings page
**Last Updated**: October 3, 2025

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
- **Framework**: Vue 3 with Vue Router
- **Main View**: Settings page with sidebar navigation

The frontend is a built static application served by the Express backend.

#### Settings Page Structure
The Settings page (`src/ui/src/views/Settings.vue`) includes:
- **MY BUSINESS** section: Business Profile, My Profile, Billing, My Staff, Opportunities & Pipelines
- **BUSINESS SERVICES** section: Automation, Calendars, Conversation AI (New), Knowledge Base (New), Voice AI Agents, Email Services, Phone Numbers, WhatsApp
- **OTHER SETTINGS** section: Objects (New), Custom Fields, Custom Values, Manage Scoring, Domains & URL Redirects, Integrations, Private Integrations, Conversation Providers, Tags, Labs (New), Audit Logs, Brand Boards (New)

All 25 settings sections have placeholder components in `src/ui/src/components/settings/`.

## Key Routes

### Frontend Routes (Vue Router)
- `/` - Redirects to `/settings`
- `/settings` - Settings page with sidebar navigation
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
- October 2, 2025: Initial setup for Replit environment
  - Updated port configuration to 5000 with 0.0.0.0 binding
  - Configured Vue dev server to allow all hosts for Replit proxy
  - Set up deployment configuration for autoscale
  - Configured workflow to run on port 5000
