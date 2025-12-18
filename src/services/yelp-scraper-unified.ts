/**
 * Unified Yelp Scraper Service
 *
 * Orchestrates multiple scraping providers with automatic failover:
 * 1. Bright Data (Primary) - Web Unlocker, Scraping Browser
 * 2. Apify (Fallback) - Multiple Yelp scraper actors
 *
 * Features:
 * - Automatic failover between providers
 * - Consistent output schema
 * - Health monitoring
 * - Detailed logging
 */

import { ApifyClient } from 'apify-client';
import {
  BrightDataYelpScraper,
  createBrightDataYelpScraper,
  YelpBusiness,
  YelpReview,
  YelpScrapeResult,
} from './brightdata-yelp';

// Unified types
export interface UnifiedYelpBusiness {
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

export interface UnifiedYelpReview {
  yelpReviewId: string;
  authorName: string;
  authorLocation?: string;
  yelpUserId?: string;
  rating: number;
  text: string;
  date?: string;
}

export interface UnifiedScrapeResult {
  success: boolean;
  provider: 'brightdata' | 'apify';
  method?: string;
  actorUsed?: string;
  businesses: UnifiedYelpBusiness[];
  attempts: AttemptLog[];
  error?: string;
}

export interface AttemptLog {
  provider: 'brightdata' | 'apify';
  method: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  timestamp: string;
  duration?: number;
}

export interface ScrapeConfig {
  directUrl?: string;
  searchTerms?: string;
  location?: string;
  maxBusinesses?: number;
  maxReviewsPerBusiness?: number;
  preferredProvider?: 'brightdata' | 'apify' | 'auto';
  onLog?: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

// Apify actor configurations
const APIFY_YELP_ACTORS = [
  { id: 'yin/yelp-scraper', name: 'Free Yelp Web Scraper', priority: 1 },
  { id: 'tri_angle/yelp-scraper', name: 'Triangle Yelp Scraper', priority: 2 },
  { id: 'tri_angle/yelp-review-scraper', name: 'Triangle Yelp Review Scraper', priority: 3 },
  { id: 'web_wanderer/yelp-reviews-scraper', name: 'Web Wanderer Yelp Reviews', priority: 4 },
];

/**
 * Unified Yelp Scraper
 */
export class UnifiedYelpScraper {
  private brightDataScraper: BrightDataYelpScraper | null;
  private apifyClient: ApifyClient | null;
  private log: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;

  constructor(
    brightDataToken?: string,
    apifyToken?: string,
    logger?: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
  ) {
    this.brightDataScraper = createBrightDataYelpScraper(brightDataToken);
    this.apifyClient = apifyToken ? new ApifyClient({ token: apifyToken }) : null;
    this.log = logger || ((msg, type) => console.log(`[${type.toUpperCase()}] ${msg}`));
  }

  /**
   * Extract Yelp business ID from URL
   */
  private extractYelpIdFromUrl(url?: string): string | undefined {
    if (!url) return undefined;
    const match = url.match(/\/biz\/([^?\/]+)/);
    return match ? match[1] : undefined;
  }

