import OpenAI from "openai";
import { ApifyClient } from "apify-client";

// This is using Replit's AI Integrations service - no API key needed, charges billed to Replit credits
const openrouter = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY
});

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN
});

interface ScrapeResult {
  success: boolean;
  businesses: any[];
  actorUsed: string;
  attempts: AttemptLog[];
  error?: string;
}

interface AttemptLog {
  actor: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  timestamp: string;
}

// List of known Yelp scraper actors (free or pay-as-you-go only, no rental required)
// NOTE: widbox/yelp-scraper removed - requires paid rental subscription
const YELP_ACTORS = [
  { id: 'yin/yelp-scraper', name: 'Free Yelp Web Scraper', priority: 1 },  // Free scraper with business info + reviews
  { id: 'tri_angle/yelp-scraper', name: 'Triangle Yelp Scraper', priority: 2 },  // Backup scraper
  { id: 'tri_angle/yelp-review-scraper', name: 'Triangle Yelp Review Scraper', priority: 3 },
  { id: 'web_wanderer/yelp-reviews-scraper', name: 'Web Wanderer Yelp Reviews', priority: 4 },
];

// AI decides which actor to try next based on error context
async function getAIRecommendation(
  targetUrl: string,
  failedActors: { actor: string; error: string }[],
  availableActors: typeof YELP_ACTORS
): Promise<{ actorId: string; reasoning: string }> {
  const prompt = `You are an AI orchestrator for web scraping. Your job is to select the best Apify actor to scrape Yelp reviews.

Target URL: ${targetUrl}

Failed attempts:
${failedActors.map(f => `- ${f.actor}: ${f.error}`).join('\n') || 'None yet'}

Available actors to try:
${availableActors.map(a => `- ${a.id} (priority ${a.priority})`).join('\n')}

Select the best actor to try next. Consider:
1. Actors that haven't been tried yet
2. Error patterns from failed attempts
3. Actor priority (lower is better)

Respond in JSON format only:
{"actorId": "actor/name", "reasoning": "brief explanation"}`;

  try {
    const response = await openrouter.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 256,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('AI recommendation error:', error);
  }

  // Fallback: pick first untried actor
  const triedIds = failedActors.map(f => f.actor);
  const untried = availableActors.find(a => !triedIds.includes(a.id));
  return {
    actorId: untried?.id || availableActors[0].id,
    reasoning: 'Fallback selection - trying next available actor'
  };
}

