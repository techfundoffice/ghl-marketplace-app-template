/*you provided is a TypeScript code that sets up an Express server and defines several routes
for handling HTTP requests. */
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { GHL } from "./ghl";
import * as CryptoJS from 'crypto-js'
import { json } from "body-parser";
import { db } from "../server/db";
import { businesses, reviewers, reviews, enrichments } from "../shared/schema";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { orchestratedYelpScrape } from "./ai-orchestrator";

const path = __dirname + "/ui/dist/";

dotenv.config();
const app: Express = express();
app.use(json({ type: 'application/json' }))

/*`app.use(express.static(path));` is setting up a middleware in the Express server. The
`express.static` middleware is used to serve static files such as HTML, CSS, JavaScript, and images. */
app.use(express.static(path));

/* The line `const ghl = new GHL();` is creating a new instance of the `GHL` class. It is assigning
this instance to the variable `ghl`. This allows you to use the methods and properties defined in
the `GHL` class to interact with the GoHighLevel API. */
const ghl = new GHL();

const port = parseInt(process.env.PORT || '5000', 10);
const host = '0.0.0.0';

/*`app.get("/authorize-handler", async (req: Request, res: Response) => { ... })` sets up an example how you can authorization requests */
app.get("/authorize-handler", async (req: Request, res: Response) => {
  const { code } = req.query;
  await ghl.authorizationHandler(code as string);
  res.redirect("https://app.gohighlevel.com/");
});

/*`app.get("/example-api-call", async (req: Request, res: Response) => { ... })` shows you how you can use ghl object to make get requests
 ghl object in abstract would handle all of the authorization part over here. */
app.get("/example-api-call", async (req: Request, res: Response) => {
  if (ghl.checkInstallationExists(req.query.companyId as string)) {
    try {
      const request = await ghl
        .requests(req.query.companyId as string)
        .get(`/users/search?companyId=${req.query.companyId}`, {
          headers: {
            Version: "2021-07-28",
          },
        });
      return res.send(request.data);
    } catch (error) {
      console.log(error);
    }
  }
  return res.send("Installation for this company does not exists");
});

/*`app.get("/example-api-call-location", async (req: Request, res: Response) => { ... })` shows you how you can use ghl object to make get requests
 ghl object in abstract would handle all of the authorization part over here. */
app.get("/example-api-call-location", async (req: Request, res: Response) => {
  /* The line `if(ghl.checkInstallationExists(req.params.locationId)){` is checking if an
    installation already exists for a specific location. It calls the `checkInstallationExists`
    method of the `GHL` class and passes the `locationId` as a parameter. This method checks if
    there is an existing installation for the provided locationId and returns a boolean value
    indicating whether the installation exists or not. */
  try {
    if (ghl.checkInstallationExists(req.params.locationId)) {
      const request = await ghl
        .requests(req.query.locationId as string)
        .get(`/contacts/?locationId=${req.query.locationId}`, {
          headers: {
            Version: "2021-07-28",
          },
        });
      return res.send(request.data);
    } else {
      /* NOTE: This flow would only work if you have a distribution type of both Location & Company & OAuth read-write scopes are configured. 
        The line `await ghl.getLocationTokenFromCompanyToken(req.query.companyId as string, req.query.locationId as string)`
         is calling the `getLocationTokenFromCompanyToken` method of the
        `GHL` class. This method is used to retrieve the location token for a specific location within a company. */
      await ghl.getLocationTokenFromCompanyToken(
        req.query.companyId as string,
        req.query.locationId as string
      );
      const request = await ghl
        .requests(req.query.locationId as string)
        .get(`/contacts/?locationId=${req.query.locationId}`, {
          headers: {
            Version: "2021-07-28",
          },
        });
      return res.send(request.data);
    }
  } catch (error) {
    console.log(error);
    res.send(error).status(400)
  }
});

