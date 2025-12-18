# GoHighLevel Clone API - Quick Reference

## Base URL

```
Production: https://api.gohighlevel-clone.com/v1
```

## Authentication

All requests (except auth endpoints) require Bearer token:

```bash
Authorization: Bearer <access_token>
```

## Quick Start Examples

### 1. Authentication Flow

```bash
# Register
POST /auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

# Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Response
{
  "user": { "id": "...", "email": "..." },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 3600
  }
}

# Refresh Token
POST /auth/refresh
{
  "refreshToken": "eyJ..."
}
```

### 2. Agency Management

```bash
# Create Agency
POST /agencies
{
  "name": "Acme Marketing Agency",
  "email": "contact@acmeagency.com",
  "plan": "professional"
}

# List Agencies
GET /agencies?limit=50&filter[status]=active

# Update Agency Settings
PATCH /agencies/{agencyId}/settings
{
  "timezone": "America/New_York",
  "currency": "USD"
}
```

### 3. Location (Sub-Account) Management

```bash
# Create Location
POST /locations
{
  "agencyId": "agency-uuid",
  "name": "Downtown Office",
  "email": "downtown@acme.com"
}

# Get Location Stats
GET /locations/{locationId}/stats?startDate=2025-01-01&endDate=2025-12-31
```

### 4. Contact Management

```bash
# Create Contact
POST /contacts
{
  "locationId": "location-uuid",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1-555-123-4567"
}

# Search Contacts
GET /contacts?locationId={id}&search=jane&filter[tags]=vip

# Bulk Import
POST /contacts/bulk
{
  "locationId": "location-uuid",
  "contacts": [
    { "email": "user1@example.com", "firstName": "User1" },
    { "email": "user2@example.com", "firstName": "User2" }
  ]
}

# Export Contacts
POST /contacts/export
{
  "locationId": "location-uuid",
  "format": "csv"
}
```

### 5. Conversations & Messaging

```bash
# List Conversations
GET /conversations?locationId={id}&filter[unread]=true

# Send Message
POST /conversations/{conversationId}/messages
{
  "type": "text",
  "content": "Hello, how can I help you today?"
}

# Configure WhatsApp Channel
POST /conversations/channels/whatsapp/configure
{
  "locationId": "location-uuid",
  "config": {
    "phoneNumberId": "...",
    "accessToken": "..."
  }
}
```

### 6. Opportunities & Pipelines

```bash
# Create Pipeline
POST /pipelines
{
  "locationId": "location-uuid",
  "name": "Sales Pipeline",
  "stages": [
    { "name": "Lead", "order": 1, "probability": 10 },
    { "name": "Qualified", "order": 2, "probability": 25 },
    { "name": "Proposal", "order": 3, "probability": 50 },
    { "name": "Closed", "order": 4, "probability": 100 }
  ]
}

# Create Opportunity
POST /opportunities
{
  "locationId": "location-uuid",
  "pipelineId": "pipeline-uuid",
  "stageId": "stage-uuid",
  "contactId": "contact-uuid",
  "name": "Enterprise Deal",
  "value": 50000,
  "currency": "USD"
}

# Move Opportunity
POST /opportunities/{opportunityId}/move
{
  "stageId": "next-stage-uuid"
}

# Get Pipeline Stats
GET /opportunities/stats?locationId={id}&pipelineId={id}
```

### 7. Calendar & Appointments

```bash
# Create Calendar
POST /calendars
{
  "locationId": "location-uuid",
  "name": "Sales Consultations",
  "availability": {
    "monday": {
      "enabled": true,
      "slots": [{ "start": "09:00", "end": "17:00" }]
    }
  }
}

# Check Availability
GET /calendars/{calendarId}/availability?startDate=2025-12-18&endDate=2025-12-25

# Book Appointment (Public)
POST /appointments/booking
{
  "calendarId": "calendar-uuid",
  "startTime": "2025-12-20T10:00:00Z",
  "endTime": "2025-12-20T11:00:00Z",
  "contact": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567"
  }
}
```

### 8. Workflows & Automation

```bash
# Create Workflow
POST /workflows
{
  "locationId": "location-uuid",
  "name": "Welcome Sequence",
  "trigger": {
    "type": "contact_created"
  },
  "actions": [
    {
      "type": "send_email",
      "order": 1,
      "config": { "template": "welcome_email" }
    },
    {
      "type": "wait",
      "order": 2,
      "config": { "delay": 86400 }
    },
    {
      "type": "add_tag",
      "order": 3,
      "config": { "tag": "onboarded" }
    }
  ]
}

# Execute Workflow Manually
POST /workflows/{workflowId}/execute
{
  "contactId": "contact-uuid"
}

# Activate Workflow
POST /workflows/{workflowId}/activate
```

### 9. Campaigns & Email Marketing