// Build actor input based on actor type
function buildActorInput(actorId: string, directUrl: string, searchTerms?: string, location?: string, limit: number = 10): any {
  const baseInput: any = {};

  // Add proxy configuration (required by most actors)
  const proxyConfig = { useApifyProxy: true };

  // yin/yelp-scraper - Free Yelp Web Scraper (primary choice)
  if (actorId.includes('yin/yelp')) {
    if (directUrl) {
      baseInput.directUrls = [directUrl];
    } else {
      baseInput.searchTerms = [searchTerms];
      baseInput.locations = [location];
    }
    baseInput.searchLimit = limit;
    baseInput.maxImages = 5;
    baseInput.proxy = proxyConfig;
    return baseInput;
  }

  // widbox/yelp-scraper requires bizUrl and sortType (reviews only scraper)
  if (actorId.includes('widbox')) {
    if (directUrl) {
      baseInput.bizUrl = directUrl;
      baseInput.sortType = "DATE_DESC";
      baseInput.reviewsCount = limit * 10; // Get more reviews
      baseInput.proxy = proxyConfig;
    } else {
      // widbox doesn't support search - needs direct URL
      throw new Error('widbox/yelp-scraper requires a direct URL');
    }
    return baseInput;
  } else if (actorId.includes('epctex')) {
    if (directUrl) {
      baseInput.startUrls = [{ url: directUrl }];
    } else {
      baseInput.searchTerms = [searchTerms];
      baseInput.locations = [location];
    }
    baseInput.includeReviews = true;
    baseInput.maxItems = limit;
    baseInput.proxy = proxyConfig;
  } else if (actorId.includes('apify/yelp')) {
    if (directUrl) {
      baseInput.startUrls = [{ url: directUrl }];
    } else {
      baseInput.searchTerms = searchTerms;
      baseInput.location = location;
    }
    baseInput.maxResults = limit;
    baseInput.includeReviews = true;
    baseInput.proxy = proxyConfig;
  } else if (actorId.includes('tri_angle')) {
    if (directUrl) {
      baseInput.directUrls = [directUrl];
    } else {
      baseInput.searchTerms = [searchTerms];
      baseInput.locations = [location];
    }
    baseInput.searchLimit = limit;
    baseInput.reviewLimit = 10;
    baseInput.maxImages = 1;
    baseInput.proxy = proxyConfig;
  } else if (actorId.includes('yelp-review-scraper')) {
    if (directUrl) {
      baseInput.directUrls = [directUrl];
    } else {
      baseInput.searchTerms = [searchTerms];
      baseInput.locations = [location];
    }
    baseInput.reviewLimit = limit;
    baseInput.proxy = proxyConfig;
  } else if (actorId.includes('web_wanderer')) {
    if (directUrl) {
      baseInput.startUrls = [directUrl];
    } else {
      baseInput.searchTerms = searchTerms;
      baseInput.location = location;
    }
    baseInput.maxReviews = limit;
    baseInput.proxy = proxyConfig;
  } else if (actorId.includes('agents/yelp')) {
    if (directUrl) {
      baseInput.startUrls = [{ url: directUrl }];
    }
    baseInput.maxItems = limit;
    baseInput.proxy = proxyConfig;
  } else {
    // Generic fallback
    if (directUrl) {
      baseInput.url = directUrl;
      baseInput.startUrls = [{ url: directUrl }];
    }
    baseInput.maxItems = limit;
    baseInput.proxy = proxyConfig;
  }

  return baseInput;
}

