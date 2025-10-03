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

/*`app.get("/", function (req, res) {
  res.sendFile(path + "index.html");
});` sets up a route for the root URL ("/") of the server.  This is
 used to serve the main HTML file of a web application. */
app.get("/", function (req, res) {
  res.sendFile(path + "index.html");
});

/*`app.listen(port, host, () => {
  console.log(`GHL app listening on port `);
});` is starting the Express server and making it listen on the specified port and host. */
app.listen(port, host, () => {
  console.log(`GHL app listening on ${host}:${port}`);
});