/*`app.post("example-webhook-handler",async (req: Request, res: Response) => {
    console.log(req.body)
})` sets up a route for handling HTTP POST requests to the "/example-webhook-handler" endpoint. The below POST
api can be used to subscribe to various webhook events configured for the app. */
app.post("/example-webhook-handler",async (req: Request, res: Response) => {
    console.log(req.body)
    res.status(200).json({ message: "Webhook received successfully", data: req.body })
})

/* Direct API call to fetch contacts using provided token */
app.get("/get-contacts", async (req: Request, res: Response) => {
  const { locationId, token } = req.query;
  
  if (!locationId || !token) {
    return res.status(400).json({ 
      error: "Missing required parameters",
      usage: "/get-contacts?locationId=YOUR_LOCATION_ID&token=YOUR_TOKEN"
    });
  }

  try {
    const axios = require('axios');
    const apiDomain = process.env.GHL_API_DOMAIN || "https://services.leadconnectorhq.com";
    
    const response = await axios.get(`${apiDomain}/contacts/`, {
      params: { locationId },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Version': '2021-07-28'
      }
    });
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching contacts:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch contacts',
      details: error.response?.data || error.message 
    });
  }
})

/* Health check endpoint to test connection and configuration */
app.get("/test-connection", async (req: Request, res: Response) => {
  const config = {
    status: "Server is running",
    port: port,
    host: host,
    environment: {
      GHL_APP_CLIENT_ID: process.env.GHL_APP_CLIENT_ID ? "✓ Configured" : "✗ Missing",
      GHL_APP_CLIENT_SECRET: process.env.GHL_APP_CLIENT_SECRET ? "✓ Configured" : "✗ Missing",
      GHL_APP_SSO_KEY: process.env.GHL_APP_SSO_KEY ? "✓ Configured" : "✗ Missing",
      GHL_API_DOMAIN: process.env.GHL_API_DOMAIN || "https://services.leadconnectorhq.com (default)"
    },
    endpoints: {
      "/": "Vue.js Application",
      "/authorize-handler": "OAuth Authorization",
      "/example-api-call": "Company API Call",
      "/example-api-call-location": "Location API Call",
      "/get-contacts": "Get Contacts (Direct)",
      "/example-webhook-handler": "Webhook Handler",
      "/decrypt-sso": "SSO Decryption",
      "/test-connection": "Connection Test (current)"
    },
    notes: "To use API endpoints, you must first complete OAuth authorization flow"
  };
  res.json(config);
})


/* The `app.post("/decrypt-sso",async (req: Request, res: Response) => { ... })` route is used to
decrypt session details using ssoKey. */
app.post("/decrypt-sso",async (req: Request, res: Response) => {
  const {key} = req.body || {}
  if(!key){
    return res.status(400).send("Please send valid key")
  }
  try {
    const data = ghl.decryptSSOData(key)
    res.send(data)
  } catch (error) {
    res.status(400).send("Invalid Key")
    console.log(error)  
  }
})

