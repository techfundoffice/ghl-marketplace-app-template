# GoHighLevel Clone - Integration Requirements & Specifications

## Document Overview
This document provides comprehensive integration specifications for building a GoHighLevel clone platform. All information is current as of December 2025 and includes detailed requirements for authentication, webhooks, rate limits, and pricing for each integration.

---

## 1. Twilio Integration

### Overview
Twilio provides SMS, Voice, and phone number management capabilities essential for CRM communications.

### 1.1 SMS Integration

#### Authentication Method
- **Type**: API Key Authentication (HTTP Basic Auth)
- **Credentials**: Account SID + Auth Token
- **Headers**: Basic Auth with Account SID as username, Auth Token as password

#### Webhook Configuration
- **Incoming Message Webhook**: Receives HTTP POST requests when SMS arrives
- **Status Callback Webhook**: Tracks message delivery status
- **Format**: `application/x-www-form-urlencoded`
- **Required Response**: TwiML (can be empty `<Response/>` tag) or HTTP 200 OK
- **Security Headers**:
  - `X-Twilio-Signature`: Verify webhook authenticity
  - `I-Twilio-Idempotency-Token`: Handle retry attempts

#### Webhook Events
- `message.received`: Incoming SMS received
- `message.sent`: Outbound SMS sent
- `message.delivered`: Message delivered to carrier
- `message.failed`: Message delivery failed
- `message.queued`: Message queued for sending

#### Required Parameters for Sending SMS
```
To: Destination phone number (E.164 format)
From: Twilio phone number
Body: Message text (up to 1600 characters, split into segments)
StatusCallback: Optional URL for delivery updates
```

#### Rate Limits
- **Default**: No explicit rate limit for most accounts
- **Best Practice**: Max 1 request per phone number per second
- **Queue-based**: Messages queued automatically during high volume

#### Pricing (2025)
- **Outbound SMS**: $0.0079 per segment (US)
- **Inbound SMS**: $0.0079 per segment (US)
- **Segment Size**: 160 characters (GSM-7) or 70 characters (Unicode)
- **International**: Varies by country ($0.02-$0.15 per segment)

### 1.2 A2P 10DLC Registration

#### What is A2P 10DLC?
Application-to-Person messaging via 10-digit long codes, required for all US business messaging.

#### Registration Types

**1. Sole Proprietor**
- **Cost**: $4.50 one-time fee
- **Requirements**:
  - Valid US/Canada address
  - OTP verification
  - Phone number for validation
- **Limitations**:
  - 1 campaign maximum
  - 1 phone number per campaign
  - 1 MPS (messages per second) throughput
  - Daily limit: <6,000 messages
- **Processing Time**: 2-5 business days

**2. Low Volume Standard**
- **Cost**: $4.50 one-time + $1.50/month per campaign
- **Requirements**:
  - EIN (Tax ID) required
  - US business address
  - Website verification
- **Limitations**:
  - <6,000 messages per day
  - Multiple campaigns allowed
  - Higher throughput than Sole Prop
- **Processing Time**: 1-2 weeks

**3. Standard**
- **Cost**: $46 one-time (includes Secondary Vetting) + $2-10/month per campaign
- **Requirements**:
  - EIN required
  - Business verification documents
  - Website with matching branding
  - >6,000 messages per day expected
- **Features**:
  - Unlimited campaigns
  - Multiple phone numbers per campaign
  - Higher throughput (MPS varies by trust score)
  - Full carrier support
- **Processing Time**: 2-4 weeks (including vetting)

#### Carrier Per-Message Fees (2025)
Applied per outbound SMS segment:
- **AT&T**: $0.002-$0.004 per segment
- **T-Mobile/Sprint**: $0.003 per segment (also charges for inbound)
- **Verizon**: $0.002 per segment
- **Note**: Fees added to standard Twilio SMS pricing

#### Critical Compliance Dates
- **January 30, 2025**: Public Profit brands must be compliant with Authentication+ requirements
- **Failure to Comply**: Campaign suspension

#### Best Practices
- Allocate 4 weeks for complete registration process
- Ensure consistent branding (domain, website, business name)
- Prepare business documents in advance
- Monitor trust scores to maintain throughput

### 1.3 Voice API

#### Authentication Method
- **Type**: Same as SMS (API Key with Account SID + Auth Token)
- **API Endpoint**: `https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Calls.json`

#### Inbound Call Webhooks
- **Voice Webhook**: Triggered when call arrives
- **Expected Response**: TwiML instructions for call handling
- **HTTP Method**: POST or GET (configurable)
- **Required Response**: Valid TwiML XML

#### TwiML Verbs for Call Control
```xml
<Response>
  <Say>Text to speech</Say>
  <Play>audio-url.mp3</Play>
  <Gather>Collect DTMF input</Gather>
  <Dial>Connect to another number</Dial>
  <Record>Record caller audio</Record>
  <Hangup>End call</Hangup>
</Response>
```

#### Outbound Call Configuration
- **URL Parameter**: Webhook URL for call instructions
- **StatusCallback**: URL for call status updates
- **StatusCallbackEvent**: Events to track (initiated, ringing, answered, completed)
- **Recording**: Can be enabled with callback URL

#### Webhook Events
- `call.initiated`: Outbound call started
- `call.ringing`: Phone ringing
- `call.answered`: Call connected
- `call.completed`: Call ended
- `recording.completed`: Recording processed and available

#### Recording Features
- **Status Callback**: Sent when recording completes
- **Statuses**: in-progress, completed, absent, failed
- **RecordingUrl**: Download link in completed callback
- **Transcription**: Optional ($0.05 per minute)

#### Rate Limits
- **Concurrent Calls**: Based on account tier (starts at 100)
- **Webhook Retries**: 3 attempts with exponential backoff
- **Important**: Prevent duplicate calls with proper state tracking

#### Pricing (2025)
- **Inbound Calls (US)**: $0.0085 - $0.022 per minute
- **Outbound Calls (US)**: $0.013 - $0.030 per minute
- **International**: Varies significantly by destination
- **Recording Storage**: $0.0005 per minute per month
- **Transcription**: $0.05 per minute
- **Toll-Free Numbers**: Higher per-minute rates

### 1.4 Phone Number Provisioning

#### Phone Number API
- **Endpoint**: `/AvailablePhoneNumbers/{CountryCode}/Local.json`
- **Search Parameters**: AreaCode, Contains, SmsEnabled, VoiceEnabled
- **Purchase Endpoint**: `/IncomingPhoneNumbers.json`

#### Phone Number Types
- **Local Numbers**: Standard 10-digit numbers with local prefix
- **Toll-Free**: 800, 888, 877, 866, 855, 844, 833 prefixes
- **Short Codes**: 5-6 digit codes (requires separate application)
- **Alpha Sender IDs**: Text-based sender names (international only)

#### Monthly Rental Costs (2025)
- **US Local Number**: ~$1.00/month
- **US Toll-Free**: ~$2.00/month
- **International Local**: $1.00-$15.00/month (varies by country)
- **Short Code**: $1,000-$2,000/month

#### Number Capabilities
- **SMS Enabled**: Can send/receive SMS
- **MMS Enabled**: Can send/receive media messages
- **Voice Enabled**: Can make/receive calls
- **Fax Enabled**: Can send/receive fax

#### Provisioning API Rate Limits
- **Search**: Unlimited
- **Purchase**: 100 numbers per account per rolling 24-hour period
- **Release**: Unlimited

---

## 2. Stripe Integration

### Overview
Stripe provides payment processing, subscription management, and multi-tenant account orchestration via Stripe Connect.

### 2.1 Stripe Connect (Multi-Tenant Architecture)

#### Authentication Method
- **Platform Account**: Standard API keys (Publishable + Secret)
- **Connected Accounts**: OAuth 2.0 or AccountLink
- **Recommended**: AccountLink (not OAuth) for payment processing
- **API Key Types**:
  - Test Mode: `pk_test_...` and `sk_test_...`
  - Live Mode: `pk_live_...` and `sk_live_...`

#### Account Types
**1. Standard Accounts**
- Users control their own Stripe dashboard
- Independent payout schedules
- Full Stripe branding
- Users can disconnect at any time

**2. Express Accounts**
- Simplified onboarding (phone number only initially)
- Stripe-hosted dashboard
- Platform can customize branding
- Recommended for marketplaces

**3. Custom Accounts**
- Platform fully controls experience
- Platform liable for disputes/chargebacks
- Most complex compliance requirements
- Full white-label capability

#### Charge Flow Types

