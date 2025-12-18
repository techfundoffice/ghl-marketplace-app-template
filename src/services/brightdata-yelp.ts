/**
 * Bright Data Yelp Scraper Service
 *
 * Uses Bright Data's Web Unlocker and Scraping Browser APIs to scrape
 * Yelp business pages and extract reviews.
 *
 * Bright Data doesn't have a native Yelp dataset, so we use:
 * 1. Web Unlocker API - For bypassing anti-bot protection
 * 2. Scraping Browser - For JavaScript rendering
 * 3. Custom parsing - Extract review data from HTML
 */

import axios, { AxiosInstance } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Bright Data API configuration
const BRIGHTDATA_API_BASE = 'https://api.brightdata.com';
const BRIGHTDATA_SCRAPER_API = 'https://api.brightdata.com/datasets/v3';

export interface BrightDataConfig {
  apiToken: string;
  webUnlockerZone?: string;
  browserZone?: string;
  proMode?: boolean;
}

export interface YelpBusiness {
  yelpId: string;
  name: string;
  address: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  categories?: string[];
  url: string;
  imageUrl?: string;
}

export interface YelpReview {
  yelpReviewId: string;
  authorName: string;
  authorLocation?: string;
  yelpUserId?: string;
  rating: number;
  text: string;
  date?: string;
  photos?: string[];
  usefulCount?: number;
  funnyCount?: number;
  coolCount?: number;
}

export interface YelpScrapeResult {
  success: boolean;
  provider: 'brightdata';
  method: 'web_unlocker' | 'scraping_browser' | 'scraper_api';
  business?: YelpBusiness;
  reviews: YelpReview[];
  error?: string;
  rawHtml?: string;
}

export interface ScrapeOptions {
  url: string;
  maxReviews?: number;
  sortBy?: 'date' | 'rating_high' | 'rating_low' | 'elites';
  includePhotos?: boolean;
}

/**
 * Bright Data Yelp Scraper
 */
export class BrightDataYelpScraper {
  private apiToken: string;
  private webUnlockerZone: string;
  private browserZone: string;
  private client: AxiosInstance;
  private proMode: boolean;

  constructor(config: BrightDataConfig) {
    this.apiToken = config.apiToken;
    this.webUnlockerZone = config.webUnlockerZone || 'mcp_unlocker';
    this.browserZone = config.browserZone || 'mcp_browser';
    this.proMode = config.proMode ?? true;

    this.client = axios.create({
      baseURL: BRIGHTDATA_API_BASE,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 2 minutes timeout for scraping operations
    });
  }

  /**
   * Extract Yelp business ID from URL
   */
  private extractYelpId(url: string): string | null {
    const match = url.match(/\/biz\/([^?\/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Parse reviews from Yelp HTML using regex patterns
   * (Server-side parsing without cheerio for simplicity)
   */
  private parseReviewsFromHtml(html: string): YelpReview[] {
    const reviews: YelpReview[] = [];

    // Yelp uses JSON-LD and embedded JSON for review data
    // Try to extract from script tags first
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);

    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonContent);

          if (data['@type'] === 'LocalBusiness' && data.review) {
            const reviewsData = Array.isArray(data.review) ? data.review : [data.review];
            for (const r of reviewsData) {
              reviews.push({
                yelpReviewId: r['@id'] || `yelp-${Date.now()}-${reviews.length}`,
                authorName: r.author?.name || 'Anonymous',
                authorLocation: '',
                rating: r.reviewRating?.ratingValue || 0,
                text: r.description || r.reviewBody || '',
                date: r.datePublished,
              });
            }
          }
        } catch (e) {
          // JSON parse error, continue
        }
      }
    }