/* Yelp Scraper endpoint using Apify - tri_angle/yelp-scraper with database persistence */
app.post("/api/yelp-scrape", async (req: Request, res: Response) => {
  const { ApifyClient } = require('apify-client');
  
  const { searchTerms, location, searchLimit = 10, directUrl } = req.body;
  
  if (!directUrl && (!searchTerms || !location)) {
    return res.status(400).json({ 
      error: "Missing required parameters",
      usage: { directUrl: "string (optional)", searchTerms: "string", location: "string", searchLimit: "number (optional)" }
    });
  }

  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) {
    return res.status(500).json({ error: "APIFY_API_TOKEN not configured" });
  }

  try {
    const client = new ApifyClient({ token: apifyToken });
    
    let input: any = {
      reviewLimit: 10,
      maxImages: 1,
      searchLimit: parseInt(searchLimit)
    };

    if (directUrl) {
      input.directUrls = [directUrl];
    } else {
      input.searchTerms = [searchTerms];
      input.locations = [location];
    }

    console.log("Starting Yelp scrape with tri_angle/yelp-scraper input:", input);
    
    const run = await client.actor("tri_angle/yelp-scraper").call(input);
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log("Raw Apify items:", JSON.stringify(items[0], null, 2));
    
    const savedBusinesses = [];

    for (const item of items) {
      const yelpId = item.bizId || item.id || item.businessId || item.alias;
      const businessName = item.name || item.businessName;
      const address = typeof item.address === 'string' ? item.address : 
        (item.address ? `${item.address.addressLine1 || ''}, ${item.address.city || ''}, ${item.address.regionCode || ''} ${item.address.postalCode || ''}`.trim() : 
        (item.location ? `${item.location.address1 || ''}, ${item.location.city || ''}, ${item.location.state || ''} ${item.location.zip_code || ''}`.trim() : ''));
      
      const existingBusiness = await db.select().from(businesses).where(eq(businesses.yelpId, yelpId)).limit(1);
      
      let savedBusiness;
      if (existingBusiness.length > 0) {
        savedBusiness = existingBusiness[0];
      } else {
        const [inserted] = await db.insert(businesses).values({
          yelpId,
          name: businessName,
          address,
          phone: item.phone || item.phoneNumber || item.display_phone,
          rating: item.rating || item.aggregatedRating || item.overallRating,
          reviewCount: item.reviewCount || item.review_count || item.numberOfReviews,
          categories: item.categories?.map((c: any) => typeof c === 'string' ? c : c.title || c.alias) || [],
          url: item.url || item.businessUrl,
          imageUrl: item.imageUrl || item.mainImageUrl || item.image_url,
        }).returning();
        savedBusiness = inserted;
      }

      const savedReviews = [];
      
      // Get business URL for review scraper
      const businessUrl = item.url || item.businessUrl || directUrl;
      
      if (businessUrl) {
        console.log("Fetching reviews with widbox/yelp-scraper for:", businessUrl);
        
        try {
          const reviewInput = {
            startUrls: [{ url: businessUrl }],
            maxReviews: 10,
            mode: "reviews"
          };
          
          console.log("Review scraper input:", JSON.stringify(reviewInput));
          const reviewRun = await client.actor("widbox/yelp-scraper").call(reviewInput);
          const { items: reviewItems } = await client.dataset(reviewRun.defaultDatasetId).listItems();
          
          console.log("Review scraper returned", reviewItems.length, "items");
          if (reviewItems.length > 0) {
            console.log("Sample review item:", JSON.stringify(reviewItems[0], null, 2));
          }
          
          for (const review of reviewItems) {
            const authorName = review.userName || review.user?.name || review.authorName || review.author?.name || 'Anonymous';
            const authorLocation = review.userLocation || review.user?.location || review.authorLocation || review.author?.location || '';
            const yelpUserId = review.userId || review.user?.id || review.author?.userId;
            
            let existingReviewer = await db.select().from(reviewers)
              .where(and(
                eq(reviewers.name, authorName),
                eq(reviewers.location, authorLocation)
              )).limit(1);
            
            let savedReviewer;
            if (existingReviewer.length > 0) {
              savedReviewer = existingReviewer[0];
            } else {
              const [inserted] = await db.insert(reviewers).values({
                yelpUserId,
                name: authorName,
                location: authorLocation,
              }).returning();
              savedReviewer = inserted;
            }

            const yelpReviewId = review.id || review.reviewId;
            
            let existingReview = yelpReviewId ? 
              await db.select().from(reviews).where(eq(reviews.yelpReviewId, yelpReviewId)).limit(1) : [];
            
            let savedReview;
            if (existingReview.length > 0) {
              savedReview = existingReview[0];
            } else {
              const [inserted] = await db.insert(reviews).values({
                yelpReviewId,
                businessId: savedBusiness.id,
                reviewerId: savedReviewer.id,
                rating: review.rating || review.stars,
                text: review.text || review.comment || review.reviewText,
                date: review.date || review.datePublished || review.time_created,
              }).returning();
              savedReview = inserted;
            }

            savedReviews.push({
              ...savedReview,
              reviewer: savedReviewer
            });
          }
          
          console.log(`Saved ${savedReviews.length} reviews for business: ${businessName}`);
        } catch (reviewError: any) {
          console.error("Error fetching reviews:", reviewError.message);
        }
      }

      savedBusinesses.push({
        ...savedBusiness,
        reviews: savedReviews
      });
    }

    console.log(`Scraped and saved ${savedBusinesses.length} businesses with reviews`);
    res.json({ success: true, businesses: savedBusinesses });
  } catch (error: any) {
    console.error('Yelp scrape error:', error);
    res.status(500).json({ 
      error: 'Failed to scrape Yelp',
      details: error.message 
    });
  }
});