**1. Direct Charges** (Recommended for SaaS platforms)
```javascript
// Charge goes directly to connected account
stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  application_fee_amount: 200, // Platform fee
}, {
  stripeAccount: 'acct_connected_account_id', // Connected account receives payment
});
```

**2. Destination Charges**
```javascript
// Charge platform, transfer to connected account
stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  transfer_data: {
    destination: 'acct_connected_account_id',
    amount: 1800, // After platform fee
  },
});
```

**3. Separate Charges and Transfers**
```javascript
// Charge platform account, manually transfer later
stripe.charges.create({ amount: 2000, currency: 'usd' });
stripe.transfers.create({
  amount: 1800,
  currency: 'usd',
  destination: 'acct_connected_account_id',
});
```

#### Account Onboarding Flow
1. **Create Account**: POST `/v1/accounts`
2. **Create Account Link**: POST `/v1/account_links`
3. **User Completes Onboarding**: Hosted by Stripe
4. **Webhook Notification**: `account.updated` when complete
5. **Begin Processing**: Account can accept payments

#### Required Information
- Business/Individual name
- Tax ID (EIN or SSN)
- Business address
- Bank account details (for payouts)
- Beneficial owner information (if applicable)

#### Webhooks for Connect
- `account.updated`: Account status changed
- `account.application.deauthorized`: User disconnected
- `capability.updated`: Account capabilities changed
- `person.created`: Beneficial owner added
- `person.updated`: Person information changed

### 2.2 Payment Intents API

#### Authentication Method
- **Type**: Bearer token (Secret API Key)
- **Header**: `Authorization: Bearer sk_test_...`

#### Payment Intent Lifecycle
```
1. Created → 2. Processing → 3. Requires Action → 4. Succeeded
                    ↓
                5. Canceled
```

#### Create Payment Intent
```javascript
POST /v1/payment_intents
{
  amount: 2000, // Amount in cents
  currency: 'usd',
  payment_method_types: ['card'],
  customer: 'cus_xxx', // Optional: link to customer
  metadata: {
    order_id: '12345',
    // Custom metadata
  },
}
```

#### Confirm Payment (Client-side with Stripe.js)
```javascript
stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: { name: 'Customer Name' },
  },
});
```

#### Webhook Events
- `payment_intent.created`: Intent created
- `payment_intent.processing`: Payment processing
- `payment_intent.requires_action`: 3DS or auth required
- `payment_intent.succeeded`: Payment successful **[KEY EVENT FOR FULFILLMENT]**
- `payment_intent.payment_failed`: Payment failed
- `payment_intent.canceled`: Intent canceled

#### Important Implementation Notes
- **Never fulfill orders client-side**: Always use webhooks
- **Idempotency**: Check `event.id` to prevent duplicate processing
- **Delayed Methods**: Some payment methods (SEPA, ACH) take days
- **3D Secure**: European cards may require additional authentication

### 2.3 Subscriptions & Billing

#### API Version Requirement
- **Minimum**: `2025-06-30.basil` for enhanced subscription features
- **Set via Header**: `Stripe-Version: 2025-06-30.basil`

#### Subscription Setup Flow
1. **Create Product**: Define what you're selling
2. **Create Price**: Set amount and billing interval
3. **Create Customer**: Store customer information
4. **Attach Payment Method**: Link card to customer
5. **Create Subscription**: Start billing cycle

#### Create Subscription
```javascript
POST /v1/subscriptions
{
  customer: 'cus_xxx',
  items: [
    { price: 'price_monthly_plan' }
  ],
  payment_behavior: 'default_incomplete',
  payment_settings: {
    payment_method_types: ['card'],
    save_default_payment_method: 'on_subscription',
  },
  expand: ['latest_invoice.payment_intent'],
}
```

#### Billing Intervals
- **day**: Daily billing
- **week**: Weekly billing
- **month**: Monthly billing
- **year**: Annual billing
- **Custom**: Specify interval count (e.g., every 3 months)

#### Critical Webhook Events
- `customer.subscription.created`: New subscription
- `customer.subscription.updated`: Subscription modified
- `customer.subscription.deleted`: Subscription canceled
- `invoice.created`: Invoice generated
- `invoice.payment_succeeded`: Payment collected **[KEY EVENT]**
- `invoice.payment_failed`: Payment failed **[HANDLE DUNNING]**
- `invoice.finalized`: Invoice ready for payment

#### Subscription Statuses
- `incomplete`: Initial state, first payment pending
- `active`: Subscription active and paid
- `past_due`: Payment failed, retrying
- `canceled`: Subscription ended
- `unpaid`: Payment failed, no more retries
- `trialing`: In trial period

#### Best Practices
- **Implement Idempotency**: Store `event.id` to prevent duplicate processing
- **Webhook Retry Handling**: Stripe retries failed webhooks over 3 days
- **Dunning Management**: Handle `invoice.payment_failed` gracefully
- **Proration**: Enable for mid-cycle upgrades/downgrades
- **Trial Periods**: Set `trial_period_days` when creating subscription

### 2.4 Apple Pay & Google Pay

#### Authentication Method
- **Same as standard Stripe**: API Keys
- **Client-side**: Stripe.js Payment Request Button API

#### Integration Method
```javascript
const paymentRequest = stripe.paymentRequest({
  country: 'US',
  currency: 'usd',
  total: {
    label: 'Demo total',
    amount: 2000,
  },
  requestPayerName: true,
  requestPayerEmail: true,
});

// Auto-detects Apple Pay or Google Pay availability
const elements = stripe.elements();
const prButton = elements.create('paymentRequestButton', {
  paymentRequest: paymentRequest,
});

// Button only shows if wallet is available
paymentRequest.canMakePayment().then(result => {
  if (result) {
    prButton.mount('#payment-request-button');
  }
});
```

#### Features
- **Auto-detection**: Automatically shows available wallet
- **Browser Support**:
  - Apple Pay: Safari on iOS/macOS
  - Google Pay: Chrome on Android/Desktop
- **No Extra Integration**: Same Payment Intent flow
- **Fallback**: Show traditional card form if wallets unavailable

#### Pricing (2025)
- **No Additional Fees**: Same as card processing
- **Standard Rate**: 2.9% + $0.30 per transaction (US)
- **International Cards**: 3.1% + $0.30 + 1.5% cross-border fee
- **In-person (Terminal)**: 2.7% + $0.05

#### Advantages
- Faster checkout (pre-filled information)
- Lower cart abandonment
- Higher conversion rates
- Enhanced security (tokenized)

### 2.5 Rate Limits & Pricing

#### API Rate Limits
- **Default**: 100 requests per second
- **Bursting**: Short bursts allowed up to 1,000 requests
- **Webhooks**: No rate limit on receiving
- **Idempotency**: 24-hour idempotency window

#### Standard Pricing (US, 2025)
- **Online Payments**: 2.9% + $0.30
- **International Cards**: 3.1% + $0.30 + 1.5% cross-border
- **Currency Conversion**: +1% for non-USD
- **Disputes**: $15 per dispute (refunded if you win)
- **Connect Platform Fee**: Platform sets (typically 2-5%)

#### No Monthly Fees
- No setup fees
- No monthly fees
- No minimum charges
- Pay only for successful transactions

---

## 3. WhatsApp Business API

### Overview
WhatsApp Business API enables programmatic messaging for customer engagement, support, and notifications.

### 3.1 Meta Business Verification

#### Requirements Changes (2025)
- **Prior to Oct 31, 2023**: Meta Business Manager verification required
- **After Oct 31, 2023**: Business verification optional for basic usage
- **Messaging Limits Without Verification**: 250 unique customers per 24 hours
- **Messaging Limits With Verification**: 1K/10K/100K/Unlimited (tier-based)

#### Verification Process
1. **Access Business Settings**: Meta Business Suite → Settings → Security Center
2. **Provide Business Details**:
   - Legal business name
   - Business address
   - Phone number
   - Website (must be accessible, no redirects)
   - Consistent branding (domain, header/footer, logo)
3. **Upload Documents**:
   - Business license or registration
   - Tax documents
   - Utility bill (address verification)
4. **Choose Verification Method**:
   - Email verification (domain must match)
   - Phone verification (with confirming document)
   - Domain verification (add DNS record)
5. **Wait for Review**: 2-15 business days average

#### Account Types & Verification

**Non-Verified Account**
- 250 unique customers per 24 hours
- Maximum 2 phone numbers
- Basic features only

