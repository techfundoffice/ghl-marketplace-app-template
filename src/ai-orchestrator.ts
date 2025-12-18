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
const YELP_ACTORS = [
  { id: 'tri_angle/yelp-scraper', name: 'Triangle Yelp Scraper', priority: 1 },
  { id: 'tri_angle/yelp-review-scraper', name: 'Triangle Yelp Review Scraper', priority: 2 },
  { id: 'web_wanderer/yelp-reviews-scraper', name: 'Web Wanderer Yelp Reviews', priority: 3 },
  { id: 'agents/yelp-business', name: 'Agents Yelp Business', priority: 4 },
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

  if (actorId.includes('epctex')) {
    if (directUrl) {
      baseInput.startUrls = [{ url: directUrl }];
    } else {
      baseInput.searchTerms = [searchTerms];
      baseInput.locations = [location];
    }
    baseInput.includeReviews = true;
    baseInput.maxItems = limit;
  } else if (actorId.includes('apify/yelp')) {
    if (directUrl) {
      baseInput.startUrls = [{ url: directUrl }];
    } else {
      baseInput.searchTerms = searchTerms;
      baseInput.location = location;
    }
    baseInput.maxResults = limit;
    baseInput.includeReviews = true;
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
  } else if (actorId.includes('yelp-review-scraper')) {
    if (directUrl) {
      baseInput.directUrls = [directUrl];
    } else {
      baseInput.searchTerms = [searchTerms];
      baseInput.locations = [location];
    }
    baseInput.reviewLimit = limit;
  } else if (actorId.includes('web_wanderer')) {
    if (directUrl) {
      baseInput.startUrls = [directUrl];
    } else {
      baseInput.searchTerms = searchTerms;
      baseInput.location = location;
    }
    baseInput.maxReviews = limit;
  } else if (actorId.includes('agents/yelp')) {
    if (directUrl) {
      baseInput.startUrls = [{ url: directUrl }];
    }
    baseInput.maxItems = limit;
  } else {
    // Generic fallback
    if (directUrl) {
      baseInput.url = directUrl;
      baseInput.startUrls = [{ url: directUrl }];
    }
    baseInput.maxItems = limit;
  }

  return baseInput;
}

// Normalize different actor output formats to a common structure
function normalizeResults(actorId: string, items: any[]): any[] {
  return items.map(item => {
    // Extract business info
    const business = {
      yelpId: item.bizId || item.id || item.businessId || item.alias,
      name: item.name || item.businessName,
      address: typeof item.address === 'string' ? item.address : 
        (item.address ? `${item.address.addressLine1 || ''}, ${item.address.city || ''}, ${item.address.regionCode || ''}`.trim() : 
        (item.location ? `${item.location.address1 || ''}, ${item.location.city || ''}, ${item.location.state || ''}`.trim() : '')),
      phone: item.phone || item.phoneNumber || item.display_phone,
      rating: item.rating || item.aggregatedRating || item.overallRating,
      reviewCount: item.reviewCount || item.review_count || item.numberOfReviews,
      categories: item.categories?.map((c: any) => typeof c === 'string' ? c : c.title || c.alias) || [],
      url: item.url || item.businessUrl,
      imageUrl: item.imageUrl || item.mainImageUrl || item.image_url,
    };

    // Extract reviews
    const reviewsArray = item.reviews || item.reviewsList || [];
    const reviews = reviewsArray.map((review: any) => ({
      yelpReviewId: review.id || review.reviewId || review.reviewAlias || review.review_id || 
        `${business.yelpId}-${review.author?.userId || review.userId || ''}-${review.date || ''}`,
      authorName: review.author?.name || review.userName || review.user?.name || review.authorName || 'Anonymous',
      authorLocation: review.author?.location || review.userLocation || review.user?.location || review.authorLocation || '',
      yelpUserId: review.author?.userId || review.userId || review.user?.id,
      rating: review.rating || review.stars,
      text: review.text || review.comment || review.reviewText,
      date: review.date || review.datePublished || review.time_created,
    }));

    return { ...business, reviews };
  });
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