/* AI-Orchestrated Yelp Scraper - uses AI to manage actor selection and fallbacks */
app.post("/api/yelp-scrape-ai", async (req: Request, res: Response) => {
  const { searchTerms, location, searchLimit = 10, directUrl } = req.body;
  
  if (!directUrl && (!searchTerms || !location)) {
    return res.status(400).json({ 
      error: "Missing required parameters",
      usage: { directUrl: "string (optional)", searchTerms: "string", location: "string", searchLimit: "number (optional)" }
    });
  }

  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) {
    return res.status(500).json({ error: "APIFY_API_TOKEN not configured" });
  }

  const logs: { message: string; type: string; time: string }[] = [];
  const logCallback = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    logs.push({ message, type, time });
    console.log(`[AI-Orchestrator] [${type}] ${message}`);
  };

  try {
    const result = await orchestratedYelpScrape(
      directUrl,
      searchTerms,
      location,
      parseInt(searchLimit),
      logCallback
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        logs,
        attempts: result.attempts
      });
    }

    // Save results to database
    const savedBusinesses = [];
    
    for (const business of result.businesses) {
      const yelpId = business.yelpId;
      
      const existingBusiness = await db.select().from(businesses).where(eq(businesses.yelpId, yelpId)).limit(1);
      
      let savedBusiness;
      if (existingBusiness.length > 0) {
        savedBusiness = existingBusiness[0];
      } else {
        const [inserted] = await db.insert(businesses).values({
          yelpId,
          name: business.name,
          address: business.address,
          phone: business.phone,
          rating: business.rating,
          reviewCount: business.reviewCount,
          categories: business.categories,
          url: business.url,
          imageUrl: business.imageUrl,
        }).returning();
        savedBusiness = inserted;
      }

      const savedReviews = [];
      for (const review of business.reviews || []) {
        const authorName = review.authorName || 'Anonymous';
        const authorLocation = review.authorLocation || '';
        
        let existingReviewer = await db.select().from(reviewers)
          .where(and(
            eq(reviewers.name, authorName),
            eq(reviewers.location, authorLocation)
          )).limit(1);
        
        let savedReviewer;
        if (existingReviewer.length > 0) {
          savedReviewer = existingReviewer[0];
        } else {
          const [inserted] = await db.insert(reviewers).values({
            yelpUserId: review.yelpUserId,
            name: authorName,
            location: authorLocation,
          }).returning();
          savedReviewer = inserted;
        }

        const yelpReviewId = review.yelpReviewId;
        let existingReview = yelpReviewId ? 
          await db.select().from(reviews).where(eq(reviews.yelpReviewId, yelpReviewId)).limit(1) : [];
        
        let savedReview;
        if (existingReview.length > 0) {
          savedReview = existingReview[0];
        } else {
          const [inserted] = await db.insert(reviews).values({
            yelpReviewId,
            businessId: savedBusiness.id,
            reviewerId: savedReviewer.id,
            rating: review.rating,
            text: review.text,
            date: review.date,
          }).returning();
          savedReview = inserted;
        }

        savedReviews.push({
          ...savedReview,
          reviewer: savedReviewer
        });
      }

      savedBusinesses.push({
        ...savedBusiness,
        reviews: savedReviews
      });
    }

    logCallback(`Saved ${savedBusinesses.length} businesses to database`, 'success');

    res.json({ 
      success: true, 
      businesses: savedBusinesses,
      actorUsed: result.actorUsed,
      attempts: result.attempts,
      logs
    });
  } catch (error: any) {
    console.error('AI-Orchestrated Yelp scrape error:', error);
    res.status(500).json({ 
      error: 'Failed to scrape Yelp',
      details: error.message,
      logs
    });
  }
});

