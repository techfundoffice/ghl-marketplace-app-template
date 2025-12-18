# Unified Yelp Review Scraping System

## Overview

This system provides a robust, fault-tolerant Yelp review scraping solution using **Bright Data as the primary provider** and **Apify as the automatic fallback**.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   UNIFIED YELP SCRAPER                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  API Request ──► /api/yelp-scrape-unified                        │
│                         │                                         │
│                         ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  PROVIDER SELECTION                          │ │
│  │                                                               │ │
│  │   preferredProvider: 'auto' | 'brightdata' | 'apify'         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                         │                                         │
│         ┌───────────────┴───────────────┐                        │
│         ▼                               ▼                        │
│  ┌─────────────────┐           ┌─────────────────┐               │
│  │   BRIGHT DATA   │           │     APIFY       │               │
│  │   (Primary)     │──failed──►│   (Fallback)    │               │
│  │                 │           │                 │               │
│  │  Methods:       │           │  Actors:        │               │
│  │  • Web Unlocker │           │  • yin/yelp     │               │
│  │  • Scraping     │           │  • tri_angle    │               │
│  │    Browser      │           │  • web_wanderer │               │
│  │  • MCP Tools    │           │                 │               │
│  └─────────────────┘           └─────────────────┘               │
│                         │                                         │
│                         ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              UNIFIED OUTPUT SCHEMA                           │ │
│  │                                                               │ │
│  │   { business, reviews[], provider, method, attempts[] }      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                         │                                         │
│                         ▼                                         │
│              Database Persistence (PostgreSQL)                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### 1. Unified Scraper (Recommended)

**POST `/api/yelp-scrape-unified`**

Uses Bright Data as primary, automatically falls back to Apify if needed.

```json
{
  "directUrl": "https://www.yelp.com/biz/club-cat-irvine",
  "reviewLimit": 10,
  "preferredProvider": "auto"
}
```

Or for search:

```json
{
  "searchTerms": "restaurants",
  "location": "San Francisco, CA",
  "searchLimit": 10,
  "reviewLimit": 5
}
```

**Response:**

```json
{
  "success": true,
  "provider": "brightdata",
  "method": "web_unlocker",
  "businesses": [{
    "yelpId": "club-cat-irvine",
    "name": "Club Cat",
    "rating": 4.5,
    "reviewCount": 120,
    "reviews": [{
      "yelpReviewId": "xyz123",
      "authorName": "John D.",
      "rating": 5,
      "text": "Amazing cat cafe!",
      "date": "2024-01-15"
    }]
  }],
  "attempts": [{
    "provider": "brightdata",
    "method": "web_unlocker",
    "status": "success",
    "message": "Scraped 10 reviews",
    "duration": 3500
  }],
  "logs": [...]
}
```

### 2. Health Check

**GET `/api/yelp-scraper-health`**

Check provider availability.

```json
{
  "success": true,
  "providers": {
    "brightdata": {
      "configured": true,
      "available": true,
      "message": "Connected as customer: cust_123"
    },
    "apify": {
      "configured": true,
      "available": true,
      "message": "Connected"
    }
  },
  "recommendation": "Use Bright Data for direct URLs, Apify for search queries"
}
```

### 3. Legacy Endpoints

- **POST `/api/yelp-scrape`** - Direct Apify scraping (older)
- **POST `/api/yelp-scrape-ai`** - AI-orchestrated Apify (older)

## Configuration

### Environment Variables

```bash
# Bright Data (Primary)
BRIGHTDATA_API_TOKEN=c308c84b-f123-4c12-89a7-9a2634018282
BRIGHTDATA_WEB_UNLOCKER_ZONE=mcp_unlocker
BRIGHTDATA_BROWSER_ZONE=mcp_browser
BRIGHTDATA_PRO_MODE=true

# Apify (Fallback)
APIFY_API_TOKEN=your_apify_token
```

### MCP Server Configuration

The Bright Data MCP server is configured in `~/.claude.json`:

```json
{
  "mcpServers": {
    "brightdata": {
      "type": "stdio",
      "command": "npx",
      "args": ["@brightdata/mcp"],
      "env": {
        "API_TOKEN": "your_token",
        "PRO_MODE": "true"
      }
    }
  }
}
```

### Doppler Integration

Secrets are managed via Doppler:

```bash
export DOPPLER_TOKEN="dp.st.prd.xxx"
doppler secrets get BRIGHTDATA_API_TOKEN --plain
```

## Bright Data Scraping Methods

### 1. Web Unlocker (Fastest)

- **Best for:** Simple pages, quick responses
- **Bypasses:** Anti-bot, CAPTCHAs, geo-restrictions
- **Timeout:** 60 seconds

```typescript
const result = await scraper.scrapeWithWebUnlocker({
  url: "https://www.yelp.com/biz/business-name",
  maxReviews: 10
});
```

### 2. Scraping Browser (Most Reliable)

- **Best for:** JavaScript-heavy pages, complex interactions
- **Features:** Full browser rendering, network interception
- **Timeout:** 120 seconds