// Normalize different actor output formats to a common structure
function normalizeResults(actorId: string, items: any[]): any[] {
  // yin/yelp-scraper format
  if (actorId.includes('yin/yelp')) {
    return items.map(item => {
      // Extract business info from yin/yelp-scraper format
      const business = {
        yelpId: item.bizId || item.id || item.alias || extractYelpIdFromUrl(item.directUrl || item.url),
        name: item.name || item.businessName,
        address: typeof item.address === 'string' ? item.address :
          (item.address ? `${item.address.addressLine1 || item.address.street || ''}, ${item.address.city || ''}, ${item.address.regionCode || item.address.state || ''}`.trim() :
          (item.location ? `${item.location.address1 || ''}, ${item.location.city || ''}, ${item.location.state || ''}`.trim() : '')),
        phone: item.phone || item.phoneNumber || item.display_phone,
        rating: item.aggregatedRating || item.rating || item.overallRating,
        reviewCount: item.reviewCount || item.review_count || item.numberOfReviews,
        categories: item.categories?.map((c: any) => typeof c === 'string' ? c : c.title || c.alias) ||
          (item.type ? [item.type] : []) || (item.cuisine ? [item.cuisine] : []),
        url: item.directUrl || item.url || item.businessUrl,
        imageUrl: item.primaryPhoto || item.imageUrl || item.mainImageUrl || item.image_url,
      };

      // Extract reviews from yin/yelp-scraper format
      const reviewsArray = item.reviews || item.reviewsList || [];
      const reviews = reviewsArray.map((review: any, idx: number) => ({
        yelpReviewId: review.id || review.reviewId || review.reviewAlias || review.review_id ||
          `${business.yelpId}-${review.reviewerUrl || review.userId || idx}-${review.date || Date.now()}`,
        authorName: review.reviewerName || review.author?.name || review.userName || review.user?.name || review.authorName || 'Anonymous',
        authorLocation: review.reviewerLocation || review.author?.location || review.userLocation || review.user?.location || review.authorLocation || '',
        yelpUserId: extractUserIdFromUrl(review.reviewerUrl) || review.author?.userId || review.userId || review.user?.id,
        rating: review.rating || review.stars,
        text: review.text || review.comment || review.reviewText || review.reviewContent,
        date: review.date || review.datePublished || review.time_created,
      }));

      return { ...business, reviews };
    });
  }

  // widbox/yelp-scraper returns reviews directly, not business objects
  if (actorId.includes('widbox')) {
    // Group reviews by business if possible, or create a single business
    const reviewsList = items.map((review: any, idx: number) => ({
      yelpReviewId: review.id || review.reviewId || review.review_id || review.reviewAlias ||
        `widbox-${review.userId || review.user_id || idx}-${review.date || Date.now()}`,
      authorName: review.userName || review.user_name || review.reviewer_name || review.reviewerName ||
        review.user?.name || review.authorName || review.author?.name || review.name || 'Anonymous',
      authorLocation: review.userLocation || review.user_location || review.reviewer_location || review.reviewerLocation ||
        review.user?.location || review.authorLocation || review.author?.location || '',
      yelpUserId: review.userId || review.user_id || review.reviewer_id ||
        review.user?.id || review.author?.userId || review.author_id,
      rating: review.rating || review.stars || review.review_rating,
      text: review.text || review.comment || review.reviewText || review.review_text || review.content,
      date: review.date || review.datePublished || review.time_created || review.review_date,
    }));

    // Extract business info from first item if available
    const firstItem = items[0] || {};
    const business = {
      yelpId: firstItem.bizId || firstItem.businessId || firstItem.business_id || extractYelpIdFromUrl(firstItem.bizUrl) || 'widbox-business',
      name: firstItem.businessName || firstItem.business_name || firstItem.name || 'Business',
      address: firstItem.businessAddress || firstItem.business_address || firstItem.address || '',
      phone: firstItem.businessPhone || firstItem.business_phone || firstItem.phone || '',
      rating: firstItem.businessRating || firstItem.business_rating || firstItem.overallRating || 0,
      reviewCount: items.length,
      categories: [],
      url: firstItem.bizUrl || firstItem.businessUrl || firstItem.business_url || '',
      imageUrl: firstItem.businessImage || firstItem.business_image || '',
      reviews: reviewsList
    };

    return [business];
  }

  return items.map(item => {
    // Extract business info (generic format)
    const business = {
      yelpId: item.bizId || item.id || item.businessId || item.alias || extractYelpIdFromUrl(item.url || item.directUrl),
      name: item.name || item.businessName,
      address: typeof item.address === 'string' ? item.address :
        (item.address ? `${item.address.addressLine1 || ''}, ${item.address.city || ''}, ${item.address.regionCode || ''}`.trim() :
        (item.location ? `${item.location.address1 || ''}, ${item.location.city || ''}, ${item.location.state || ''}`.trim() : '')),
      phone: item.phone || item.phoneNumber || item.display_phone,
      rating: item.rating || item.aggregatedRating || item.overallRating,
      reviewCount: item.reviewCount || item.review_count || item.numberOfReviews,
      categories: item.categories?.map((c: any) => typeof c === 'string' ? c : c.title || c.alias) || [],
      url: item.url || item.directUrl || item.businessUrl,
      imageUrl: item.imageUrl || item.primaryPhoto || item.mainImageUrl || item.image_url,
    };

    // Extract reviews
    const reviewsArray = item.reviews || item.reviewsList || [];
    const reviews = reviewsArray.map((review: any, idx: number) => ({
      yelpReviewId: review.id || review.reviewId || review.reviewAlias || review.review_id ||
        `${business.yelpId}-${review.author?.userId || review.userId || idx}-${review.date || Date.now()}`,
      authorName: review.reviewerName || review.author?.name || review.userName || review.user?.name || review.authorName || 'Anonymous',
      authorLocation: review.reviewerLocation || review.author?.location || review.userLocation || review.user?.location || review.authorLocation || '',
      yelpUserId: review.author?.userId || review.userId || review.user?.id,
      rating: review.rating || review.stars,
      text: review.text || review.comment || review.reviewText,
      date: review.date || review.datePublished || review.time_created,
    }));

    return { ...business, reviews };
  });
}