/* People Data Labs Consumer Enrichment endpoint with database persistence */
app.post("/api/enrich-consumer", async (req: Request, res: Response) => {
  const axios = require('axios');
  
  const { reviewerId, name, location, email, phone, linkedin } = req.body;
  
  if (!reviewerId) {
    return res.status(400).json({ 
      error: "reviewerId is required",
      usage: { reviewerId: "number (database ID)", name: "string", location: "string", email: "string", phone: "string", linkedin: "string" }
    });
  }

  const reviewer = await db.select().from(reviewers).where(eq(reviewers.id, parseInt(reviewerId))).limit(1);
  if (reviewer.length === 0) {
    return res.status(404).json({ error: "Reviewer not found" });
  }

  const existingEnrichment = await db.select().from(enrichments).where(eq(enrichments.reviewerId, parseInt(reviewerId))).limit(1);
  if (existingEnrichment.length > 0) {
    return res.json({ 
      success: true, 
      alreadyEnriched: true,
      enrichment: existingEnrichment[0]
    });
  }

  const reviewerData = reviewer[0];
  const enrichName = name || reviewerData.name;
  const enrichLocation = location || reviewerData.location;

  if (!enrichName && !email && !phone && !linkedin) {
    return res.status(400).json({ 
      error: "At least one identifier required (name from reviewer or provided)",
      usage: { reviewerId: "number", name: "string", location: "string", email: "string", phone: "string", linkedin: "string" }
    });
  }

  const pdlApiKey = process.env.PDL_API_KEY;
  if (!pdlApiKey) {
    return res.status(500).json({ error: "PDL_API_KEY not configured" });
  }

  try {
    const params: any = {};
    
    if (email) params.email = email;
    if (phone) params.phone = phone;
    if (linkedin) params.profile = linkedin;
    if (enrichName) {
      const nameParts = enrichName.split(' ');
      if (nameParts.length >= 2) {
        params.first_name = nameParts[0];
        params.last_name = nameParts.slice(1).join(' ');
      } else {
        params.name = enrichName;
      }
    }
    if (enrichLocation) params.location = enrichLocation;

    console.log("Enriching consumer with params:", params);

    const response = await axios.get('https://api.peopledatalabs.com/v5/person/enrich', {
      params,
      headers: {
        'X-Api-Key': pdlApiKey
      }
    });

    const data = response.data.data;
    
    const [savedEnrichment] = await db.insert(enrichments).values({
      reviewerId: parseInt(reviewerId),
      success: true,
      likelihood: response.data.likelihood,
      email: data.work_email || data.personal_emails?.[0],
      phone: data.mobile_phone || data.phone_numbers?.[0],
      linkedin: data.linkedin_url,
      company: data.job_company_name,
      jobTitle: data.job_title,
      city: data.location_locality,
      state: data.location_region,
      country: data.location_country,
      industry: data.industry,
      rawData: data,
    }).returning();

    console.log("Enrichment successful, likelihood:", response.data.likelihood);
    res.json({ success: true, enrichment: savedEnrichment });
  } catch (error: any) {
    if (error.response?.status === 404) {
      const [savedEnrichment] = await db.insert(enrichments).values({
        reviewerId: parseInt(reviewerId),
        success: false,
        likelihood: 0,
      }).returning();

      return res.json({ 
        success: false, 
        message: "No matching consumer found",
        enrichment: savedEnrichment
      });
    }
    console.error('PDL enrichment error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to enrich consumer',
      details: error.response?.data || error.message 
    });
  }
});