    // Also try to extract from embedded React/Redux state
    const stateMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});?\s*<\/script>/);
    if (stateMatch) {
      try {
        // Clean up the JSON string
        let jsonStr = stateMatch[1]
          .replace(/undefined/g, 'null')
          .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

        const state = JSON.parse(jsonStr);

        // Navigate through the state to find reviews
        const reviewsFromState = this.extractReviewsFromState(state);
        if (reviewsFromState.length > 0) {
          return reviewsFromState;
        }
      } catch (e) {
        // State parse error, continue with regex
      }
    }

    // Fallback: Extract reviews using regex patterns
    // Look for review containers in the HTML
    const reviewBlockRegex = /<div[^>]*class="[^"]*review[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
    const ratingRegex = /aria-label="(\d(?:\.\d)?)\s*star\s*rating"/i;
    const userNameRegex = /class="[^"]*user-name[^"]*"[^>]*>([^<]+)</i;
    const reviewTextRegex = /class="[^"]*comment[^"]*"[^>]*>[\s\S]*?<p[^>]*>([^<]+)</i;
    const dateRegex = /class="[^"]*rating-qualifier[^"]*"[^>]*>([^<]+)</i;

    let blockMatch;
    while ((blockMatch = reviewBlockRegex.exec(html)) !== null) {
      const block = blockMatch[1];

      const ratingMatch = ratingRegex.exec(block);
      const userMatch = userNameRegex.exec(block);
      const textMatch = reviewTextRegex.exec(block);
      const dateMatch = dateRegex.exec(block);

      if (textMatch && textMatch[1]) {
        reviews.push({
          yelpReviewId: `yelp-html-${Date.now()}-${reviews.length}`,
          authorName: userMatch ? userMatch[1].trim() : 'Anonymous',
          authorLocation: '',
          rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
          text: textMatch[1].trim(),
          date: dateMatch ? dateMatch[1].trim() : undefined,
        });
      }
    }

    return reviews;
  }

  /**
   * Extract reviews from Yelp's preloaded state object
   */
  private extractReviewsFromState(state: any): YelpReview[] {
    const reviews: YelpReview[] = [];

    // Try common paths in Yelp's state structure
    const possiblePaths = [
      state?.bizDetailsPageProps?.reviewFeedQueryProps?.reviews,
      state?.gaConfig?.dimension_values?.reviews,
      state?.reviews,
      state?.bizReviews,
    ];

    for (const reviewsData of possiblePaths) {
      if (Array.isArray(reviewsData)) {
        for (const r of reviewsData) {
          reviews.push({
            yelpReviewId: r.id || r.reviewId || r.encryptedId || `state-${Date.now()}-${reviews.length}`,
            authorName: r.user?.name || r.userName || r.author || 'Anonymous',
            authorLocation: r.user?.location || r.userLocation || '',
            yelpUserId: r.user?.id || r.userId,
            rating: r.rating || r.stars || 0,
            text: r.text || r.comment || r.reviewText || '',
            date: r.date || r.localizedDate || r.time_created,
            usefulCount: r.feedback?.useful || r.usefulCount,
            funnyCount: r.feedback?.funny || r.funnyCount,
            coolCount: r.feedback?.cool || r.coolCount,
          });
        }
        if (reviews.length > 0) break;
      }
    }

    return reviews;
  }

  /**
   * Parse business info from HTML
   */
  private parseBusinessFromHtml(html: string, url: string): YelpBusiness | null {
    const yelpId = this.extractYelpId(url);
    if (!yelpId) return null;

    // Try JSON-LD first
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const data = JSON.parse(jsonLdMatch[1]);
        if (data['@type'] === 'LocalBusiness' || data['@type'] === 'Restaurant') {
          return {
            yelpId,
            name: data.name || 'Unknown Business',
            address: data.address?.streetAddress ||
              `${data.address?.addressLocality || ''}, ${data.address?.addressRegion || ''}`.trim(),
            phone: data.telephone,
            rating: data.aggregateRating?.ratingValue,
            reviewCount: data.aggregateRating?.reviewCount,
            categories: data.servesCuisine ? [data.servesCuisine] : [],
            url,
            imageUrl: data.image,
          };
        }
      } catch (e) {
        // Continue with fallback
      }
    }

    // Fallback: regex extraction
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const ratingMatch = html.match(/aria-label="(\d(?:\.\d)?)\s*star\s*rating"/i);
    const reviewCountMatch = html.match(/(\d+)\s*reviews?/i);
    const phoneMatch = html.match(/tel:([^"]+)"/i);
    const addressMatch = html.match(/<address[^>]*>([\s\S]*?)<\/address>/i);

    return {
      yelpId,
      name: nameMatch ? nameMatch[1].trim() : 'Unknown Business',
      address: addressMatch ? addressMatch[1].replace(/<[^>]+>/g, ' ').trim() : '',
      phone: phoneMatch ? phoneMatch[1] : undefined,
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : undefined,
      reviewCount: reviewCountMatch ? parseInt(reviewCountMatch[1]) : undefined,
      categories: [],
      url,
    };
  }

  /**
   * Method 1: Use Web Unlocker API for scraping
   * Best for: Simple pages, faster response
   */
  async scrapeWithWebUnlocker(options: ScrapeOptions): Promise<YelpScrapeResult> {
    const { url, maxReviews = 10 } = options;

    try {
      console.log(`[BrightData] Scraping Yelp with Web Unlocker: ${url}`);

      // Get customer ID first
      const statusResponse = await this.client.get('/status');
      const customer = statusResponse.data.customer;

      // Build proxy URL for Web Unlocker
      const proxyAuth = await this.getWebUnlockerCredentials();

      // Create HTTPS proxy agent with proper credentials
      const proxyUrl = `http://${proxyAuth.username}:${proxyAuth.password}@brd.superproxy.io:33335`;
      const httpsAgent = new HttpsProxyAgent(proxyUrl);

      // Temporarily disable TLS verification for Bright Data's SSL interception
      // Save original value
      const originalTlsReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

      try {
        // Make request through Web Unlocker proxy
        const response = await axios.get(url, {
          httpAgent: httpsAgent,
          httpsAgent: httpsAgent,
          proxy: false, // Disable axios built-in proxy to use our agent
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
          },
          timeout: 120000, // 2 minutes - Yelp pages can be slow through proxy
          maxRedirects: 5,
        });

        // Restore TLS verification
        if (originalTlsReject !== undefined) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTlsReject;
        } else {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        }

        const html = response.data;
        const business = this.parseBusinessFromHtml(html, url);
        let reviews = this.parseReviewsFromHtml(html);

        // Limit reviews if needed
        if (reviews.length > maxReviews) {
          reviews = reviews.slice(0, maxReviews);
        }

        return {
          success: true,
          provider: 'brightdata',
          method: 'web_unlocker',
          business: business || undefined,
          reviews,
        };
      } finally {
        // Ensure TLS verification is restored even on error
        if (originalTlsReject !== undefined) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTlsReject;
        } else {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        }
      }
    } catch (error: any) {
      console.error('[BrightData] Web Unlocker error:', error.message);
      return {
        success: false,
        provider: 'brightdata',
        method: 'web_unlocker',
        reviews: [],
        error: error.message,
      };
    }
  }

  /**
   * Get Web Unlocker proxy credentials
   */
  private async getWebUnlockerCredentials(): Promise<{ username: string; password: string }> {
    try {
      const statusResponse = await this.client.get('/status');
      const customer = statusResponse.data.customer;

      const passwordResponse = await this.client.get(`/zone/passwords?zone=${this.webUnlockerZone}`);
      const password = passwordResponse.data.passwords?.[0];

      return {
        username: `brd-customer-${customer}-zone-${this.webUnlockerZone}`,
        password: password || '',
      };
    } catch (error: any) {
      throw new Error(`Failed to get Web Unlocker credentials: ${error.message}`);
    }
  }

  /**
   * Method 2: Use Scraping Browser for JavaScript-heavy pages
   * Best for: Dynamic content, complex pages
   */
  async scrapeWithScrapingBrowser(options: ScrapeOptions): Promise<YelpScrapeResult> {
    const { url, maxReviews = 10 } = options;

    try {
      console.log(`[BrightData] Scraping Yelp with Scraping Browser: ${url}`);

      // Get CDP endpoint
      const statusResponse = await this.client.get('/status');
      const customer = statusResponse.data.customer;

      const passwordResponse = await this.client.get(`/zone/passwords?zone=${this.browserZone}`);
      const password = passwordResponse.data.passwords?.[0];

      if (!password) {
        throw new Error(`Browser zone '${this.browserZone}' not configured`);
      }

      const cdpEndpoint = `wss://brd-customer-${customer}-zone-${this.browserZone}:${password}@brd.superproxy.io:9222`;

      // Use puppeteer-core to connect (if available)
      // For this implementation, we'll use a simpler HTTP-based approach
      // through the Bright Data API

      const scrapeResponse = await this.client.post('/request', {
        zone: this.browserZone,
        url,
        render_js: true,
        wait_for: 'networkidle',
        timeout: 60000,
      });

      const html = scrapeResponse.data.html || scrapeResponse.data;
      const business = this.parseBusinessFromHtml(html, url);
      let reviews = this.parseReviewsFromHtml(html);

      if (reviews.length > maxReviews) {
        reviews = reviews.slice(0, maxReviews);
      }

      return {
        success: true,
        provider: 'brightdata',
        method: 'scraping_browser',
        business: business || undefined,
        reviews,
      };
    } catch (error: any) {
      console.error('[BrightData] Scraping Browser error:', error.message);
      return {
        success: false,
        provider: 'brightdata',
        method: 'scraping_browser',
        reviews: [],
        error: error.message,
      };
    }
  }

  /**
   * Method 3: Use Bright Data's generic scrape endpoint (via MCP)
   * This uses the scrape_as_markdown tool pattern
   */
  async scrapeAsMarkdown(options: ScrapeOptions): Promise<YelpScrapeResult> {
    const { url, maxReviews = 10 } = options;

    try {
      console.log(`[BrightData] Scraping Yelp as markdown: ${url}`);

      // Use the SERP API / Web Scraper endpoint
      const response = await this.client.post('/serp/req', {
        url,
        format: 'markdown',
        country: 'us',
      });

      const markdown = response.data.content || response.data;

      // Parse markdown for review information
      // This is a simpler format but may have less structure
      const reviews: YelpReview[] = [];

      // Extract review blocks from markdown
      const reviewBlocks = markdown.split(/#{2,3}\s+Review/i);

      for (let i = 1; i < reviewBlocks.length && reviews.length < maxReviews; i++) {
        const block = reviewBlocks[i];
        const ratingMatch = block.match(/(\d(?:\.\d)?)\s*(?:star|★)/i);
        const textMatch = block.match(/(?:text|comment|review):\s*(.+?)(?:\n|$)/i) ||
                          block.match(/"([^"]{20,})"/);

        if (textMatch) {
          reviews.push({
            yelpReviewId: `md-${Date.now()}-${reviews.length}`,
            authorName: 'Anonymous',
            rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
            text: textMatch[1].trim(),
          });
        }
      }

      return {
        success: reviews.length > 0,
        provider: 'brightdata',
        method: 'scraper_api',
        reviews,
        error: reviews.length === 0 ? 'No reviews found in markdown' : undefined,
      };
    } catch (error: any) {
      console.error('[BrightData] Markdown scrape error:', error.message);
      return {
        success: false,
        provider: 'brightdata',
        method: 'scraper_api',
        reviews: [],
        error: error.message,
      };
    }
  }

  /**
   * Main scraping method - tries multiple approaches
   */
  async scrapeYelpReviews(options: ScrapeOptions): Promise<YelpScrapeResult> {
    const methods = [
      () => this.scrapeWithWebUnlocker(options),
      () => this.scrapeWithScrapingBrowser(options),
      () => this.scrapeAsMarkdown(options),
    ];

    for (const method of methods) {
      const result = await method();
      if (result.success && result.reviews.length > 0) {
        console.log(`[BrightData] Successfully scraped ${result.reviews.length} reviews using ${result.method}`);
        return result;
      }
      console.log(`[BrightData] Method ${result.method} failed: ${result.error || 'No reviews found'}`);
    }

    return {
      success: false,
      provider: 'brightdata',
      method: 'web_unlocker',
      reviews: [],
      error: 'All Bright Data scraping methods failed',
    };
  }

  /**
   * Check if Bright Data API is configured and working
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      const response = await this.client.get('/status');
      return {
        healthy: true,
        message: `Connected as customer: ${response.data.customer}`,
      };
    } catch (error: any) {
      return {
        healthy: false,
        message: error.message,
      };
    }
  }
}

/**
 * Create a Bright Data Yelp scraper instance
 */
export function createBrightDataYelpScraper(apiToken?: string): BrightDataYelpScraper | null {
  const token = apiToken || process.env.BRIGHTDATA_API_TOKEN;

  if (!token) {
    console.warn('[BrightData] No API token configured');
    return null;
  }

  return new BrightDataYelpScraper({
    apiToken: token,
    webUnlockerZone: process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE || 'mcp_unlocker',
    browserZone: process.env.BRIGHTDATA_BROWSER_ZONE || 'mcp_browser',
    proMode: process.env.BRIGHTDATA_PRO_MODE !== 'false',
  });
}