// Helper function to extract Yelp business ID from URL
function extractYelpIdFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const match = url.match(/\/biz\/([^?\/]+)/);
  return match ? match[1] : undefined;
}

// Helper function to extract user ID from Yelp user URL
function extractUserIdFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const match = url.match(/userid=([^&]+)/) || url.match(/user_id=([^&]+)/);
  return match ? match[1] : undefined;
}

// Main orchestrator function - AI manages retries and fallbacks
export async function orchestratedYelpScrape(
  directUrl?: string,
  searchTerms?: string,
  location?: string,
  limit: number = 10,
  onLog?: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
): Promise<ScrapeResult> {
  const log = onLog || ((msg: string, type: string) => console.log(`[${type}] ${msg}`));
  const attempts: AttemptLog[] = [];
  const failedActors: { actor: string; error: string }[] = [];
  const targetUrl = directUrl || `${searchTerms} in ${location}`;

  log('AI Orchestrator initialized', 'info');
  log(`Target: ${targetUrl}`, 'info');

  // Try up to 4 different actors
  for (let attempt = 0; attempt < 4; attempt++) {
    // Ask AI which actor to try
    log('AI selecting best actor...', 'info');
    const recommendation = await getAIRecommendation(targetUrl, failedActors, YELP_ACTORS);
    
    log(`AI selected: ${recommendation.actorId}`, 'info');
    log(`Reasoning: ${recommendation.reasoning}`, 'info');

    const actorId = recommendation.actorId;
    const timestamp = new Date().toISOString();

    try {
      log(`Calling ${actorId}...`, 'info');
      
      const input = buildActorInput(actorId, directUrl || '', searchTerms, location, limit);
      log(`Actor input: ${JSON.stringify(input).substring(0, 100)}...`, 'info');

      const run = await apifyClient.actor(actorId).call(input);
      
      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      
      if (!items || items.length === 0) {
        throw new Error('No results returned from actor');
      }

      log(`Received ${items.length} results from ${actorId}`, 'success');
      
      const normalizedResults = normalizeResults(actorId, items);
      
      attempts.push({
        actor: actorId,
        status: 'success',
        message: `Successfully scraped ${normalizedResults.length} businesses`,
        timestamp
      });

      log(`Scrape completed successfully!`, 'success');
      
      return {
        success: true,
        businesses: normalizedResults,
        actorUsed: actorId,
        attempts
      };

    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      log(`${actorId} failed: ${errorMsg}`, 'error');
      
      attempts.push({
        actor: actorId,
        status: 'failed',
        message: errorMsg,
        timestamp
      });

      failedActors.push({ actor: actorId, error: errorMsg });
      
      log(`AI will select alternative actor...`, 'warning');
    }
  }

  // All attempts failed
  log('All actors failed. Scrape unsuccessful.', 'error');
  
  return {
    success: false,
    businesses: [],
    actorUsed: 'none',
    attempts,
    error: 'All available actors failed to scrape Yelp'
  };
}

// Search Apify store for additional Yelp scrapers (pay-as-you-go only)
export async function searchApifyActors(query: string = 'yelp scraper'): Promise<any[]> {
  try {
    const response = await apifyClient.actors().list({
      limit: 20
    });
    
    // Filter to likely pay-as-you-go actors and match query
    return response.items.filter((actor: any) => {
      const nameMatch = actor.name?.toLowerCase().includes(query.toLowerCase()) || 
                        actor.title?.toLowerCase().includes(query.toLowerCase());
      const pricing = actor.stats?.pricing;
      // Most PAYG actors have per-run pricing, not monthly
      const isPAYG = !pricing?.monthly || pricing?.monthly === 0;
      return nameMatch && isPAYG;
    });
  } catch (error) {
    console.error('Failed to search Apify store:', error);
    return [];
  }
}