  /**
   * Scrape using Bright Data (Primary Provider)
   */
  private async scrapeWithBrightData(config: ScrapeConfig): Promise<{
    result: UnifiedScrapeResult;
    shouldFallback: boolean;
  }> {
    const attempts: AttemptLog[] = [];
    const startTime = Date.now();

    if (!this.brightDataScraper) {
      this.log('Bright Data not configured, skipping...', 'warning');
      attempts.push({
        provider: 'brightdata',
        method: 'all',
        status: 'skipped',
        message: 'Bright Data API token not configured',
        timestamp: new Date().toISOString(),
      });
      return {
        result: {
          success: false,
          provider: 'brightdata',
          businesses: [],
          attempts,
          error: 'Bright Data not configured',
        },
        shouldFallback: true,
      };
    }

    // Check health first
    const health = await this.brightDataScraper.healthCheck();
    if (!health.healthy) {
      this.log(`Bright Data health check failed: ${health.message}`, 'warning');
      attempts.push({
        provider: 'brightdata',
        method: 'health_check',
        status: 'failed',
        message: health.message,
        timestamp: new Date().toISOString(),
      });
      return {
        result: {
          success: false,
          provider: 'brightdata',
          businesses: [],
          attempts,
          error: health.message,
        },
        shouldFallback: true,
      };
    }

    this.log('Bright Data health check passed', 'success');

    // If we have a direct URL, scrape it
    if (config.directUrl) {
      this.log(`Scraping Yelp URL with Bright Data: ${config.directUrl}`, 'info');

      const scrapeResult = await this.brightDataScraper.scrapeYelpReviews({
        url: config.directUrl,
        maxReviews: config.maxReviewsPerBusiness || 10,
      });

      const duration = Date.now() - startTime;

      attempts.push({
        provider: 'brightdata',
        method: scrapeResult.method,
        status: scrapeResult.success ? 'success' : 'failed',
        message: scrapeResult.success
          ? `Scraped ${scrapeResult.reviews.length} reviews`
          : (scrapeResult.error || 'Unknown error'),
        timestamp: new Date().toISOString(),
        duration,
      });

      if (scrapeResult.success && scrapeResult.reviews.length > 0) {
        const business: UnifiedYelpBusiness = {
          yelpId: scrapeResult.business?.yelpId || this.extractYelpIdFromUrl(config.directUrl) || 'unknown',
          name: scrapeResult.business?.name || 'Unknown Business',
          address: scrapeResult.business?.address || '',
          phone: scrapeResult.business?.phone,
          rating: scrapeResult.business?.rating,
          reviewCount: scrapeResult.business?.reviewCount,
          categories: scrapeResult.business?.categories,
          url: config.directUrl,
          imageUrl: scrapeResult.business?.imageUrl,
          reviews: scrapeResult.reviews.map(r => ({
            yelpReviewId: r.yelpReviewId,
            authorName: r.authorName,
            authorLocation: r.authorLocation,
            yelpUserId: r.yelpUserId,
            rating: r.rating,
            text: r.text,
            date: r.date,
          })),
        };

        this.log(`Bright Data scraped ${scrapeResult.reviews.length} reviews successfully`, 'success');

        return {
          result: {
            success: true,
            provider: 'brightdata',
            method: scrapeResult.method,
            businesses: [business],
            attempts,
          },
          shouldFallback: false,
        };
      }

      this.log(`Bright Data scraping failed: ${scrapeResult.error}`, 'warning');
      return {
        result: {
          success: false,
          provider: 'brightdata',
          businesses: [],
          attempts,
          error: scrapeResult.error,
        },
        shouldFallback: true,
      };
    }

    // For search queries, Bright Data doesn't have native Yelp search
    // Fall back to Apify for search
    this.log('Bright Data does not support Yelp search queries, falling back to Apify', 'info');
    attempts.push({
      provider: 'brightdata',
      method: 'search',
      status: 'skipped',
      message: 'Bright Data does not support Yelp search queries',
      timestamp: new Date().toISOString(),
    });

    return {
      result: {
        success: false,
        provider: 'brightdata',
        businesses: [],
        attempts,
        error: 'Search queries require Apify',
      },
      shouldFallback: true,
    };
  }