**Meta Verified Account**
- Tier 1: 1,000 unique customers per 24 hours
- Tier 2: 10,000 unique customers per 24 hours
- Tier 3: 100,000 unique customers per 24 hours
- Tier 4: Unlimited
- Automatic tier upgrades based on quality and volume
- Premium features enabled

**Official Business Account (OBA)**
- Blue verified badge
- Free for highly notable brands
- API users only (not app users)
- Requires separate application process

#### Critical Notes
- **Meta Verified (Paid)**: NOT available for API users, only app users
- **Blue Tick**: Transitioned from green to blue for Meta consistency
- **Fresh Number Required**: Cannot be linked to existing WhatsApp account
- **Two-Step Verification**: Must be enabled via Security Center

### 3.2 Template Messages

#### What are Template Messages?
Pre-approved message formats required to initiate conversations outside the 24-hour customer service window.

#### Template Categories (2025)

**1. Marketing Messages**
- **Purpose**: Promotions, offers, product announcements
- **Pricing**: Higher cost (see pricing section)
- **Approval**: Strictest review process
- **Meta Changes**: Tightened review process in 2025
- **Best Practices**: Avoid spammy words, balance compliance with urgency

**2. Utility Messages**
- **Purpose**: Order confirmations, shipping updates, account alerts
- **Pricing**: Standard cost
- **Free Window**: FREE during 24-hour customer service window
- **Approval**: Moderate review requirements

**3. Authentication Messages**
- **Purpose**: OTPs, security codes, verification
- **Pricing**: Reduced rates (expanded to 7 new markets Feb 1, 2025)
- **Approval**: Fastest approval
- **Character Limit**: Typically shorter

#### Template Structure
```
Header (Optional):
  - Text (up to 60 characters)
  - Media (image, video, document)
  - Location

Body (Required):
  - Text with variable parameters {{1}}, {{2}}, etc.
  - Up to 1024 characters

Footer (Optional):
  - Up to 60 characters
  - Static text only

Buttons (Optional):
  - Call-to-Action (CTA): Up to 2 buttons
    - URL Button: Opens website
    - Phone Button: Initiates call
  - Quick Reply: Up to 3 buttons
    - Predefined response options
```

#### Template Example
```json
{
  "name": "order_confirmation",
  "language": "en",
  "category": "UTILITY",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Order Confirmed"
    },
    {
      "type": "BODY",
      "text": "Hi {{1}}, your order #{{2}} has been confirmed. Expected delivery: {{3}}."
    },
    {
      "type": "FOOTER",
      "text": "Thank you for shopping with us!"
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "QUICK_REPLY",
          "text": "Track Order"
        },
        {
          "type": "URL",
          "text": "View Details",
          "url": "https://example.com/order/{{1}}"
        }
      ]
    }
  ]
}
```

#### Template Approval Process
- **Submission**: Via Meta Business Manager or API
- **Review Time**: Minutes to 48 hours
- **Rejection Reasons**: Policy violations, unclear purpose, spammy content
- **Important**: Once approved, templates CANNOT be edited
- **Solution**: Create new template version

#### Template Variables
- **Format**: {{1}}, {{2}}, {{3}}, etc.
- **Limit**: Varies by component (body allows more than header)
- **Use Cases**: Personalization (name, order number, date, etc.)

### 3.3 Interactive Messages

#### Key Difference from Templates
- **No Approval Required**: Send immediately
- **Restriction**: Only within 24-hour customer service window
- **Flexibility**: Dynamic content without pre-approval

#### Interactive Message Types

**1. Quick Reply Buttons**
```json
{
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "How can we help you today?"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "support",
            "title": "Customer Support"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "billing",
            "title": "Billing Question"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "technical",
            "title": "Technical Issue"
          }
        }
      ]
    }
  }
}
```
- **Limit**: Up to 3 buttons
- **Button Title**: Max 20 characters
- **Response**: Button ID sent back in webhook

**2. List Messages**
```json
{
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "Select a Category"
    },
    "body": {
      "text": "Choose from our service categories:"
    },
    "footer": {
      "text": "Select one option"
    },
    "action": {
      "button": "View Categories",
      "sections": [
        {
          "title": "Services",
          "rows": [
            {
              "id": "service1",
              "title": "Web Development",
              "description": "Custom website creation"
            },
            {
              "id": "service2",
              "title": "Mobile Apps",
              "description": "iOS and Android apps"
            }
          ]
        }
      ]
    }
  }
}
```
- **Sections**: Up to 10 sections
- **Rows per Section**: Up to 10 rows
- **Total Rows**: Maximum 10 across all sections
- **Use Case**: Product catalogs, service menus

**3. Call-to-Action Buttons (CTA)**
- **Buy Now**: E-commerce purchases
- **Track Order**: Shipment tracking
- **Pay Online**: Payment links
- **Talk to Agent**: Human handoff
- **Benefit**: Shortens user journey, improves response rates

#### Interactive vs Template Comparison

| Feature | Interactive Messages | Template Messages |
|---------|---------------------|-------------------|
| Approval | Not required | Required |
| When to Use | Within 24hr window | Outside 24hr window |
| Flexibility | High (dynamic) | Low (fixed) |
| Buttons | Up to 3 quick replies | Up to 2 CTAs + 3 quick replies |
| Cost | Free (in window) | Charged per message |

### 3.4 Webhooks

#### Webhook Events
- `messages`: Incoming customer messages
- `message_status`: Delivery status updates (sent, delivered, read, failed)
- `message_template_status_update`: Template approval/rejection
- `account_alerts`: Account status changes
- `account_update`: Phone number or profile changes