/* Get all businesses with reviews and reviewers */
app.get("/api/businesses", async (req: Request, res: Response) => {
  try {
    const allBusinesses = await db.select().from(businesses);
    
    const businessesWithReviews = await Promise.all(
      allBusinesses.map(async (business) => {
        const businessReviews = await db
          .select({
            id: reviews.id,
            yelpReviewId: reviews.yelpReviewId,
            businessId: reviews.businessId,
            reviewerId: reviews.reviewerId,
            rating: reviews.rating,
            text: reviews.text,
            date: reviews.date,
            createdAt: reviews.createdAt,
            reviewerName: reviewers.name,
            reviewerLocation: reviewers.location,
            reviewerYelpUserId: reviewers.yelpUserId,
          })
          .from(reviews)
          .leftJoin(reviewers, eq(reviews.reviewerId, reviewers.id))
          .where(eq(reviews.businessId, business.id));

        return {
          ...business,
          reviews: businessReviews.map(r => ({
            id: r.id,
            yelpReviewId: r.yelpReviewId,
            businessId: r.businessId,
            reviewerId: r.reviewerId,
            rating: r.rating,
            text: r.text,
            date: r.date,
            createdAt: r.createdAt,
            authorName: r.reviewerName || 'Anonymous',
            authorLocation: r.reviewerLocation || '',
            reviewer: {
              id: r.reviewerId,
              name: r.reviewerName,
              location: r.reviewerLocation,
              yelpUserId: r.reviewerYelpUserId,
            }
          }))
        };
      })
    );

    res.json({ success: true, businesses: businessesWithReviews });
  } catch (error: any) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch businesses',
      details: error.message 
    });
  }
});

/* Get all reviewers with full business, review, and enrichment data */
app.get("/api/reviewers-full", async (req: Request, res: Response) => {
  try {
    const fullData = await db.select({
      reviewerId: reviewers.id,
      reviewerName: reviewers.name,
      reviewerLocation: reviewers.location,
      reviewerYelpUserId: reviewers.yelpUserId,
      businessId: businesses.id,
      businessName: businesses.name,
      businessAddress: businesses.address,
      reviewId: reviews.id,
      reviewRating: reviews.rating,
      reviewDate: reviews.date,
      reviewText: reviews.text,
      enrichmentId: enrichments.id,
      enrichmentSuccess: enrichments.success,
      enrichmentLikelihood: enrichments.likelihood,
      email: enrichments.email,
      phone: enrichments.phone,
      linkedin: enrichments.linkedin,
      facebook: enrichments.facebook,
      instagram: enrichments.instagram,
      whatsapp: enrichments.whatsapp,
      twitter: enrichments.twitter,
      company: enrichments.company,
      jobTitle: enrichments.jobTitle,
      enrichmentCity: enrichments.city,
      enrichmentState: enrichments.state,
    })
    .from(reviewers)
    .leftJoin(reviews, eq(reviewers.id, reviews.reviewerId))
    .leftJoin(businesses, eq(reviews.businessId, businesses.id))
    .leftJoin(enrichments, eq(reviewers.id, enrichments.reviewerId));

    const parseReviewerName = (name: string) => {
      if (!name || name === 'Anonymous') {
        return { firstName: 'Anonymous', lastInitial: '', lastName: '' };
      }
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) {
        return { firstName: parts[0], lastInitial: '', lastName: '' };
      }
      const firstName = parts[0];
      const lastPart = parts[parts.length - 1];
      if (lastPart.length === 2 && lastPart.endsWith('.')) {
        return { firstName, lastInitial: lastPart.replace('.', ''), lastName: '' };
      }
      const lastName = parts.slice(1).join(' ');
      const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
      return { firstName, lastInitial, lastName };
    };

    const parseAddress = (address: string | null) => {
      if (!address) return { street: '', city: '', state: '', zip: '' };
      const parts = address.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        const stateZip = parts[parts.length - 1].split(/\s+/);
        const state = stateZip[0] || '';
        const zip = stateZip.slice(1).join(' ') || '';
        const city = parts[parts.length - 2] || '';
        const street = parts.slice(0, -2).join(', ');
        return { street, city, state, zip };
      }
      return { street: address, city: '', state: '', zip: '' };
    };

    const formattedData = fullData.map(r => {
      const parsedName = parseReviewerName(r.reviewerName);
      const parsedAddress = parseAddress(r.businessAddress);
      return {
        reviewerId: r.reviewerId,
        businessName: r.businessName || '',
        address: parsedAddress.street,
        city: parsedAddress.city,
        state: parsedAddress.state,
        zip: parsedAddress.zip,
        reviewRating: r.reviewRating,
        reviewDate: r.reviewDate,
        reviewerFirstName: parsedName.firstName,
        reviewerLastInitial: parsedName.lastInitial,
        reviewerLastName: parsedName.lastName,
        isEnriched: r.enrichmentId !== null,
        email: r.email || '',
        phone: r.phone || '',
        linkedin: r.linkedin || '',
        facebook: r.facebook || '',
        instagram: r.instagram || '',
        whatsapp: r.whatsapp || '',
        twitter: r.twitter || '',
        company: r.company || '',
        jobTitle: r.jobTitle || '',
      };
    });

    res.json({ success: true, reviewers: formattedData, count: formattedData.length });
  } catch (error: any) {
    console.error('Error fetching full reviewers data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reviewers data',
      details: error.message 
    });
  }
});