  /**
   * Scrape using Apify (Fallback Provider)
   */
  private async scrapeWithApify(config: ScrapeConfig, existingAttempts: AttemptLog[] = []): Promise<UnifiedScrapeResult> {
    const attempts = [...existingAttempts];

    if (!this.apifyClient) {
      this.log('Apify not configured', 'error');
      attempts.push({
        provider: 'apify',
        method: 'all',
        status: 'skipped',
        message: 'Apify API token not configured',
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        provider: 'apify',
        businesses: [],
        attempts,
        error: 'Apify not configured',
      };
    }

    this.log('Falling back to Apify for Yelp scraping', 'info');

    // Try each Apify actor in order
    for (const actor of APIFY_YELP_ACTORS) {
      const startTime = Date.now();

      try {
        this.log(`Trying Apify actor: ${actor.name} (${actor.id})`, 'info');

        const input = this.buildApifyInput(actor.id, config);
        const run = await this.apifyClient.actor(actor.id).call(input);
        const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();

        const duration = Date.now() - startTime;

        if (!items || items.length === 0) {
          throw new Error('No results returned');
        }

        this.log(`Apify actor ${actor.id} returned ${items.length} items`, 'success');

        // Normalize Apify results to unified format
        const businesses = this.normalizeApifyResults(actor.id, items, config.directUrl);

        attempts.push({
          provider: 'apify',
          method: actor.id,
          status: 'success',
          message: `Scraped ${businesses.length} businesses with ${businesses.reduce((sum, b) => sum + b.reviews.length, 0)} total reviews`,
          timestamp: new Date().toISOString(),
          duration,
        });

        return {
          success: true,
          provider: 'apify',
          actorUsed: actor.id,
          businesses,
          attempts,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;
        this.log(`Apify actor ${actor.id} failed: ${error.message}`, 'warning');

        attempts.push({
          provider: 'apify',
          method: actor.id,
          status: 'failed',
          message: error.message,
          timestamp: new Date().toISOString(),
          duration,
        });
      }
    }

    return {
      success: false,
      provider: 'apify',
      businesses: [],
      attempts,
      error: 'All Apify actors failed',
    };
  }

  /**
   * Build Apify actor input based on actor type
   */
  private buildApifyInput(actorId: string, config: ScrapeConfig): any {
    const { directUrl, searchTerms, location, maxBusinesses = 10, maxReviewsPerBusiness = 10 } = config;
    const proxyConfig = { useApifyProxy: true };

    if (actorId.includes('yin/yelp')) {
      return {
        directUrls: directUrl ? [directUrl] : undefined,
        searchTerms: directUrl ? undefined : [searchTerms],
        locations: directUrl ? undefined : [location],
        searchLimit: maxBusinesses,
        maxImages: 5,
        proxy: proxyConfig,
      };
    }

    if (actorId.includes('tri_angle/yelp-scraper')) {
      return {
        directUrls: directUrl ? [directUrl] : undefined,
        searchTerms: directUrl ? undefined : [searchTerms],
        locations: directUrl ? undefined : [location],
        searchLimit: maxBusinesses,
        reviewLimit: maxReviewsPerBusiness,
        maxImages: 1,
        proxy: proxyConfig,
      };
    }

    if (actorId.includes('tri_angle/yelp-review-scraper')) {
      return {
        directUrls: directUrl ? [directUrl] : undefined,
        searchTerms: directUrl ? undefined : [searchTerms],
        locations: directUrl ? undefined : [location],
        reviewLimit: maxReviewsPerBusiness,
        proxy: proxyConfig,
      };
    }

    if (actorId.includes('web_wanderer')) {
      return {
        startUrls: directUrl ? [directUrl] : undefined,
        searchTerms: directUrl ? undefined : searchTerms,
        location: directUrl ? undefined : location,
        maxReviews: maxReviewsPerBusiness,
        proxy: proxyConfig,
      };
    }

    // Generic fallback
    return {
      url: directUrl,
      startUrls: directUrl ? [{ url: directUrl }] : undefined,
      maxItems: maxBusinesses,
      proxy: proxyConfig,
    };
  }

  /**
   * Normalize Apify results to unified format
   */
  private normalizeApifyResults(actorId: string, items: any[], directUrl?: string): UnifiedYelpBusiness[] {
    const businesses: UnifiedYelpBusiness[] = [];

    // Handle widbox format (returns reviews directly)
    if (actorId.includes('widbox')) {
      const reviewsList = items.map((review, idx) => ({
        yelpReviewId: review.id || review.reviewId || `widbox-${idx}`,
        authorName: review.userName || review.reviewerName || 'Anonymous',
        authorLocation: review.userLocation || review.reviewerLocation || '',
        yelpUserId: review.userId || review.user_id,
        rating: review.rating || review.stars || 0,
        text: review.text || review.comment || review.reviewText || '',
        date: review.date || review.datePublished,
      }));

      const firstItem = items[0] || {};
      businesses.push({
        yelpId: firstItem.bizId || this.extractYelpIdFromUrl(directUrl) || 'unknown',
        name: firstItem.businessName || 'Business',
        address: firstItem.businessAddress || '',
        phone: firstItem.businessPhone,
        rating: firstItem.businessRating,
        reviewCount: items.length,
        categories: [],
        url: directUrl || firstItem.bizUrl || '',
        reviews: reviewsList,
      });

      return businesses;
    }

    // Handle standard formats
    for (const item of items) {
      const yelpId = item.bizId || item.id || item.businessId || item.alias ||
        this.extractYelpIdFromUrl(item.directUrl || item.url);

      if (!yelpId) continue;

      const address = typeof item.address === 'string'
        ? item.address
        : item.address
          ? `${item.address.addressLine1 || item.address.street || ''}, ${item.address.city || ''}, ${item.address.regionCode || item.address.state || ''}`.trim()
          : item.location
            ? `${item.location.address1 || ''}, ${item.location.city || ''}, ${item.location.state || ''}`.trim()
            : '';

      const reviewsArray = item.reviews || item.reviewsList || [];
      const reviews: UnifiedYelpReview[] = reviewsArray.map((r: any, idx: number) => ({
        yelpReviewId: r.id || r.reviewId || r.reviewAlias || `${yelpId}-${idx}`,
        authorName: r.reviewerName || r.author?.name || r.userName || r.user?.name || 'Anonymous',
        authorLocation: r.reviewerLocation || r.author?.location || r.userLocation || '',
        yelpUserId: r.author?.userId || r.userId || r.user?.id,
        rating: r.rating || r.stars || 0,
        text: r.text || r.comment || r.reviewText || r.reviewContent || '',
        date: r.date || r.datePublished || r.time_created,
      }));

      businesses.push({
        yelpId,
        name: item.name || item.businessName || 'Unknown',
        address,
        phone: item.phone || item.phoneNumber || item.display_phone,
        rating: item.aggregatedRating || item.rating || item.overallRating,
        reviewCount: item.reviewCount || item.review_count || item.numberOfReviews,
        categories: item.categories?.map((c: any) => typeof c === 'string' ? c : c.title || c.alias) || [],
        url: item.directUrl || item.url || item.businessUrl || '',
        imageUrl: item.primaryPhoto || item.imageUrl || item.mainImageUrl || item.image_url,
        reviews,
      });
    }

    return businesses;
  }

  /**
   * Main scraping method with automatic failover
   */
  async scrape(config: ScrapeConfig): Promise<UnifiedScrapeResult> {
    const { preferredProvider = 'auto' } = config;

    if (config.onLog) {
      this.log = config.onLog;
    }

    this.log('Starting unified Yelp scraper', 'info');
    this.log(`Config: ${config.directUrl || `${config.searchTerms} in ${config.location}`}`, 'info');

    // Strategy 1: Use Bright Data first (for direct URLs)
    if (preferredProvider === 'auto' || preferredProvider === 'brightdata') {
      const brightDataResult = await this.scrapeWithBrightData(config);

      if (!brightDataResult.shouldFallback) {
        return brightDataResult.result;
      }

      // Fall back to Apify
      this.log('Bright Data scraping failed, falling back to Apify', 'warning');
      return this.scrapeWithApify(config, brightDataResult.result.attempts);
    }

    // Strategy 2: Use Apify only
    if (preferredProvider === 'apify') {
      return this.scrapeWithApify(config);
    }

    // Default: Try both
    const brightDataResult = await this.scrapeWithBrightData(config);
    if (!brightDataResult.shouldFallback) {
      return brightDataResult.result;
    }
    return this.scrapeWithApify(config, brightDataResult.result.attempts);
  }

  /**
   * Check provider health
   */
  async healthCheck(): Promise<{
    brightdata: { available: boolean; message: string };
    apify: { available: boolean; message: string };
  }> {
    const result = {
      brightdata: { available: false, message: 'Not configured' },
      apify: { available: false, message: 'Not configured' },
    };

    if (this.brightDataScraper) {
      const health = await this.brightDataScraper.healthCheck();
      result.brightdata = {
        available: health.healthy,
        message: health.message,
      };
    }

    if (this.apifyClient) {
      try {
        await this.apifyClient.user().get();
        result.apify = {
          available: true,
          message: 'Connected',
        };
      } catch (error: any) {
        result.apify = {
          available: false,
          message: error.message,
        };
      }
    }

    return result;
  }
}

/**
 * Create a unified Yelp scraper instance
 */
export function createUnifiedYelpScraper(
  brightDataToken?: string,
  apifyToken?: string,
  logger?: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
): UnifiedYelpScraper {
  return new UnifiedYelpScraper(
    brightDataToken || process.env.BRIGHTDATA_API_TOKEN,
    apifyToken || process.env.APIFY_API_TOKEN,
    logger
  );
}

export default UnifiedYelpScraper;