#### Webhook Payload Structure
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "messages": [
              {
                "from": "15559876543",
                "id": "wamid.XXX",
                "timestamp": "1234567890",
                "type": "text",
                "text": {
                  "body": "Hello!"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

#### Webhook Setup
1. **Configure URL**: In Meta App Dashboard
2. **Verify Token**: Set custom verification token
3. **Subscribe to Events**: Select webhook fields
4. **Verification Request**: Meta sends GET request with:
   - `hub.mode=subscribe`
   - `hub.verify_token=YOUR_TOKEN`
   - `hub.challenge=RANDOM_STRING`
5. **Response**: Return `hub.challenge` value to verify

#### Webhook Security
- **Verify Token**: Match against your configured token
- **Validate Signature**: Check `X-Hub-Signature-256` header
- **HTTPS Required**: Only secure endpoints accepted

### 3.5 Rate Limits & Pricing

#### API Call Rate Limits
- **Basic Plans**: 300 API calls per minute
- **Advanced Plans**: 600 API calls per minute (on request)
- **Message Sending**: 80 messages per second
- **Tier-Based Messaging Limits**:
  - Tier 1: 1,000 unique customers per 24 hours
  - Tier 2: 10,000 unique customers per 24 hours
  - Tier 3: 100,000 unique customers per 24 hours
  - Tier 4: Unlimited
  - **Tier Upgrades**: Automatic based on quality and volume

#### Pricing Changes Timeline (2025)
- **Feb 1, 2025**: Expanded authentication message markets, reduced rates
- **Apr 1, 2025**: Phase 1 - Select businesses transition to per-message billing
- **Jul 1, 2025**: Phase 2 - ALL accounts migrated to per-message billing
- **Oct 7, 2025**: Messaging limits calculated per business portfolio (not per number)
- **Oct 23, 2025**: On-Premises API sunset (Cloud API only)

#### Per-Message Pricing Model (Post July 1, 2025)
**Replaced**: Conversation-based billing
**New**: Per-message billing based on template category

**Pricing by Template Type** (varies by country):
- **Marketing Messages**: Highest cost (e.g., $0.05-$0.15 per message)
- **Utility Messages**: Standard cost (e.g., $0.02-$0.08 per message)
- **Authentication Messages**: Lowest cost (e.g., $0.01-$0.05 per message)
- **Service Messages**: FREE within 24-hour window

#### Free Messaging Windows
**24-Hour Customer Service Window**:
- Starts when customer messages first
- Free-form text messages: FREE
- Utility templates: FREE
- Marketing templates: Still charged
- Authentication templates: Still charged

**72-Hour Extended Window** (Free Entry Points):
- Click-to-WhatsApp ads
- Facebook Page CTA buttons
- Conversations from these sources extended to 72 hours

#### Cost Components
1. **Meta Fees**: Per-message charges (category-based)
2. **BSP (Business Solution Provider) Fees**:
   - Setup fees
   - Hosting fees
   - Message markups (varies by provider)
3. **Inbox Software**:
   - Required (API has no frontend)
   - Subscription costs vary

#### Example BSP Pricing (Wati):
- **Basic**: 200,000 API calls/month, limited webhooks
- **Enterprise**: 20M API calls/month, extensive webhooks

---

## 4. Google OAuth & APIs

### Overview
Google provides OAuth 2.0 authentication for accessing Calendar, Gmail, and Contacts (People API).

### 4.1 Authentication & OAuth 2.0

#### OAuth 2.0 Flow
1. **Register App**: Google Cloud Console → Create Project
2. **Enable APIs**: Calendar API, Gmail API, People API
3. **Configure OAuth Consent Screen**:
   - App name
   - Support email
   - Scopes
   - Test users (during development)
4. **Create OAuth Client**:
   - Application type (Web, Android, iOS, Desktop)
   - Authorized redirect URIs
   - Get Client ID and Client Secret
5. **User Authorization**: Redirect user to Google consent page
6. **Exchange Code**: Trade authorization code for access token
7. **Refresh Tokens**: Use refresh token for long-term access

#### OAuth 2.0 Endpoints
- **Authorization**: `https://accounts.google.com/o/oauth2/v2/auth`
- **Token**: `https://oauth2.googleapis.com/token`
- **Token Info**: `https://oauth2.googleapis.com/tokeninfo`
- **Revoke**: `https://oauth2.googleapis.com/revoke`

#### Token Types
- **Access Token**: Short-lived (1 hour), used for API calls
- **Refresh Token**: Long-lived, used to obtain new access tokens
- **ID Token**: Contains user identity information (OpenID Connect)

#### Best Practices
- **Incremental Authorization**: Request scopes when needed, not upfront
- **Minimum Scopes**: Only request necessary scopes
- **Sensitive Scopes**: Require Google verification (plan weeks ahead)
- **Token Storage**: Store tokens securely (encrypted at rest)

### 4.2 Google Calendar API

#### Required Scopes

| Scope | Access Level | Description |
|-------|--------------|-------------|
| `https://www.googleapis.com/auth/calendar` | Full access | Read, write, delete calendars and events |
| `https://www.googleapis.com/auth/calendar.readonly` | Read-only | View calendars and events |
| `https://www.googleapis.com/auth/calendar.events` | Events only | Read/write events, not calendar metadata |
| `https://www.googleapis.com/auth/calendar.settings.readonly` | Settings | View calendar settings |

#### API Capabilities
- **Create/Read/Update/Delete** calendars
- **Create/Read/Update/Delete** events
- **Get free/busy information**
- **Find suggested meeting times**
- **Manage attendees and responses**
- **Set event reminders**
- **Recurring events** (RRULE support)
- **Auto-added events** (flights, hotels from emails)

#### Create Event Example
```javascript
POST https://www.googleapis.com/calendar/v3/calendars/primary/events
Authorization: Bearer ACCESS_TOKEN

{
  "summary": "Team Meeting",
  "description": "Quarterly planning session",
  "start": {
    "dateTime": "2025-12-20T10:00:00-07:00",
    "timeZone": "America/Los_Angeles"
  },
  "end": {
    "dateTime": "2025-12-20T11:00:00-07:00",
    "timeZone": "America/Los_Angeles"
  },
  "attendees": [
    { "email": "attendee1@example.com" },
    { "email": "attendee2@example.com" }
  ],
  "reminders": {
    "useDefault": false,
    "overrides": [
      { "method": "email", "minutes": 1440 },
      { "method": "popup", "minutes": 10 }
    ]
  }
}
```

#### Rate Limits
- **Quota Units**: Abstract measurement of resource usage
- **Per-User Limit**: 250 quota units per user per second
- **Per-Project Limit**: Shared across all users
- **Bursting**: Short bursts allowed
- **Error Code**: 403 `rateLimitExceeded`

#### Pricing
- **Free**: No additional cost beyond Google Workspace licensing
- **Quotas**: Generous free tier
- **Excessive Use**: Subject to usage limits (rarely hit)

### 4.3 Gmail API

#### Required Scopes

| Scope | Access Level | Description |
|-------|--------------|-------------|
| `https://www.googleapis.com/auth/gmail.readonly` | Read-only | View email messages and settings |
| `https://www.googleapis.com/auth/gmail.send` | Send only | Send email on user's behalf |
| `https://www.googleapis.com/auth/gmail.modify` | Modify | Read, write, send, delete (no permanent delete) |
| `https://mail.google.com/` | Full access | All mail operations including permanent delete |
| `https://www.googleapis.com/auth/gmail.labels` | Labels | Manage labels |

**Note**: Legacy scope `https://www.google.com/m8/feeds` is deprecated

#### API Capabilities
- **Send/Receive** emails
- **Read/Search** messages
- **Manage** labels and filters
- **Create** drafts
- **Manage** threads
- **Get/Modify** attachments
- **Batch** operations (up to 50 requests)

#### Send Email Example
```javascript
POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{
  "raw": "BASE64_ENCODED_EMAIL_MESSAGE"
}
```

#### Rate Limits (2025)
- **Daily Limit**: Quota units per project per day
- **Per-User Rate Limit**: 250 quota units per user per second
- **Batch Size**: Maximum 50 requests per batch
- **Error Codes**:
  - 403 `rateLimitExceeded`: User rate limit exceeded
  - 403 `userRateLimitExceeded`: Per-user quota exceeded
  - 429 `Too Many Requests`: Retry with exponential backoff

#### Quota Unit Examples
- **Send message**: 100 quota units
- **List messages**: 5 quota units
- **Get message**: 5 quota units
- **Modify message**: 50 quota units

#### Handling Rate Limits
- **Batching**: Encouraged, but max 50 per batch
- **Exponential Backoff**: Retry after rate limit errors
- **Monitor Usage**: Google Cloud Console quota page
- **Shared Limits**: All user clients share per-user limit

#### Pricing
- **Free**: No additional cost (included with Google Workspace)
- **Quotas**: Generous free tier
- **OAuth Rate Limits**: Separate limits for OAuth operations

### 4.4 Google People API (Contacts)

#### Migration from Contacts API
- **Deprecated**: Contacts API (discontinued Jan 19, 2022)
- **Replacement**: People API
- **Changes**: Different endpoints, scopes, field names

#### Required Scopes

| Scope | Access Level | Description |
|-------|--------------|-------------|
| `https://www.googleapis.com/auth/contacts` | Full access | Read/write personal contacts |
| `https://www.googleapis.com/auth/contacts.readonly` | Read-only | View contacts |
| `https://www.googleapis.com/auth/directory.readonly` | Directory | Domain directory (Workspace admins) |

**Changed from**: `https://www.google.com/m8/feeds` (deprecated)

#### API Capabilities
- **List** contacts (personal and "Other contacts")
- **Search** contacts (requires cache warmup)
- **Create/Update/Delete** personal contacts
- **Batch operations** (create, update, delete)
- **Read-only** access to "Other contacts"
- **Manage** contact groups

#### "Other Contacts" Handling
- **Definition**: Auto-saved contacts from interactions
- **Permissions**: Read-only for "Other Contacts"
- **Limitation**: Cannot update via API (must promote to "My Contacts")
- **Data Available**: Basic info only (name, email, phone)

#### List Contacts Example
```javascript
GET https://people.googleapis.com/v1/people/me/connections
  ?personFields=names,emailAddresses,phoneNumbers
Authorization: Bearer ACCESS_TOKEN
```

#### Search Contacts (Requires Warmup)
```javascript
// Step 1: Warmup cache (empty query)
GET https://people.googleapis.com/v1/people:searchContacts?query=&readMask=names

// Step 2: Actual search
GET https://people.googleapis.com/v1/people:searchContacts?query=John&readMask=names,emailAddresses
```

#### Create Contact Example
```javascript
POST https://people.googleapis.com/v1/people:createContact
Authorization: Bearer ACCESS_TOKEN

{
  "names": [{ "givenName": "John", "familyName": "Doe" }],
  "emailAddresses": [{ "value": "john.doe@example.com" }],
  "phoneNumbers": [{ "value": "+1 555-1234" }]
}
```

#### Update Contact (Requires etag)
```javascript
PATCH https://people.googleapis.com/v1/{resourceName}:updateContact
  ?updatePersonFields=emailAddresses
Authorization: Bearer ACCESS_TOKEN

{
  "resourceName": "people/c1234567890",
  "etag": "%ETAG_VALUE%",
  "emailAddresses": [
    { "value": "newemail@example.com" }
  ]
}
```

#### Best Practices
- **Sequential Mutations**: Send update requests sequentially (not parallel)
- **Cache Warmup**: Always warmup before search operations
- **etag Handling**: Include etag for updates (data integrity)
- **Batch Operations**: Use for bulk create/update/delete

#### Rate Limits
- Similar to other Google APIs
- Monitor quota usage in Cloud Console
- Implement exponential backoff

#### Pricing
- **Free**: Included with Google account
- **No Additional Cost**: Beyond standard Google Workspace pricing

#### Integration Tips
- **Pipedream Integration**: Pre-built workflows available
- **Third-party Libraries**: Use official client libraries
- **Error Handling**: Handle `etag` mismatch errors gracefully

---

## 5. Microsoft OAuth & Graph API

### Overview
Microsoft Graph API provides unified access to Outlook Calendar, Email, Contacts, and other Microsoft 365 services.

### 5.1 Authentication & OAuth 2.0

#### OAuth 2.0 Flow
1. **Register App**: Azure Portal → App Registrations
2. **Configure Application**:
   - Note Application (client) ID
   - Note Directory (tenant) ID
   - Add redirect URIs
   - Generate client secret
3. **Assign API Permissions**:
   - Delegated permissions (user context)
   - Application permissions (background tasks)
4. **Admin Consent**: Some permissions require tenant admin approval
5. **Obtain Tokens**: Use OAuth 2.0 authorization code flow

#### Authentication Types
- **Delegated Permissions**: Access as signed-in user
- **Application Permissions**: Access without user (background services)

#### OAuth 2.0 Endpoints (v2.0)
- **Authorization**: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`
- **Token**: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`

#### Token Management
- **Access Token**: Short-lived (typically 1 hour)
- **Refresh Token**: Long-lived (up to 90 days)
- **Automatic Renewal**: Refresh before expiration

### 5.2 Outlook Calendar API

#### Required Permissions

| Permission | Type | Description |
|------------|------|-------------|
| `Calendars.Read` | Delegated/Application | Read calendars |
| `Calendars.ReadWrite` | Delegated/Application | Read and write calendars |
| `Calendars.ReadBasic` | Delegated | Read basic calendar info |
| `Calendars.Read.Shared` | Delegated | Read shared calendars |
| `Calendars.ReadWrite.Shared` | Delegated | Read/write shared calendars |

#### API Capabilities
- **Create/Read/Update/Delete** calendars
- **Create/Read/Update/Delete** events
- **Get free/busy** information
- **Find meeting times** (suggestions based on availability)
- **Manage attendees** and track responses
- **Recurring events** with recurrence patterns
- **Calendar sharing** and permissions
- **Auto-add events** from emails (flights, reservations)

#### Get Calendar Events
```javascript
GET https://graph.microsoft.com/v1.0/me/calendar/events
Authorization: Bearer ACCESS_TOKEN
```

#### Create Event
```javascript
POST https://graph.microsoft.com/v1.0/me/calendar/events
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{
  "subject": "Team Sync",
  "body": {
    "contentType": "HTML",
    "content": "Discuss Q1 goals"
  },
  "start": {
    "dateTime": "2025-12-20T10:00:00",
    "timeZone": "Pacific Standard Time"
  },
  "end": {
    "dateTime": "2025-12-20T11:00:00",
    "timeZone": "Pacific Standard Time"
  },
  "attendees": [
    {
      "emailAddress": {
        "address": "attendee@example.com",
        "name": "Attendee Name"
      },
      "type": "required"
    }
  ]
}
```

#### Find Meeting Times
```javascript
POST https://graph.microsoft.com/v1.0/me/findMeetingTimes
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{
  "attendees": [
    {
      "emailAddress": {
        "address": "user@example.com"
      }
    }
  ],
  "timeConstraint": {
    "timeslots": [
      {
        "start": {
          "dateTime": "2025-12-20T09:00:00",
          "timeZone": "Pacific Standard Time"
        },
        "end": {
          "dateTime": "2025-12-20T17:00:00",
          "timeZone": "Pacific Standard Time"
        }
      }
    ]
  },
  "meetingDuration": "PT1H"
}
```

### 5.3 Outlook Mail API

#### Required Permissions

| Permission | Type | Description |
|------------|------|-------------|
| `Mail.Read` | Delegated/Application | Read mail |
| `Mail.ReadWrite` | Delegated/Application | Read and write mail |
| `Mail.Send` | Delegated/Application | Send mail |
| `Mail.Read.Shared` | Delegated | Read shared mail |
| `Mail.ReadWrite.Shared` | Delegated | Read/write shared mail |
| `MailboxSettings.ReadWrite` | Delegated | Read/write mailbox settings |

#### API Capabilities
- **Send/Receive** emails
- **Read/Search** messages
- **Manage** folders
- **Create** drafts
- **Manage** attachments
- **Move/Copy** messages
- **Set categories** and flags
- **Automatic replies** (Out of Office)

#### Send Email
```javascript
POST https://graph.microsoft.com/v1.0/me/sendMail
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{
  "message": {
    "subject": "Important Update",
    "body": {
      "contentType": "HTML",
      "content": "<h1>Hello</h1><p>This is a test email.</p>"
    },
    "toRecipients": [
      {
        "emailAddress": {
          "address": "recipient@example.com"
        }
      }
    ],
    "attachments": [
      {
        "@odata.type": "#microsoft.graph.fileAttachment",
        "name": "document.pdf",
        "contentBytes": "BASE64_ENCODED_CONTENT"
      }
    ]
  }
}
```

#### List Messages
```javascript
GET https://graph.microsoft.com/v1.0/me/messages
  ?$filter=isRead eq false
  &$orderby=receivedDateTime desc
  &$top=10
Authorization: Bearer ACCESS_TOKEN
```

#### Search Messages
```javascript
GET https://graph.microsoft.com/v1.0/me/messages
  ?$search="subject:project"
Authorization: Bearer ACCESS_TOKEN
```

### 5.4 Contacts API

#### Required Permissions

| Permission | Type | Description |
|------------|------|-------------|
| `Contacts.Read` | Delegated/Application | Read contacts |
| `Contacts.ReadWrite` | Delegated/Application | Read and write contacts |
| `Contacts.Read.Shared` | Delegated | Read shared contacts |
| `Contacts.ReadWrite.Shared` | Delegated | Read/write shared contacts |

#### API Capabilities
- **Create/Read/Update/Delete** contacts
- **Manage** contact folders
- **Search** contacts
- **Batch** operations

#### List Contacts
```javascript
GET https://graph.microsoft.com/v1.0/me/contacts
Authorization: Bearer ACCESS_TOKEN
```

#### Create Contact
```javascript
POST https://graph.microsoft.com/v1.0/me/contacts
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{
  "givenName": "Jane",
  "surname": "Doe",
  "emailAddresses": [
    {
      "address": "jane.doe@example.com",
      "name": "Jane Doe"
    }
  ],
  "businessPhones": ["+1 555-1234"],
  "mobilePhone": "+1 555-5678"
}
```

### 5.5 Rate Limits & Pricing

#### Global Rate Limits
- **Per App Per Tenant**: 130,000 requests per 10 seconds
- **Per User**: Varies by service (see below)
- **Throttling**: First limit reached triggers throttling
- **Response Code**: 429 Too Many Requests
- **Retry-After**: Header indicates wait time

#### Service-Specific Limits

**Mail**:
- Varies by endpoint
- Typically 10,000 requests per 10 minutes

**Calendar**:
- Similar limits to Mail
- Events creation: Higher limits

**Contacts**:
- Standard Graph limits apply

**Teams** (If applicable):
- 4 requests per second per app per team
- 1 request per second per app per tenant per channel/chat
- 1 request per second per user for POST message

#### Upcoming Changes (2025)
- **Sept 30, 2025**: Per-app/per-user limit reduced to half of total per-tenant limit
- **Reason**: Prevent single user/app from consuming all quota

#### Throttling Best Practices
- **Monitor 429 Responses**: Implement retry logic
- **Exponential Backoff**: Increase wait time between retries
- **Batch Requests**: Use `$batch` for multiple operations
- **Webhook Subscriptions**: Reduce polling needs
- **Optimize Queries**: Use `$select`, `$filter`, `$top` to minimize data transfer

#### Pricing (2025)

**Standard APIs**:
- **Free**: Included with Microsoft 365 licensing
- **No Per-Call Charges**: Covered by user licenses

**Protected/Metered APIs** (Primarily Teams):
- **Previous**: Required licensing and payment
- **Aug 25, 2025 Update**: Microsoft ceased charging for several APIs
  - Teams exports
  - Transcripts
  - Meeting recordings
- **Final Billing**: Regular schedule after Aug 25, 2025
- **No Client Changes**: No code updates required

**Data Connect** (Alternative for bulk data):
- Different pricing model
- Not subject to throttling
- For large-scale data extraction

#### Common Troubleshooting
- **Authentication Errors**: Verify OAuth configuration
- **Permission Issues**: Ensure required scopes granted
- **Rate Limiting**: Implement proper backoff strategies
- **Token Expiration**: Refresh tokens before expiry

#### Recommendation
Microsoft recommends using Microsoft Graph (not direct Outlook API at outlook.office.com/api) unless you require a feature exclusive to direct endpoints.

---

## 6. Social Media APIs

### Overview
Facebook, Instagram, and Messenger APIs enable social media management, messaging, and content publishing for business accounts.

### 6.1 Facebook Pages API

#### Authentication Method
- **Type**: OAuth 2.0
- **Access Token Types**:
  - **User Access Token**: Short-lived (1-2 hours)
  - **Page Access Token**: Long-lived or permanent
  - **App Access Token**: For app-level operations

#### Token Exchange Flow
1. User authorizes app
2. Receive short-lived user access token
3. Exchange for long-lived user token (60 days)
4. Request page access tokens for managed pages
5. (Optional) Request permanent page token (no expiration)

#### Required Scopes/Permissions

| Permission | Purpose |
|------------|---------|
| `pages_manage_posts` | Create posts, events |
| `pages_read_engagement` | Read comments, reactions |
| `pages_manage_engagement` | Reply to comments, manage content |
| `pages_manage_metadata` | Subscribe to webhooks, manage page settings |
| `pages_read_user_content` | Read user-generated content |
| `pages_messaging` | Send/receive messages via Messenger |
| `manage_pages` | Access page information, forms, leads |

#### API Capabilities
- **Create/Publish** posts (text, photos, videos)
- **Manage** comments and reactions
- **Schedule** posts
- **Get** page insights and analytics
- **Manage** events
- **Respond** to messages
- **Subscribe** to webhooks for real-time updates

#### Publish Post Example
```javascript
POST https://graph.facebook.com/v19.0/{page-id}/feed
access_token={page-access-token}

{
  "message": "Check out our new product!",
  "link": "https://example.com/product",
  "published": true
}
```

#### Publish Photo
```javascript
POST https://graph.facebook.com/v19.0/{page-id}/photos
access_token={page-access-token}

{
  "url": "https://example.com/image.jpg",
  "caption": "Our amazing product in action!"
}
```

#### Webhook Events
- `feed`: New posts on page
- `comments`: New comments
- `likes`: New likes/reactions
- `messages`: New messages in inbox
- `message_deliveries`: Message delivery status
- `messaging_postbacks`: Postback button clicks
- `messaging_optins`: User opt-ins

#### Webhook Setup
1. **Create App**: Facebook Developers Console
2. **Add Webhook URL**: Your HTTPS endpoint
3. **Set Verify Token**: Custom secret string
4. **Subscribe to Events**: Select fields to monitor
5. **Verify Endpoint**:
   - Facebook sends GET with `hub.verify_token`, `hub.challenge`
   - Return `hub.challenge` to verify

#### Webhook Verification Example
```javascript
// GET request handler
if (req.query['hub.verify_token'] === YOUR_VERIFY_TOKEN) {
  res.send(req.query['hub.challenge']);
} else {
  res.sendStatus(403);
}
```

#### Rate Limits (2025)
- **Varies by endpoint**: Different limits for different operations
- **Generally**: Conservative with posting (avoid spam detection)
- **Monitor**: Response headers for rate limit info
- **System User Tokens**: Higher limits than user tokens

#### Versioning
- **Historical Pattern**: Deprecation every ~2 years
- **Current**: Check official changelog regularly
- **Best Practice**: Monitor breaking changes, plan migrations
- **Common Issues**: 40%+ of rollout problems from token expiry

#### Pricing
- **Free API Access**: No direct charges for API usage
- **Advertising**: Paid (separate from API)

### 6.2 Instagram Graph API

#### Authentication Method
- **Type**: OAuth 2.0 (Two approaches)

**1. Business Login (OAuth 2.0 via Instagram)**
- Direct Instagram authentication
- Generates Instagram User access tokens
- Specific account permissions

**2. Facebook Login (Recommended for platforms)**
- Instagram account connected to Facebook Page
- Integrates with Facebook Business Manager
- Easier multi-client account management
- More common for SaaS platforms

#### Account Requirements
- **Instagram Business Account** OR **Instagram Creator Account**
- **Cannot access**: Regular personal Instagram accounts
- **Connection**: Must be linked to Facebook Page (for Facebook Login method)

#### Token Management
- **Short-lived Token**: Initial token from auth flow
- **Exchange Required**: Immediately exchange for long-lived token
- **Long-lived Token**: 60 days expiration
- **Refresh Logic**: Must refresh before expiration

#### Required Scopes/Permissions

| Permission | Purpose |
|------------|---------|
| `instagram_basic` | Read profile info |
| `instagram_content_publish` | Publish posts and stories |
| `instagram_manage_comments` | Reply, delete, hide comments |
| `instagram_manage_insights` | Access analytics |
| `instagram_manage_messages` | Manage direct messages |
| `pages_read_engagement` | Read engagement data |
| `pages_manage_metadata` | Manage account metadata |

#### API Capabilities
- **Publish** photos, videos, carousels
- **Retrieve** post metrics (impressions, reach, likes, saves)
- **Manage** comments (retrieve, reply, delete, hide)
- **Get** account insights and analytics
- **Access** stories (limited)
- **Manage** media objects

#### Publishing Limitations
- **Daily Limit**: 25 publications per 24 hours
- **Account Type**: Business accounts only
- **Format**: JPEG only for images
- **Not Supported**: Stories, product tags, branded content tags (via API)

#### Publish Photo Example
```javascript
// Step 1: Create Media Container
POST https://graph.facebook.com/v19.0/{ig-user-id}/media
access_token={access-token}

{
  "image_url": "https://example.com/image.jpg",
  "caption": "Amazing photo! #instagram"
}

// Response: { "id": "{creation-id}" }

// Step 2: Publish Media Container
POST https://graph.facebook.com/v19.0/{ig-user-id}/media_publish
access_token={access-token}

{
  "creation_id": "{creation-id}"
}
```

#### Get Media Insights
```javascript
GET https://graph.facebook.com/v19.0/{media-id}/insights
  ?metric=impressions,reach,engagement,saved
access_token={access-token}
```

#### Manage Comments
```javascript
// Get comments
GET https://graph.facebook.com/v19.0/{media-id}/comments
access_token={access-token}

// Reply to comment
POST https://graph.facebook.com/v19.0/{comment-id}/replies
access_token={access-token}

{
  "message": "Thank you for your feedback!"
}

// Hide comment
POST https://graph.facebook.com/v19.0/{comment-id}
access_token={access-token}

{
  "hide": true
}
```

#### Rate Limits (2025)
- **Per Instagram Account**: 200 API calls per hour
- **Isolated Pools**: Each connected account has separate limit
- **Example**: 10 accounts = 2,000 requests/hour total (200 × 10)
- **Throttling**: Exceeding limit blocks requests for that account

#### Best Practices
- **Respect Rate Limits**: Implement request throttling
- **Caching**: Cache results to reduce API calls
- **Batch Insights**: Retrieve insights in bulk (not one-by-one)
- **Token Refresh**: Build automatic refresh logic (60-day expiry)
- **Error Handling**: Handle rate limit errors (429) gracefully

#### Common Pitfalls
- **Double Charging**: Rate limit issues
- **Token Expiration**: Forgotten refresh logic
- **Scope Creep**: Requesting too many permissions upfront

#### Setup Process (Meta Developer Portal)
1. **Create App**: Meta for Developers
2. **Add Instagram Product**: Configure settings
3. **Connect Instagram Business Account**: Link account
4. **Request Permissions**: Submit for app review (if public)
5. **Generate Tokens**: Use OAuth flow

#### Pricing
- **Free API Access**: No charges for API usage
- **Limits**: 25 posts per day, 200 requests per hour per account

### 6.3 Facebook Messenger API

#### Authentication Method
- **Type**: OAuth 2.0 + Page Access Token
- **Requirement**: App must be associated with Facebook Page
- **Token Type**: Page access token (long-lived or permanent)

#### Setup Process
1. **Create Facebook App**: Developers Console
2. **Add Messenger Product**: Configure Messenger settings
3. **Associate Page**: Link your Facebook Page
4. **Subscribe to Webhooks**: Configure webhook URL
5. **Get Page Token**: Generate page access token

#### Webhook Configuration
- **Verification**: Same as Pages API (verify_token, challenge)
- **Events**: messages, messaging_postbacks, messaging_optins, message_deliveries
- **HTTPS Required**: Webhook URL must be secure
- **One URL per App**: Facebook allows only one webhook URL per app

#### Subscribe to Page Webhooks
```javascript
POST https://graph.facebook.com/v19.0/{page-id}/subscribed_apps
access_token={page-access-token}

{
  "subscribed_fields": ["messages", "messaging_postbacks", "message_deliveries"]
}
```

#### Webhook Payload Structure (Incoming Message)
```json
{
  "object": "page",
  "entry": [
    {
      "id": "PAGE_ID",
      "time": 1234567890,
      "messaging": [
        {
          "sender": { "id": "USER_ID" },
          "recipient": { "id": "PAGE_ID" },
          "timestamp": 1234567890,
          "message": {
            "mid": "MESSAGE_ID",
            "text": "Hello, I need help!"
          }
        }
      ]
    }
  ]
}
```

#### Send Text Message
```javascript
POST https://graph.facebook.com/v19.0/me/messages
access_token={page-access-token}

{
  "recipient": { "id": "USER_ID" },
  "message": { "text": "Hello! How can I help you today?" }
}
```

#### Send Quick Replies
```javascript
POST https://graph.facebook.com/v19.0/me/messages
access_token={page-access-token}

{
  "recipient": { "id": "USER_ID" },
  "message": {
    "text": "What would you like to do?",
    "quick_replies": [
      {
        "content_type": "text",
        "title": "Get Support",
        "payload": "SUPPORT_PAYLOAD"
      },
      {
        "content_type": "text",
        "title": "View Products",
        "payload": "PRODUCTS_PAYLOAD"
      },
      {
        "content_type": "text",
        "title": "Contact Sales",
        "payload": "SALES_PAYLOAD"
      }
    ]
  }
}
```
- **Limit**: 13 quick replies maximum
- **Title Length**: 20 characters (truncated if longer)

#### Send Button Template
```javascript
POST https://graph.facebook.com/v19.0/me/messages
access_token={page-access-token}

{
  "recipient": { "id": "USER_ID" },
  "message": {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "What would you like to do?",
        "buttons": [
          {
            "type": "web_url",
            "url": "https://example.com",
            "title": "Visit Website"
          },
          {
            "type": "postback",
            "title": "Get Help",
            "payload": "HELP_PAYLOAD"
          },
          {
            "type": "phone_number",
            "title": "Call Us",
            "payload": "+15551234567"
          }
        ]
      }
    }
  }
}
```
- **Button Limit**: 3 buttons maximum
- **Title Length**: 20 characters maximum

#### Messaging Window Restrictions
- **24-Hour Window**: Can respond freely within 24 hours of user message
- **Outside Window**: Must use approved Message Tags
- **Message Tags**: Limited use cases (account updates, confirmed event updates, post-purchase updates)
- **Compliance**: Violating policies can result in app suspension

#### Rate Limits (2025)

**Messenger Profile API**:
- **10 API calls** per 10-minute interval per Page

**Hourly Rate Limit**:
- **200 × number of messageable users**
- **Example**: 100 users = 20,000 requests/hour
- **High enough for most use cases**

**Content Limits**:
- **Quick Replies**: Maximum 13
- **Buttons**: Maximum 3
- **Title Length**: 20 characters (quick replies and buttons)

#### Best Practices
- **Queue Handling**: Add logic to space out message sends
- **Error Handling**: Handle rate limit responses
- **Retry Logic**: Exponential backoff for failures
- **Monitor Usage**: Track via response headers and App Dashboard
- **System User Tokens**: Use for higher limits (when applicable)
- **24-Hour Window**: Respect messaging window rules
- **Message Tags**: Use appropriately (don't abuse)

#### Common Webhook Events
- `messages`: User sent message
- `messaging_postbacks`: Button clicked (postback payload)
- `messaging_optins`: User opted in to messages
- `message_deliveries`: Message delivered confirmation
- `message_reads`: User read message
- `messaging_referrals`: User came from ad or link

#### Pricing
- **Free API Access**: No charges for sending/receiving messages
- **Advertising**: Separate cost (Click-to-Messenger ads)

#### Versioning & Maintenance
- **Deprecation Cycle**: Approximately every 2 years
- **Monitor Changelog**: Check official updates regularly
- **Token Expiry**: Common issue (40%+ of problems in surveys)
- **Plan Ahead**: Build token refresh into workflows

---

## 7. Security & Compliance Considerations

### 7.1 Webhook Security

**General Best Practices**:
- **HTTPS Only**: All webhooks must use secure endpoints
- **Verify Signatures**: Validate request signatures from platforms
- **Verify Tokens**: Match custom tokens (WhatsApp, Facebook)
- **Idempotency**: Track event IDs to prevent duplicate processing
- **Rate Limiting**: Implement on your webhook endpoints
- **Timeout Handling**: Respond quickly (within 5-30 seconds)

**Platform-Specific Verification**:
- **Twilio**: `X-Twilio-Signature` header
- **Stripe**: `stripe-signature` header + webhook secret
- **WhatsApp**: Token verification + signature validation
- **Facebook/Instagram**: `X-Hub-Signature-256` header
- **Google**: OAuth token validation
- **Microsoft**: OAuth token validation

### 7.2 Token Management

**Storage**:
- **Encrypt at Rest**: Never store tokens in plain text
- **Secure Transport**: Use HTTPS for all token exchanges
- **Environment Variables**: Store secrets in env vars (not code)
- **Secret Management**: Use services like AWS Secrets Manager, Azure Key Vault

**Rotation**:
- **Refresh Before Expiry**: Automate token refresh
- **Monitor Expiration**: Track token lifetimes
- **Graceful Failures**: Handle expired tokens without service interruption

**Scopes**:
- **Minimum Necessary**: Only request required permissions
- **Incremental Authorization**: Request scopes when needed
- **User Transparency**: Clearly explain why each permission is needed

### 7.3 Compliance

**Data Protection**:
- **GDPR**: EU data protection (right to access, delete, portability)
- **CCPA**: California consumer privacy rights
- **Data Retention**: Define and enforce retention policies
- **Data Deletion**: Implement user data deletion workflows

**PCI DSS** (If handling payments):
- **Tokenization**: Use Stripe tokens (never store raw card data)
- **Compliance Shift**: Stripe handles PCI compliance for you
- **Minimize Storage**: Don't store unnecessary payment data

**Platform Policies**:
- **Meta Platforms**: Follow Facebook, Instagram, WhatsApp policies
- **Google**: Adhere to API terms of service
- **Microsoft**: Comply with Graph API usage policies
- **Twilio**: Follow acceptable use policy

### 7.4 Rate Limit Management

**Detection**:
- **Monitor Response Codes**: 429 (Too Many Requests), 403 (Rate Limit)
- **Check Headers**: `Retry-After`, `X-RateLimit-*` headers
- **Dashboard Monitoring**: Use platform dashboards for quota tracking

**Mitigation**:
- **Exponential Backoff**: Increase wait time between retries
- **Jitter**: Add randomness to avoid thundering herd
- **Queue Systems**: Buffer requests during high load
- **Caching**: Reduce unnecessary API calls
- **Batch Operations**: Combine multiple requests when possible

**Optimization**:
- **Pagination**: Use cursors/offsets for large datasets
- **Field Selection**: Only request needed fields (`$select` in Graph API)
- **Webhooks Over Polling**: Subscribe to events instead of polling
- **CDN for Media**: Cache images/videos externally

---

## 8. Cost Summary & Analysis

### 8.1 Twilio Total Cost of Ownership

**Monthly Fixed Costs** (per US number):
- Phone Number Rental: $1.00/month (local) or $2.00/month (toll-free)
- A2P 10DLC Registration: $4.50 one-time + $1.50-$10/month per campaign

**Variable Costs**:
- SMS Outbound: $0.0079 per segment
- SMS Inbound: $0.0079 per segment
- Carrier Fees (A2P): $0.002-$0.004 per segment (added to SMS cost)
- Voice Inbound: $0.0085-$0.022 per minute
- Voice Outbound: $0.013-$0.030 per minute
- Recording Storage: $0.0005 per minute per month
- Transcription: $0.05 per minute

**Example Monthly Cost** (1 number, 10,000 SMS, 100 voice minutes):
- Number: $1.00
- Campaign: $1.50 (Low Volume)
- SMS: $79 (10,000 segments × $0.0079)
- Carrier Fees: $30 (10,000 × $0.003 average)
- Voice: $15 (100 minutes × $0.015 average)
- **Total**: ~$126.50/month

### 8.2 Stripe Total Cost of Ownership

**No Monthly Fees**:
- No setup fee
- No monthly fee
- No minimum

**Transaction Fees** (US):
- Online Payments: 2.9% + $0.30
- International Cards: 3.1% + $0.30 + 1.5% cross-border
- In-Person (Terminal): 2.7% + $0.05
- Disputes: $15 (refunded if won)

**Example Monthly Cost** ($10,000 in sales, 100 transactions):
- Transaction Fees: $290 + $30 = $320
- **Total**: $320/month (3.2% effective rate)

**Connect Platform Revenue**:
- Platform Fee: Customizable (typically 2-5% of transaction)
- Example: 3% platform fee on $10,000 = $300 additional revenue

### 8.3 WhatsApp Business API

**Fixed Costs**:
- Meta Business Verification: $0 (optional, but recommended)
- Phone Number: Via BSP (Business Solution Provider)

**BSP Costs** (varies by provider):
- Setup Fee: $0-$500 one-time
- Monthly Subscription: $50-$500/month (depending on features/volume)
- API Call Limits: 200,000-20M calls/month (tier-based)

**Per-Message Costs** (Post July 1, 2025, US example):
- Marketing: $0.05-$0.15 per message
- Utility: $0.02-$0.08 per message
- Authentication: $0.01-$0.05 per message
- Service (within 24hr window): FREE

**Example Monthly Cost** (10,000 messages, 60% utility, 40% marketing):
- BSP Subscription: $100
- Utility (6,000): $300 (6,000 × $0.05 average)
- Marketing (4,000): $400 (4,000 × $0.10 average)
- **Total**: ~$800/month

### 8.4 Google Workspace APIs

**API Costs**:
- **Free**: No additional cost beyond Google Workspace subscription
- **Workspace Subscription**: $6-$18 per user per month (depending on plan)

**Generous Quotas**:
- Calendar, Gmail, Contacts APIs included
- Rate limits rarely hit for normal use

**Example Monthly Cost** (50 users, Business Standard):
- Google Workspace: $720/month (50 × $14.40)
- API Usage: $0
- **Total**: $720/month

### 8.5 Microsoft 365 Graph API

**API Costs**:
- **Free**: Included with Microsoft 365 licensing
- **Microsoft 365 Subscription**: $5-$22 per user per month (depending on plan)

**Metered APIs** (Formerly Charged, Now Free as of Aug 25, 2025):
- Teams exports, transcripts, recordings: No longer charged

**Example Monthly Cost** (50 users, Business Standard):
- Microsoft 365: $625/month (50 × $12.50)
- API Usage: $0
- **Total**: $625/month

### 8.6 Social Media APIs

**Costs**:
- **Facebook Pages API**: Free
- **Instagram Graph API**: Free
- **Messenger API**: Free

**Limits**:
- Instagram: 25 posts per day, 200 API calls per hour per account
- Messenger: 200 × messageable users per hour
- Facebook: Varies by endpoint

**Example Monthly Cost**:
- **Total**: $0 (API usage is free)

**Optional Advertising Costs** (Separate from API):
- Facebook/Instagram Ads: Variable (pay-per-click or impression)
- Click-to-Messenger Ads: Variable

### 8.7 Total Platform Cost Estimate

**Scenario**: Multi-tenant CRM platform with 100 clients

**Per-Client Monthly Costs**:
- Twilio (1 number, 5,000 SMS, 50 voice minutes): ~$60
- WhatsApp (5,000 messages): ~$300
- Stripe (pass-through, no platform cost): $0
- Platform Revenue from Stripe (3% of $5,000): $150

**Platform-Wide Costs**:
- Google Workspace (5 admin users): $72
- Microsoft 365 (5 admin users): $62.50
- Social Media APIs: $0

**Total Monthly Costs**:
- Client Costs: $36,000 (100 × $360)
- Platform Costs: $134.50
- **Grand Total**: ~$36,134.50/month

**Potential Revenue**:
- Client Subscriptions: 100 × $500/month = $50,000
- Stripe Platform Fees: 100 × $150 = $15,000
- **Total Revenue**: $65,000/month

**Profit Margin**: ~$28,865.50/month (44% margin)

---

## 9. Integration Priorities & Recommendations

### 9.1 Phase 1: Core Communication (Launch MVP)
1. **Twilio SMS**: Essential for CRM communication
2. **Stripe Payments**: Required for monetization
3. **Google Calendar**: Core scheduling feature

### 9.2 Phase 2: Enhanced Engagement
1. **WhatsApp Business API**: High-value messaging channel
2. **Twilio Voice**: Complete communication suite
3. **Facebook Messenger**: Additional messaging channel

### 9.3 Phase 3: Full Integration
1. **Instagram Graph API**: Social media management
2. **Microsoft 365 Integration**: Enterprise clients
3. **Facebook Pages API**: Complete social suite

### 9.4 Technical Architecture Recommendations

**Webhook Processing**:
- Use queue system (Redis, RabbitMQ, AWS SQS)
- Implement retry logic with exponential backoff
- Track event IDs for idempotency

**Token Management**:
- Centralized token service
- Encrypted storage (database or secret manager)
- Automatic refresh before expiration
- Per-tenant token isolation

**Rate Limit Handling**:
- Distributed rate limiter (Redis-based)
- Per-tenant quotas
- Queue buffering for burst traffic
- Graceful degradation

**Multi-Tenancy**:
- Stripe Connect for payment isolation
- Per-tenant API credentials
- Separate webhook routing
- Tenant-specific rate limits

---

## 10. Sources & References

### Twilio Documentation
- [Webhooks Introduction](https://www.twilio.com/docs/usage/webhooks)
- [Messaging Webhooks](https://www.twilio.com/docs/usage/webhooks/messaging-webhooks)
- [A2P 10DLC Pricing](https://support.twilio.com/hc/en-us/articles/1260803965530)
- [A2P 10DLC Requirements](https://help.twilio.com/articles/11847054539547)
- [Voice Webhooks](https://www.twilio.com/docs/usage/webhooks/voice-webhooks)
- [Phone Number Pricing](https://www.twilio.com/en-us/pricing)

### Stripe Documentation
- [Stripe Connect](https://docs.stripe.com/connect)
- [Payment Intents API](https://docs.stripe.com/api/payment_intents)
- [Subscriptions Webhooks](https://docs.stripe.com/billing/subscriptions/webhooks)
- [Apple Pay Integration](https://stripe.com/payments/apple-pay)
- [Pricing for Google Pay](https://support.stripe.com/questions/pricing-for-google-pay-with-stripe)

### WhatsApp Business API
- [Meta Business Verification](https://faq.whatsapp.com/794517045178057)
- [WhatsApp Message Templates](https://respond.io/blog/whatsapp-template-message)
- [WhatsApp API Pricing 2025](https://www.interakt.shop/resource-center/whatsapp-business-api-pricing-structure/)
- [Interactive Messages](https://www.wati.io/blog/whatsapp-business-interactive-message-templates/)

### Google APIs
- [Google Calendar API Scopes](https://developers.google.com/workspace/calendar/api/auth)
- [Gmail API Usage Limits](https://developers.google.com/workspace/gmail/api/reference/quota)
- [People API (Contacts)](https://developers.google.com/people)
- [OAuth 2.0 for Google APIs](https://developers.google.com/identity/protocols/oauth2)

### Microsoft Graph API
- [Outlook Calendar API](https://learn.microsoft.com/en-us/graph/outlook-calendar-concept-overview)
- [Microsoft Graph Rate Limits](https://learn.microsoft.com/en-us/graph/throttling-limits)
- [Graph API Pricing Changes](https://empowering.cloud/microsoft-ends-charges-for-select-teams-metered-graph-apis/)

### Social Media APIs
- [Facebook Pages API](https://developers.facebook.com/docs/pages)
- [Instagram Graph API Guide](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2025/)
- [Messenger Platform](https://developers.facebook.com/docs/messenger-platform)

---

## Document Metadata
- **Last Updated**: December 18, 2025
- **Version**: 1.0
- **Author**: Research Agent
- **Purpose**: GoHighLevel Clone Integration Specifications
- **Status**: Comprehensive research complete

---

*This document provides detailed integration specifications based on current 2025 documentation and industry best practices. All pricing, rate limits, and features are subject to change by the respective platform providers.*
