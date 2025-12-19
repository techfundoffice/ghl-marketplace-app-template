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
   * Parse reviews from Yelp HTML using multiple strategies
   */
  private parseReviewsFromHtml(html: string): YelpReview[] {
    const reviews: YelpReview[] = [];

    // Strategy 1: Look for JSON-LD structured data
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonContent);
          if ((data['@type'] === 'LocalBusiness' || data['@type'] === 'Restaurant') && data.review) {
            const reviewsData = Array.isArray(data.review) ? data.review : [data.review];
            for (const r of reviewsData) {
              reviews.push({
                yelpReviewId: r['@id'] || `ld-${Date.now()}-${reviews.length}`,
                authorName: r.author?.name || 'Anonymous',
                authorLocation: '',
                rating: r.reviewRating?.ratingValue || 0,
                text: r.description || r.reviewBody || '',
                date: r.datePublished,
              });
            }
          }
        } catch (e) {}
      }
    }
    if (reviews.length > 0) {
      console.log(`[BrightData] Found ${reviews.length} reviews via JSON-LD`);
      return reviews;
    }

    // Strategy 2: Extract from Yelp's embedded Apollo/GraphQL state
    const apolloStateMatch = html.match(/"reviewList":\s*\[([\s\S]*?)\](?=,"|}\s*<)/);
    if (apolloStateMatch) {
      try {
        const reviewListJson = `[${apolloStateMatch[1]}]`;
        const reviewList = JSON.parse(reviewListJson);
        for (const r of reviewList) {
          if (r.text || r.comment) {
            reviews.push({
              yelpReviewId: r.id || r.encryptedId || `apollo-${Date.now()}-${reviews.length}`,
              authorName: r.user?.name || r.author?.name || 'Anonymous',
              authorLocation: r.user?.location || '',
              yelpUserId: r.user?.id,
              rating: r.rating || 0,
              text: r.text || r.comment || '',
              date: r.createdAt || r.localizedDate,
            });
          }
        }
      } catch (e) {}
    }
    if (reviews.length > 0) {
      console.log(`[BrightData] Found ${reviews.length} reviews via Apollo state`);
      return reviews;
    }

    // Strategy 3: Parse from script containing "bizDetailsPageProps" 
    const bizPropsMatch = html.match(/<!--\s*(?:BizDetails|bizDetailsPage)Props\s*-->\s*<script[^>]*>([\s\S]*?)<\/script>/i);
    if (bizPropsMatch) {
      try {
        const propsData = JSON.parse(bizPropsMatch[1]);
        const reviewsData = propsData?.reviewFeedQueryProps?.reviews || 
                            propsData?.bizDetailsProps?.reviews ||
                            propsData?.reviews || [];
        for (const r of reviewsData) {
          reviews.push({
            yelpReviewId: r.id || `props-${Date.now()}-${reviews.length}`,
            authorName: r.user?.markupDisplayName || r.user?.name || 'Anonymous',
            authorLocation: r.user?.displayLocation || '',
            yelpUserId: r.user?.id,
            rating: r.rating || 0,
            text: r.comment?.text || r.text || '',
            date: r.localizedDate,
          });
        }
      } catch (e) {}
    }
    if (reviews.length > 0) {
      console.log(`[BrightData] Found ${reviews.length} reviews via BizDetailsProps`);
      return reviews;
    }

    // Strategy 4: Generic JSON extraction for review objects
    const reviewJsonRegex = /"encryptedId":\s*"([^"]+)"[\s\S]*?"rating":\s*(\d)[\s\S]*?"text":\s*"([^"]{10,}?)"/g;
    let jsonMatch;
    while ((jsonMatch = reviewJsonRegex.exec(html)) !== null && reviews.length < 50) {
      reviews.push({
        yelpReviewId: jsonMatch[1],
        authorName: 'Yelp User',
        authorLocation: '',
        rating: parseInt(jsonMatch[2]),
        text: jsonMatch[3].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
      });
    }
    if (reviews.length > 0) {
      console.log(`[BrightData] Found ${reviews.length} reviews via JSON regex`);
      return reviews;
    }

    // Strategy 5: Look for comment__09f24__text patterns (Yelp 2024 class names)
    const commentTextRegex = /class="[^"]*comment[^"]*"[^>]*>[\s\S]*?<span[^>]*lang="[^"]*"[^>]*>([^<]{20,})</gi;
    let commentMatch;
    while ((commentMatch = commentTextRegex.exec(html)) !== null && reviews.length < 50) {
      reviews.push({
        yelpReviewId: `html-${Date.now()}-${reviews.length}`,
        authorName: 'Yelp User',
        authorLocation: '',
        rating: 5,
        text: commentMatch[1].trim(),
      });
    }
    if (reviews.length > 0) {
      console.log(`[BrightData] Found ${reviews.length} reviews via HTML comment class`);
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
   * Method 1: Use Web Unlocker REST API for scraping (2024 recommended approach)
   * Uses POST to https://api.brightdata.com/request
   */
  async scrapeWithWebUnlocker(options: ScrapeOptions): Promise<YelpScrapeResult> {
    const { url, maxReviews = 10 } = options;

    try {
      console.log(`[BrightData] Scraping Yelp with Web Unlocker REST API: ${url}`);

      // Use the REST API endpoint (recommended method)
      const response = await this.client.post('/request', {
        zone: this.webUnlockerZone,
        url: url,
        format: 'raw',
        country: 'us',
      }, {
        timeout: 120000,
      });

      const html = typeof response.data === 'string' ? response.data : response.data.html || response.data.body || '';
      
      if (!html || html.length < 1000) {
        throw new Error('Empty or invalid HTML response');
      }

      console.log(`[BrightData] Got HTML response: ${html.length} chars`);
      
      const business = this.parseBusinessFromHtml(html, url);
      let reviews = this.parseReviewsFromHtml(html);

      console.log(`[BrightData] Parsed ${reviews.length} reviews from HTML`);

      // Limit reviews if needed
      if (reviews.length > maxReviews) {
        reviews = reviews.slice(0, maxReviews);
      }

      return {
        success: reviews.length > 0,
        provider: 'brightdata',
        method: 'web_unlocker',
        business: business || undefined,
        reviews,
        error: reviews.length === 0 ? 'No reviews found in HTML' : undefined,
      };
    } catch (error: any) {
      console.error('[BrightData] Web Unlocker REST API error:', error.response?.data || error.message);
      return {
        success: false,
        provider: 'brightdata',
        method: 'web_unlocker',
        reviews: [],
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Method 2: Use Web Unlocker with JavaScript rendering
   * For dynamic pages that need JS execution
   */
  async scrapeWithScrapingBrowser(options: ScrapeOptions): Promise<YelpScrapeResult> {
    const { url, maxReviews = 10 } = options;

    try {
      console.log(`[BrightData] Scraping Yelp with JS rendering: ${url}`);

      const response = await this.client.post('/request', {
        zone: this.webUnlockerZone,
        url: url,
        format: 'raw',
        country: 'us',
        render_js: true,
      }, {
        timeout: 120000,
      });

      const html = typeof response.data === 'string' ? response.data : response.data.html || response.data.body || '';
      
      if (!html || html.length < 1000) {
        throw new Error('Empty or invalid HTML response');
      }

      console.log(`[BrightData] Got JS-rendered HTML: ${html.length} chars`);
      
      const business = this.parseBusinessFromHtml(html, url);
      let reviews = this.parseReviewsFromHtml(html);

      if (reviews.length > maxReviews) {
        reviews = reviews.slice(0, maxReviews);
      }

      return {
        success: reviews.length > 0,
        provider: 'brightdata',
        method: 'scraping_browser',
        business: business || undefined,
        reviews,
        error: reviews.length === 0 ? 'No reviews found' : undefined,
      };
    } catch (error: any) {
      console.error('[BrightData] JS render error:', error.response?.data || error.message);
      return {
        success: false,
        provider: 'brightdata',
        method: 'scraping_browser',
        reviews: [],
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Method 3: Use Web Unlocker with markdown format
   * Simpler parsing, good for AI consumption
   */
  async scrapeAsMarkdown(options: ScrapeOptions): Promise<YelpScrapeResult> {
    const { url, maxReviews = 10 } = options;

    try {
      console.log(`[BrightData] Scraping Yelp as markdown: ${url}`);

      const response = await this.client.post('/request', {
        zone: this.webUnlockerZone,
        url: url,
        format: 'raw',
        data_format: 'markdown',
        country: 'us',
      }, {
        timeout: 120000,
      });

      const markdown = typeof response.data === 'string' ? response.data : response.data.content || response.data.body || '';

      console.log(`[BrightData] Got markdown: ${markdown.length} chars`);

      const reviews: YelpReview[] = [];

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