```bash
# Create Campaign
POST /campaigns
{
  "locationId": "location-uuid",
  "name": "Summer Sale 2025",
  "type": "email",
  "subject": "Don't miss our summer sale!",
  "content": "<html>...</html>",
  "recipients": {
    "type": "tags",
    "tags": ["customer", "active"]
  }
}

# Send Test
POST /campaigns/{campaignId}/test
{
  "recipients": ["test@example.com"]
}

# Schedule Campaign
POST /campaigns/{campaignId}/schedule
{
  "scheduledAt": "2025-12-25T09:00:00Z"
}

# Get Campaign Stats
GET /campaigns/{campaignId}/stats
```

### 10. Payments & Subscriptions

```bash
# Create Product
POST /products
{
  "locationId": "location-uuid",
  "name": "Premium Subscription",
  "type": "recurring",
  "price": 99.99,
  "currency": "USD",
  "billingInterval": "month"
}

# Create Invoice
POST /invoices
{
  "locationId": "location-uuid",
  "contactId": "contact-uuid",
  "items": [
    {
      "description": "Consulting Services",
      "quantity": 10,
      "unitPrice": 150
    }
  ],
  "dueDate": "2025-12-31"
}

# Create Subscription
POST /subscriptions
{
  "locationId": "location-uuid",
  "contactId": "contact-uuid",
  "productId": "product-uuid",
  "paymentMethodId": "pm_..."
}

# Process Payment
POST /payments
{
  "locationId": "location-uuid",
  "contactId": "contact-uuid",
  "amount": 99.99,
  "currency": "USD",
  "paymentMethodId": "pm_..."
}
```

### 11. Sites, Funnels & Forms

```bash
# Create Funnel
POST /funnels
{
  "locationId": "location-uuid",
  "name": "Product Launch Funnel",
  "domain": "launch.example.com",
  "path": "/product-launch"
}

# Create Page
POST /pages
{
  "locationId": "location-uuid",
  "funnelId": "funnel-uuid",
  "name": "Landing Page",
  "type": "landing",
  "content": { /* page builder JSON */ }
}

# Create Form
POST /forms
{
  "locationId": "location-uuid",
  "name": "Lead Capture",
  "fields": [
    {
      "id": "email",
      "type": "email",
      "label": "Email Address",
      "required": true
    }
  ],
  "settings": {
    "createContact": true,
    "addTags": ["lead"]
  }
}

# Submit Form (Public)
POST /forms/{formId}/submissions
{
  "data": {
    "email": "lead@example.com",
    "firstName": "New Lead"
  }
}
```

### 12. AI Agents

```bash
# Create AI Agent
POST /ai/agents
{
  "locationId": "location-uuid",
  "name": "Support Bot",
  "type": "chatbot",
  "config": {
    "model": "gpt-4",
    "temperature": 0.7,
    "systemPrompt": "You are a helpful customer support agent...",
    "personality": {
      "tone": "friendly",
      "style": "concise"
    }
  }
}

# Train Agent
POST /ai/agents/{agentId}/train
{
  "trainingData": [
    {
      "question": "What are your hours?",
      "answer": "We're open Monday-Friday, 9am-5pm EST."
    }
  ]
}

# Deploy Agent
POST /ai/agents/{agentId}/deploy
{
  "channels": ["webchat", "whatsapp"],
  "autoRespond": true
}

# Start AI Conversation
POST /ai/conversations
{
  "agentId": "agent-uuid",
  "contactId": "contact-uuid",
  "channel": "webchat"
}

# Send Message to AI
POST /ai/conversations/{conversationId}/messages
{
  "message": "What are your business hours?"
}
```

## Common Patterns

### Pagination

```bash
# First page
GET /contacts?limit=50

# Next page
GET /contacts?limit=50&cursor=eyJpZCI6MTIzfQ

# Response includes pagination info
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6MTczfQ",
    "hasMore": true,
    "total": 1250
  }
}
```

### Filtering

```bash
GET /contacts?filter[status]=active&filter[tags]=vip,customer
GET /opportunities?filter[status]=open&filter[assignedTo]={userId}
GET /campaigns?filter[type]=email&filter[status]=sent
```

### Sorting

```bash
GET /contacts?sort=-createdAt          # Descending by creation date
GET /contacts?sort=firstName           # Ascending by first name
GET /opportunities?sort=-value         # Descending by value
```

### Searching

```bash
GET /contacts?search=john              # Search by name, email, phone
GET /opportunities?search=enterprise   # Search by name
```

## Rate Limits

Include these headers in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ],
    "requestId": "req_abc123",
    "timestamp": "2025-12-18T10:30:00Z"
  }
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Webhooks

Configure webhooks to receive real-time events:

```bash
POST /webhooks
{
  "url": "https://your-app.com/webhooks",
  "events": [
    "contact.created",
    "opportunity.won",
    "appointment.scheduled",
    "form.submitted"
  ],
  "secret": "whsec_abc123"
}
```

## SDKs

Official SDKs available for:
- JavaScript/TypeScript
- Python
- PHP
- Ruby
- Go
- .NET

## Additional Resources

- Full API Documentation: `/docs/api/openapi.yaml`
- Individual Endpoints: `/docs/api/endpoints/`
- Postman Collection: Available on request
- API Status: https://status.gohighlevel-clone.com