```typescript
const result = await scraper.scrapeWithScrapingBrowser({
  url: "https://www.yelp.com/biz/business-name",
  maxReviews: 20
});
```

### 3. Scrape as Markdown (Simplest)

- **Best for:** Basic content extraction
- **Output:** Markdown format
- **Limitations:** Less structured data

## Apify Actors (Fallback)

When Bright Data fails, these actors are tried in order:

| Priority | Actor | Best For |
|----------|-------|----------|
| 1 | `yin/yelp-scraper` | Free, business + reviews |
| 2 | `tri_angle/yelp-scraper` | Search + direct URLs |
| 3 | `tri_angle/yelp-review-scraper` | Review-focused |
| 4 | `web_wanderer/yelp-reviews-scraper` | High volume |

## Failover Logic

```
1. Check Bright Data health
   ├── Healthy → Try Web Unlocker
   │   ├── Success → Return results
   │   └── Failed → Try Scraping Browser
   │       ├── Success → Return results
   │       └── Failed → Try Markdown scrape
   │           ├── Success → Return results
   │           └── Failed → Fall back to Apify
   └── Unhealthy → Skip to Apify

2. Apify fallback
   ├── Try yin/yelp-scraper
   ├── Try tri_angle/yelp-scraper
   ├── Try tri_angle/yelp-review-scraper
   └── Try web_wanderer/yelp-reviews-scraper

3. All failed → Return error with attempt logs
```

## Output Schema

### Unified Business

```typescript
interface UnifiedYelpBusiness {
  yelpId: string;
  name: string;
  address: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  categories?: string[];
  url: string;
  imageUrl?: string;
  reviews: UnifiedYelpReview[];
}
```

### Unified Review

```typescript
interface UnifiedYelpReview {
  yelpReviewId: string;
  authorName: string;
  authorLocation?: string;
  yelpUserId?: string;
  rating: number;
  text: string;
  date?: string;
}
```

## Usage Examples

### JavaScript/TypeScript

```typescript
import { createUnifiedYelpScraper } from './services/yelp-scraper-unified';

const scraper = createUnifiedYelpScraper(
  process.env.BRIGHTDATA_API_TOKEN,
  process.env.APIFY_API_TOKEN
);

// Scrape a specific business
const result = await scraper.scrape({
  directUrl: 'https://www.yelp.com/biz/club-cat-irvine',
  maxReviewsPerBusiness: 20,
  preferredProvider: 'auto'
});

console.log(`Provider: ${result.provider}`);
console.log(`Reviews: ${result.businesses[0].reviews.length}`);
```

### cURL

```bash
# Scrape direct URL
curl -X POST http://localhost:5000/api/yelp-scrape-unified \
  -H "Content-Type: application/json" \
  -d '{
    "directUrl": "https://www.yelp.com/biz/club-cat-irvine",
    "reviewLimit": 10
  }'

# Search businesses
curl -X POST http://localhost:5000/api/yelp-scrape-unified \
  -H "Content-Type: application/json" \
  -d '{
    "searchTerms": "cat cafe",
    "location": "Irvine, CA",
    "searchLimit": 5,
    "reviewLimit": 10
  }'

# Check health
curl http://localhost:5000/api/yelp-scraper-health
```

### Using Bright Data MCP Tools

When Claude Code has the Bright Data MCP server configured, you can use:

```
mcp__brightdata__scrape_as_markdown - Scrape any URL to markdown
mcp__brightdata__search_engine - Web search
mcp__brightdata__scraping_browser_* - Browser automation tools
```

## Best Practices

1. **Use Direct URLs** when possible - Bright Data excels at direct page scraping
2. **Use Apify for Search** - Bright Data doesn't have native Yelp search
3. **Monitor Attempts** - Check the `attempts` array to understand failover behavior
4. **Cache Results** - Implement caching to reduce API costs
5. **Respect Rate Limits** - Don't scrape too aggressively

## Troubleshooting

### "Bright Data health check failed"

- Verify `BRIGHTDATA_API_TOKEN` is set correctly
- Check your Bright Data account status
- Ensure Web Unlocker zone exists

### "No reviews found"

- Yelp may have changed their HTML structure
- Try using Scraping Browser instead of Web Unlocker
- Check if the business actually has reviews

### "All providers failed"

- Check both API tokens are valid
- Verify network connectivity
- Review the `attempts` array for specific errors

## Cost Comparison

| Provider | Method | Cost per 1000 requests |
|----------|--------|------------------------|
| Bright Data | Web Unlocker | ~$2.50 |
| Bright Data | Scraping Browser | ~$5.00 |
| Apify | yin/yelp-scraper | Free (5000/mo) |
| Apify | tri_angle | Pay-per-use |

## Files Structure

```
src/
├── services/
│   ├── brightdata-yelp.ts      # Bright Data Yelp scraper
│   └── yelp-scraper-unified.ts # Unified scraper with failover
├── ai-orchestrator.ts          # AI-orchestrated Apify (legacy)
└── index.ts                    # API endpoints

docs/
├── brightdata-mcp-setup.md     # MCP setup guide
└── yelp-scraping-system.md     # This file
```