/* Get all reviewers with enrichment status */
app.get("/api/reviewers", async (req: Request, res: Response) => {
  try {
    const allReviewers = await db.select({
      id: reviewers.id,
      yelpUserId: reviewers.yelpUserId,
      name: reviewers.name,
      location: reviewers.location,
      createdAt: reviewers.createdAt,
      enrichmentId: enrichments.id,
      enrichmentSuccess: enrichments.success,
      enrichmentLikelihood: enrichments.likelihood,
      enrichmentEmail: enrichments.email,
      enrichmentPhone: enrichments.phone,
      enrichmentCompany: enrichments.company,
      enrichmentJobTitle: enrichments.jobTitle,
      enrichedAt: enrichments.enrichedAt,
    })
    .from(reviewers)
    .leftJoin(enrichments, eq(reviewers.id, enrichments.reviewerId));

    const formattedReviewers = allReviewers.map(r => ({
      id: r.id,
      yelpUserId: r.yelpUserId,
      name: r.name,
      location: r.location,
      createdAt: r.createdAt,
      isEnriched: r.enrichmentId !== null,
      enrichment: r.enrichmentId ? {
        id: r.enrichmentId,
        success: r.enrichmentSuccess,
        likelihood: r.enrichmentLikelihood,
        email: r.enrichmentEmail,
        phone: r.enrichmentPhone,
        company: r.enrichmentCompany,
        jobTitle: r.enrichmentJobTitle,
        enrichedAt: r.enrichedAt,
      } : null
    }));

    res.json({ success: true, reviewers: formattedReviewers, count: formattedReviewers.length });
  } catch (error: any) {
    console.error('Error fetching reviewers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reviewers',
      details: error.message 
    });
  }
});

/*`app.get("*", function (req, res) {
  res.sendFile(path + "index.html");
});` sets up a catch-all route for SPA routing.
All routes that don't match API endpoints will serve the index.html. */
app.get("*", function (req, res) {
  res.sendFile(path + "index.html");
});

/*`app.listen(port, host, () => {
  console.log(`GHL app listening on port `);
});` is starting the Express server and making it listen on the specified port and host. */
app.listen(port, host, () => {
  console.log(`GHL app listening on ${host}:${port}`);
});
