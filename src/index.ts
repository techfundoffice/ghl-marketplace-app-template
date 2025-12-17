/*you provided is a TypeScript code that sets up an Express server and defines several routes
for handling HTTP requests. */
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { GHL } from "./ghl";
import * as CryptoJS from 'crypto-js'
import { json } from "body-parser";

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

/* Yelp Scraper endpoint using Apify */
app.post("/api/yelp-scrape", async (req: Request, res: Response) => {
  const { ApifyClient } = require('apify-client');
  
  const { searchTerms, location, searchLimit = 10, reviewLimit = 5, directUrl } = req.body;
  
  if (!directUrl && (!searchTerms || !location)) {
    return res.status(400).json({ 
      error: "Missing required parameters",
      usage: { directUrl: "string (optional)", searchTerms: "string", location: "string", searchLimit: "number (optional)", reviewLimit: "number (optional)" }
    });
  }

  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) {
    return res.status(500).json({ error: "APIFY_API_TOKEN not configured" });
  }

  try {
    const client = new ApifyClient({ token: apifyToken });
    
    let input: any = {
      maxImages: 1,
      reviewLimit: parseInt(reviewLimit),
      reviewsLanguage: "ALL"
    };

    if (directUrl) {
      input.directUrls = [directUrl];
    } else {
      input.searchTerms = [searchTerms];
      input.locations = [location];
      input.searchLimit = parseInt(searchLimit);
    }

    console.log("Starting Yelp scrape with input:", input);
    
    const run = await client.actor("tri_angle/yelp-scraper").call(input);
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log("Raw Apify items:", JSON.stringify(items[0], null, 2));
    
    const businesses = items.map((item: any) => {
      const reviewsArray = item.reviews || item.reviewsList || [];
      
      return {
        id: item.bizId || item.id || item.businessId,
        name: item.name || item.businessName,
        address: typeof item.address === 'string' ? item.address : 
          (item.address ? `${item.address.addressLine1 || ''}, ${item.address.city || ''}, ${item.address.regionCode || ''} ${item.address.postalCode || ''}`.trim() : ''),
        phone: item.phone || item.phoneNumber,
        rating: item.rating || item.aggregatedRating || item.overallRating,
        reviewCount: item.reviewCount || item.numberOfReviews,
        categories: item.categories || [],
        url: item.url || item.businessUrl,
        imageUrl: item.imageUrl || item.mainImageUrl,
        reviews: reviewsArray.map((review: any) => ({
          id: review.id || review.reviewId,
          authorName: review.author?.name || review.userName || review.user?.name || review.authorName || 'Anonymous',
          authorLocation: review.author?.location || review.userLocation || review.user?.location || review.authorLocation || '',
          rating: review.rating || review.stars,
          text: review.text || review.comment || review.reviewText,
          date: review.date || review.datePublished
        }))
      };
    });

    console.log(`Scraped ${businesses.length} businesses`);
    res.json({ success: true, businesses });
  } catch (error: any) {
    console.error('Yelp scrape error:', error);
    res.status(500).json({ 
      error: 'Failed to scrape Yelp',
      details: error.message 
    });
  }
});

/* People Data Labs Consumer Enrichment endpoint */
app.post("/api/enrich-consumer", async (req: Request, res: Response) => {
  const axios = require('axios');
  
  const { name, location, email, phone, linkedin } = req.body;
  
  if (!name && !email && !phone && !linkedin) {
    return res.status(400).json({ 
      error: "At least one identifier required",
      usage: { name: "string", location: "string", email: "string", phone: "string", linkedin: "string" }
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
    if (name) {
      const nameParts = name.split(' ');
      if (nameParts.length >= 2) {
        params.first_name = nameParts[0];
        params.last_name = nameParts.slice(1).join(' ');
      } else {
        params.name = name;
      }
    }
    if (location) params.location = location;

    console.log("Enriching consumer with params:", params);

    const response = await axios.get('https://api.peopledatalabs.com/v5/person/enrich', {
      params,
      headers: {
        'X-Api-Key': pdlApiKey
      }
    });

    const data = response.data.data;
    
    const enrichedData = {
      success: true,
      likelihood: response.data.likelihood,
      consumer: {
        fullName: data.full_name,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.work_email || data.personal_emails?.[0],
        phone: data.mobile_phone || data.phone_numbers?.[0],
        linkedin: data.linkedin_url,
        location: data.location_name,
        city: data.location_locality,
        state: data.location_region,
        country: data.location_country,
        jobTitle: data.job_title,
        company: data.job_company_name,
        industry: data.industry,
        skills: data.skills,
        education: data.education?.map((edu: any) => ({
          school: edu.school?.name,
          degree: edu.degrees?.[0],
          field: edu.majors?.[0]
        })),
        socialProfiles: {
          linkedin: data.linkedin_url,
          twitter: data.twitter_url,
          facebook: data.facebook_url,
          github: data.github_url
        }
      }
    };

    console.log("Enrichment successful, likelihood:", response.data.likelihood);
    res.json(enrichedData);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.json({ 
        success: false, 
        message: "No matching consumer found",
        consumer: null 
      });
    }
    console.error('PDL enrichment error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to enrich consumer',
      details: error.response?.data || error.message 
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
