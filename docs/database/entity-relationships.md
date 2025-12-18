# Entity Relationship Documentation

## Table of Contents

1. [Multi-Tenancy Relationships](#multi-tenancy-relationships)
2. [CRM Relationships](#crm-relationships)
3. [Conversations Relationships](#conversations-relationships)
4. [Sales Pipeline Relationships](#sales-pipeline-relationships)
5. [Calendar Relationships](#calendar-relationships)
6. [Workflow Relationships](#workflow-relationships)
7. [Marketing Relationships](#marketing-relationships)
8. [Payments Relationships](#payments-relationships)
9. [Sites Relationships](#sites-relationships)
10. [AI Relationships](#ai-relationships)

---

## Multi-Tenancy Relationships

### Hierarchy

```
agencies (1) ──────< (∞) sub_accounts
    │                       │
    │                       │
    ∨                       ∨
user_agency_memberships  user_sub_account_memberships
    │                       │
    └───────> (∞) users (∞) <─────┘

roles (agency-level)    roles (sub-account-level)
    │                       │
    ∨                       ∨
role_permissions ──> permissions
```

### Key Relationships

| Parent Table | Child Table | Relationship Type | On Delete |
|--------------|-------------|-------------------|-----------|
| agencies | sub_accounts | One-to-Many | CASCADE |
| agencies | user_agency_memberships | One-to-Many | CASCADE |
| sub_accounts | user_sub_account_memberships | One-to-Many | CASCADE |
| users | user_agency_memberships | One-to-Many | CASCADE |
| users | user_sub_account_memberships | One-to-Many | CASCADE |
| roles | role_permissions | One-to-Many | CASCADE |
| permissions | role_permissions | One-to-Many | CASCADE |

### Data Flow Example

```
Agency: "Digital Marketing Co"
    ├── Sub-Account: "Restaurant Location A"
    │   ├── User: john@restaurant.com (Role: Manager)
    │   └── User: jane@restaurant.com (Role: Staff)
    │
    └── Sub-Account: "Restaurant Location B"
        └── User: bob@restaurant.com (Role: Manager)

Agency-Level User: admin@digitalmarketing.com
    ├── Access to: All sub-accounts
    └── Role: Agency Admin
```

---

## CRM Relationships

### Core Structure

```
sub_accounts (1)
    │
    ├──< (∞) contacts
    │       │
    │       ├──< (∞) contact_tags ──> (∞) tags
    │       ├──< (∞) notes
    │       ├──< (∞) tasks
    │       ├──< (∞) opportunities
    │       ├──< (∞) appointments
    │       ├──< (∞) conversations
    │       └──< (∞) form_submissions
    │
    ├──< (∞) contact_custom_fields (field definitions)
    └──< (∞) tags
```

### Contact Data Model

```
contact {
    id: uuid
    sub_account_id: uuid → sub_accounts
    assigned_user_id: uuid → users

    # Standard fields
    email, phone, first_name, last_name

    # Custom fields
    custom_fields: jsonb {
        "company_size": "1-10 employees",
        "industry": "technology",
        "annual_revenue": 500000
    }

    # Lifecycle
    lifecycle_stage: "lead" | "customer" | ...
    lead_score: integer
}
```

### Tag Relationships

```
Many-to-Many via contact_tags:

contact_1 ──┐
contact_2 ──┼──> contact_tags ──> tag: "VIP Customer"
contact_3 ──┘

contact_4 ──┐
contact_5 ──┼──> contact_tags ──> tag: "Newsletter Subscriber"
contact_6 ──┘
```

### Custom Fields Pattern

```sql
-- Define field
INSERT INTO contact_custom_fields (
    sub_account_id,
    key,
    name,
    field_type,
    options
) VALUES (
    'sub-123',
    'company_size',
    'Company Size',
    'select',
    '["1-10", "11-50", "51-200", "200+"]'::jsonb
);

-- Store value
UPDATE contacts
SET custom_fields = custom_fields || '{"company_size": "11-50"}'::jsonb
WHERE id = 'contact-456';

-- Query
SELECT * FROM contacts
WHERE custom_fields->>'company_size' = '11-50';
```

---

## Conversations Relationships

### Unified Inbox Structure

```
sub_accounts (1)
    │
    ├──< (∞) channels (SMS, Email, WhatsApp, etc.)
    │       │
    │       └──< (∞) conversations
    │               │
    │               ├──< (∞) messages
    │               └──< (1) conversation_ai_configs
    │                       │
    │                       └──> ai_agents
    │
    └──< (∞) contacts
            │
            └──< (∞) conversations
```

### Message Flow

```
1. Inbound Message Arrives
   ├── Create/Update conversation
   ├── Create message record
   ├── Match or create contact
   └── Trigger workflows

2. Conversation Assignment
   ├── Auto-assign based on rules
   ├── Round-robin distribution
   └── Skill-based routing

3. AI Handoff (optional)
   ├── AI responds automatically
   ├── Monitor sentiment/complexity
   └── Handoff to human if needed
```

### Channel Configuration

```
channel {
    id: uuid
    sub_account_id: uuid
    channel_type: "sms" | "email" | "whatsapp" | ...

    provider: "twilio" | "sendgrid" | "meta"
    config: jsonb {
        "phone_number": "+1234567890",
        "api_key": "encrypted...",
        "webhook_url": "https://..."
    }
}

conversation {
    id: uuid
    channel_id: uuid → Which channel
    contact_id: uuid → Who is conversing
    assigned_user_id: uuid → Assigned agent
    status: "open" | "pending" | "resolved"
}

message {
    id: uuid
    conversation_id: uuid
    direction: "inbound" | "outbound"
    sender_type: "contact" | "user" | "bot"
    content_type: "text" | "image" | "video"
    body: text
    status: "sent" | "delivered" | "read"
}
```

---

## Sales Pipeline Relationships

### Pipeline Structure

```
sub_accounts (1)
    │
    └──< (∞) pipelines
            │
            ├──< (∞) pipeline_stages
            │       │
            │       └──< (∞) opportunities
            │               │
            │               └──< (∞) opportunity_stage_history
            │
            └── default pipeline
```

### Opportunity Lifecycle

```
Pipeline: "Sales Pipeline"
    │
    ├── Stage: "New Lead" (probability: 10%)
    │   └── opportunities: 45 ($234,000)
    │
    ├── Stage: "Qualified" (probability: 25%)
    │   └── opportunities: 23 ($567,000)
    │
    ├── Stage: "Proposal Sent" (probability: 50%)
    │   └── opportunities: 12 ($389,000)
    │
    ├── Stage: "Negotiation" (probability: 75%)
    │   └── opportunities: 7 ($456,000)
    │
    └── Stage: "Closed Won" (probability: 100%, is_won: true)
        └── opportunities: 34 ($2,345,000)
```

### Stage Movement Tracking

```
opportunity_stage_history:

opportunity_id | from_stage       | to_stage         | duration_seconds | changed_at
---------------|------------------|------------------|------------------|------------
opp-123        | New Lead         | Qualified        | 172800           | 2025-12-15
opp-123        | Qualified        | Proposal Sent    | 86400            | 2025-12-17
opp-123        | Proposal Sent    | Negotiation      | 259200           | 2025-12-20

# Analytics: Average time in each stage
SELECT
    from_stage_id,
    AVG(duration_seconds) as avg_duration
FROM opportunity_stage_history
GROUP BY from_stage_id;
```

### Custom Fields on Opportunities

```
opportunity_custom_fields: [
    {
        key: "deal_type",
        name: "Deal Type",
        field_type: "select",
        options: ["New Business", "Upsell", "Renewal"]
    },
    {
        key: "competitor",
        name: "Main Competitor",
        field_type: "text"
    }
]

opportunity.custom_fields: {
    "deal_type": "New Business",
    "competitor": "CompetitorCo",
    "decision_date": "2025-12-31"
}
```

---

## Calendar Relationships

### Calendar Hierarchy

```
sub_accounts (1)
    │
    ├──< (∞) calendar_types (service categories)
    │
    ├──< (∞) services (bookable services)
    │       │
    │       └──> calendar_types
    │
    └──< users (∞)
            │
            └──< (∞) calendars
                    │
                    ├──< (∞) availability rules
                    └──< (∞) appointments
                            │
                            ├──> contacts
                            └──> services
```

### Availability Logic

```
calendar {
    id: "cal-123"
    user_id: "user-456"
    name: "John's Calendar"
}

availability: [
    {
        calendar_id: "cal-123",
        day_of_week: 1, // Monday
        start_time: "09:00",
        end_time: "17:00",
        timezone: "America/New_York"
    },
    {
        calendar_id: "cal-123",
        day_of_week: 2, // Tuesday
        start_time: "09:00",
        end_time: "17:00"
    },
    // Override: Christmas Day
    {
        calendar_id: "cal-123",
        valid_from: "2025-12-25",
        valid_to: "2025-12-25",
        is_active: false // Not available
    }
]
```

### Appointment Booking Flow

```
1. Contact selects service
   ├── service.duration_minutes = 30
   └── service.requires_payment = true

2. System calculates availability
   ├── Check calendar.availability rules
   ├── Exclude existing appointments
   ├── Apply buffer_before/after
   └── Return available time slots

3. Contact books appointment
   ├── Create appointment record
   ├── Send confirmation email
   ├── Add to calendar (local + external sync)
   └── Trigger reminder workflow

4. Appointment lifecycle
   ├── Status: "scheduled"
   ├── Reminder sent 24h before
   ├── Status: "confirmed" (contact confirms)
   ├── Status: "completed" (after appointment)
   └── Status: "no_show" (if no show)
```

### External Calendar Sync

```
calendar {
    external_calendar_provider: "google"
    external_calendar_id: "primary"
    sync_enabled: true
    last_synced_at: "2025-12-18 10:00:00"
}

# Background job:
1. Fetch updates from Google Calendar API
2. Create appointments for new Google events
3. Update existing appointments
4. Push local appointments to Google
```

---

## Workflow Relationships

### Workflow Structure

```
sub_accounts (1)
    │
    └──< (∞) workflows
            │
            ├──< (∞) workflow_triggers
            │
            ├──< (∞) workflow_actions (tree structure)
            │       │
            │       └──> parent_action_id (self-reference)
            │
            └──< (∞) workflow_executions
                    │
                    ├──> contacts
                    └──< (∞) workflow_action_executions
                            │
                            └──> workflow_actions
```

### Workflow Tree Example

```
workflow: "Welcome Series"
    │
    └── workflow_actions:
        │
        ├── [1] Send Welcome Email (parent_id: null)
        │   │
        │   └── [2] Wait 1 Day (parent_id: 1)
        │       │
        │       └── [3] IF: Opened Email? (parent_id: 2)
        │           │
        │           ├── [4] YES → Send Product Tips (parent_id: 3)
        │           │   │
        │           │   └── [6] Add Tag: "Engaged" (parent_id: 4)
        │           │
        │           └── [5] NO → Send Re-engagement Email (parent_id: 3)
        │               │
        │               └── [7] Add Tag: "Needs Nurture" (parent_id: 5)
```

### Workflow Execution Tracking

```
workflow_execution {
    id: "exec-123"
    workflow_id: "workflow-456"
    contact_id: "contact-789"
    status: "running"
    current_action_id: "action-3"
    context: {
        "opened_email": true,
        "click_count": 2
    }
}

workflow_action_executions: [
    {
        workflow_execution_id: "exec-123",
        workflow_action_id: "action-1",
        status: "completed",
        started_at: "2025-12-18 09:00:00",
        completed_at: "2025-12-18 09:00:05"
    },
    {
        workflow_execution_id: "exec-123",
        workflow_action_id: "action-2",
        status: "completed",
        scheduled_for: "2025-12-19 09:00:00", # Wait 1 day
        completed_at: "2025-12-19 09:00:01"
    },
    {
        workflow_execution_id: "exec-123",
        workflow_action_id: "action-3",
        status: "running", # Currently evaluating condition
    }
]
```

### Trigger Examples

```
workflow_triggers: [
    {
        workflow_id: "workflow-welcome",
        trigger_type: "contact_created",
        conditions: {
            "source": "website_form"
        }
    },
    {
        workflow_id: "workflow-abandoned-cart",
        trigger_type: "opportunity_stage_changed",
        conditions: {
            "to_stage": "proposal_sent",
            "days_in_stage": 3
        }
    },
    {
        workflow_id: "workflow-reengagement",
        trigger_type: "tag_added",
        conditions: {
            "tag": "inactive"
        }
    }
]
```

---

## Marketing Relationships

### Campaign Structure

```
sub_accounts (1)
    │
    ├──< (∞) email_templates
    │
    ├──< (∞) sms_templates
    │
    └──< (∞) campaigns
            │
            ├──> email_templates
            ├──> sms_templates
            │
            └──< (∞) campaign_recipients
                    │
                    ├──> contacts
                    └──< (∞) email_clicks
```

### Campaign Flow

```
1. Create Campaign
   ├── Select template
   ├── Define audience (tags, segments)
   └── Schedule send time

2. Campaign Execution
   ├── Resolve audience → contacts
   ├── Create campaign_recipients
   ├── Send messages (batch process)
   └── Track delivery

3. Engagement Tracking
   campaign_recipients:
       ├── status: "sent"
       ├── opened_at: "2025-12-18 10:30:00"
       ├── first_clicked_at: "2025-12-18 10:32:00"
       ├── open_count: 3
       └── click_count: 2

   email_clicks: [
       {url: "/product-1", clicked_at: "10:32:00"},
       {url: "/pricing", clicked_at: "10:35:00"}
   ]

4. Campaign Analytics
   campaign:
       ├── total_recipients: 10,000
       ├── sent_count: 9,987
       ├── delivered_count: 9,876
       ├── opened_count: 4,234 (42.3% open rate)
       ├── clicked_count: 1,567 (15.7% click rate)
       ├── bounced_count: 111
       └── unsubscribed_count: 23
```

### Template Variables

```
email_template {
    subject: "Hi {{first_name}}, check out our new features!"
    html_content: "<p>Hey {{first_name}},</p>..."
    variables: [
        {name: "first_name", default: "there"},
        {name: "company_name", default: "your company"}
    ]
}

# Rendering:
contact {
    first_name: "John",
    custom_fields: {
        company_name: "Acme Corp"
    }
}

# Output:
Subject: "Hi John, check out our new features!"
Body: "Hey John, we thought Acme Corp might like..."
```

---

## Payments Relationships

### Payment Hierarchy

```
sub_accounts (1)
    │
    ├──< (∞) products
    │       │
    │       └──< (∞) prices
    │
    └──< contacts (∞)
            │
            ├──< (∞) payment_methods
            │
            ├──< (∞) subscriptions
            │       │
            │       ├──> products
            │       ├──> prices
            │       └──< (∞) transactions
            │
            ├──< (∞) invoices
            │       │
            │       ├──< (∞) invoice_line_items
            │       │       │
            │       │       └──> products
            │       │
            │       └──< (∞) transactions
            │
            └──< (∞) transactions
```

### Product & Pricing Model

```
product {
    id: "prod-saas",
    name: "SaaS Platform",
    product_type: "recurring"
}

prices: [
    {
        product_id: "prod-saas",
        amount: 29.00,
        currency: "USD",
        billing_period: "month",
        billing_interval: 1, # Every 1 month
        stripe_price_id: "price_abc123"
    },
    {
        product_id: "prod-saas",
        amount: 290.00,
        currency: "USD",
        billing_period: "year",
        billing_interval: 1, # Save $58/year
        trial_period_days: 14
    }
]
```

### Subscription Lifecycle

```
1. Contact subscribes
   ├── Create subscription record
   ├── Create initial invoice
   ├── Process payment → transaction
   └── Start trial (if applicable)

subscription {
    id: "sub-123",
    contact_id: "contact-456",
    product_id: "prod-saas",
    price_id: "price-monthly",
    status: "trialing",
    trial_start: "2025-12-18",
    trial_end: "2026-01-01",
    current_period_start: "2025-12-18",
    current_period_end: "2026-01-18"
}

2. Trial ends → First charge
   ├── Generate invoice
   ├── Charge payment method
   ├── Create transaction
   └── status: "active"

3. Recurring billing
   Every billing period:
       ├── Generate new invoice
       ├── Charge payment method
       ├── Create transaction
       └── Update current_period_*

4. Cancellation
   ├── status: "cancelled"
   ├── cancelled_at: timestamp
   ├── Access until: current_period_end
   └── ended_at: current_period_end
```

### Invoice Generation

```
invoice {
    id: "inv-001",
    contact_id: "contact-456",
    invoice_number: "INV-2025-001",
    subtotal: 100.00,
    tax_amount: 8.00,
    discount_amount: 10.00,
    total_amount: 98.00,
    status: "open"
}

invoice_line_items: [
    {
        invoice_id: "inv-001",
        product_id: "prod-saas",
        description: "SaaS Platform - Monthly",
        quantity: 1,
        unit_price: 29.00,
        amount: 29.00
    },
    {
        invoice_id: "inv-001",
        product_id: "prod-addon",
        description: "Extra Users (10)",
        quantity: 10,
        unit_price: 5.00,
        amount: 50.00
    }
]

transactions: [
    {
        invoice_id: "inv-001",
        transaction_type: "payment",
        amount: 98.00,
        status: "succeeded",
        gateway: "stripe",
        gateway_transaction_id: "ch_abc123"
    }
]
```

---

## Sites Relationships

### Funnel Structure

```
sub_accounts (1)
    │
    └──< (∞) funnels
            │
            └──< (∞) pages
                    │
                    ├──< (∞) forms
                    │       │
                    │       └──< (∞) form_submissions
                    │               │
                    │               └──> contacts (auto-create/match)
                    │
                    └──< (∞) surveys
                            │
                            └──< (∞) survey_responses
```

### Funnel Flow Example

```
funnel: "Product Launch Funnel"
    │
    ├── page: "/" (Landing Page)
    │   ├── slug: "/"
    │   ├── form: "Lead Capture Form"
    │   └── page_type: "landing"
    │
    ├── page: "/watch-demo" (Video Page)
    │   ├── slug: "/watch-demo"
    │   └── page_type: "standard"
    │
    ├── page: "/pricing" (Pricing Page)
    │   ├── slug: "/pricing"
    │   └── form: "Get Started Form"
    │
    └── page: "/thank-you" (Thank You Page)
        ├── slug: "/thank-you"
        └── page_type: "thank_you"
```

### Form Submission Flow

```
1. Visitor submits form
   ├── Create form_submission
   ├── data: {email, name, phone, ...}
   └── ip_address, user_agent

2. Process submission
   ├── Match existing contact by email
   ├── OR create new contact
   ├── Link form_submission.contact_id
   └── Trigger workflows (form_submitted event)

form_submission {
    id: "sub-123",
    form_id: "form-456",
    contact_id: "contact-789", # Auto-matched/created
    data: {
        "email": "john@example.com",
        "full_name": "John Doe",
        "phone": "+1234567890",
        "message": "Interested in your service"
    },
    is_processed: true
}

# Triggers:
workflow: "Form Follow-up"
    trigger_type: "form_submitted"
    conditions: {form_id: "form-456"}
    actions: [
        "Send confirmation email",
        "Create task for sales team",
        "Add tag: 'Lead - Website'"
    ]
```

### Page Builder Data Model

```
page {
    id: "page-123",
    funnel_id: "funnel-456",
    name: "Homepage",
    slug: "/"

    # Option 1: Raw HTML/CSS/JS
    html_content: "<div>...</div>",
    css_content: ".hero {...}",
    js_content: "console.log('...')",

    # Option 2: Builder JSON (drag-and-drop)
    builder_json: {
        "version": "1.0",
        "blocks": [
            {
                "type": "hero",
                "props": {
                    "title": "Welcome",
                    "image": "/hero.jpg"
                }
            },
            {
                "type": "form",
                "props": {
                    "form_id": "form-456"
                }
            }
        ]
    }
}

# Rendering:
# Builder JSON → React Components → HTML
```

---

## AI Relationships

### AI Agent Structure

```
sub_accounts (1)
    │
    ├──< (∞) ai_agents
    │       │
    │       ├──< (∞) knowledge_bases
    │       │       │
    │       │       └──< (∞) training_data (with vector embeddings)
    │       │
    │       └──< (∞) ai_conversation_logs
    │
    └──< (∞) conversations
            │
            └──< (1) conversation_ai_configs
                    │
                    └──> ai_agents
```

### AI Agent Configuration

```
ai_agent {
    id: "agent-123",
    sub_account_id: "sub-456",
    name: "Customer Support Bot",

    # LLM Config
    model: "gpt-4-turbo",
    temperature: 0.7,
    max_tokens: 2000,

    # Personality
    system_prompt: "You are a helpful customer support agent...",
    personality: {
        tone: "friendly",
        style: "concise",
        emoji_usage: "minimal"
    },

    # Capabilities
    capabilities: [
        "answer_faq",
        "book_appointments",
        "qualify_leads",
        "escalate_to_human"
    ],

    # Channels
    enabled_channels: ["sms", "webchat", "whatsapp"]
}
```

### Knowledge Base & RAG

```
knowledge_base {
    id: "kb-123",
    ai_agent_id: "agent-456",
    name: "Product Documentation",
    source_type: "manual"
}

training_data: [
    {
        knowledge_base_id: "kb-123",
        question: "How do I reset my password?",
        answer: "Click 'Forgot Password' on the login page...",
        category: "Account Management",
        tags: ["password", "login", "security"],

        # Vector embedding for semantic search
        embedding: [0.023, -0.891, 0.234, ...] # 1536 dimensions
    },
    {
        knowledge_base_id: "kb-123",
        content: "Our pricing starts at $29/month...",
        category: "Pricing",
        embedding: [0.145, -0.423, 0.789, ...]
    }
]

# RAG Flow:
1. User asks: "What's the cost?"
2. Embed question → [0.134, -0.445, 0.791, ...]
3. Vector similarity search in training_data
4. Find top 5 most similar content
5. Construct prompt: system_prompt + context + question
6. LLM generates answer
7. Log in ai_conversation_logs
```

### AI Conversation Flow

```
1. Message arrives in conversation
   ├── Check if AI is enabled (conversation_ai_configs)
   ├── AI agent processes message
   └── Generate response

conversation_ai_configs {
    conversation_id: "conv-123",
    ai_agent_id: "agent-456",
    is_active: true,
    messages_handled: 14,
    satisfaction_score: 4.5 # User feedback
}

2. AI processes
   ├── Fetch conversation history
   ├── Retrieve relevant knowledge (RAG)
   ├── Call LLM API
   └── Post response

ai_conversation_logs {
    ai_agent_id: "agent-456",
    conversation_id: "conv-123",
    message_id: "msg-789",

    user_input: "How do I reset password?",
    ai_response: "Click 'Forgot Password'...",

    context: {
        conversation_history: [...],
        retrieved_docs: [...]
    },

    confidence_score: 0.92,
    was_helpful: true, # User feedback

    # Token tracking
    prompt_tokens: 234,
    completion_tokens: 67,
    total_tokens: 301
}

3. Handoff to human (if needed)
   IF confidence_score < 0.5 OR user requests human:
       ├── handoff_to_human: true
       ├── handoff_reason: "Low confidence"
       ├── Assign to available user
       └── is_active: false
```

### AI Training Loop

```
1. Collect conversation logs
   ├── Filter: was_helpful = true
   └── confidence_score > 0.8

2. Extract patterns
   ├── Common questions
   ├── Successful responses
   └── User satisfaction

3. Update training_data
   ├── Add new Q&A pairs
   ├── Re-generate embeddings
   └── Fine-tune prompts

4. Monitor performance
   ├── satisfaction_score trend
   ├── handoff_rate
   └── Token usage cost
```

---

## Cross-Cutting Relationships

### Activity Logging

```
ALL entities → activity_logs

activity_logs {
    agency_id: "agency-123",
    sub_account_id: "sub-456",
    user_id: "user-789",

    entity_type: "contacts",
    entity_id: "contact-abc",
    action: "updated",

    changes: {
        lifecycle_stage: {
            old: "lead",
            new: "customer"
        },
        lead_score: {
            old: 65,
            new: 85
        }
    },

    ip_address: "192.168.1.1",
    user_agent: "Mozilla/5.0..."
}

# Use cases:
- Audit trail for compliance
- "Who changed what when"
- Rollback/recovery
- User activity analytics
```

### Webhooks & Integrations

```
sub_accounts (1)
    │
    ├──< (∞) integrations (Stripe, Zapier, etc.)
    │
    └──< (∞) webhooks
            │
            └──< (∞) webhook_logs

# Event flow:
1. Entity changes (e.g., contact created)
2. Find matching webhooks
3. POST to webhook.url
4. Log in webhook_logs

webhook {
    sub_account_id: "sub-123",
    url: "https://zapier.com/hooks/...",
    events: ["contact.created", "opportunity.won"],
    secret: "whsec_...",
    is_active: true
}

webhook_logs {
    webhook_id: "hook-456",
    event_type: "contact.created",
    payload: {
        event: "contact.created",
        data: {...contact object...}
    },
    response_status: 200,
    response_time_ms: 234,
    status: "success"
}
```

### Analytics Events

```
ALL user actions → analytics_events

analytics_events {
    sub_account_id: "sub-123",
    contact_id: "contact-456",

    event_name: "page_viewed",
    event_category: "engagement",

    properties: {
        page_url: "/pricing",
        referrer: "/homepage",
        duration_seconds: 45
    },

    source: "web",
    session_id: "sess-abc123"
}

# Analytics queries:
-- Conversion funnel
SELECT event_name, COUNT(DISTINCT contact_id)
FROM analytics_events
WHERE session_id IN (...)
GROUP BY event_name
ORDER BY created_at;

-- Contact journey
SELECT event_name, created_at
FROM analytics_events
WHERE contact_id = 'contact-456'
ORDER BY created_at;
```

---

## Summary: Key Design Patterns

1. **Multi-Tenancy**: `sub_account_id` on all tenant-scoped tables
2. **Soft Deletes**: `deleted_at` on recoverable entities
3. **Audit Trail**: `created_at`, `updated_at`, `activity_logs`
4. **Flexibility**: JSONB for `custom_fields`, `settings`, `metadata`
5. **Many-to-Many**: Junction tables (e.g., `contact_tags`)
6. **Polymorphism**: `sender_type` + `sender_id` for flexible associations
7. **Tree Structures**: `parent_action_id` for hierarchical data
8. **State Tracking**: Status enums + timestamps for lifecycle
9. **External Sync**: `stripe_*_id`, `external_calendar_id` fields
10. **Performance**: Comprehensive indexing + materialized views

This relational model supports a fully-featured GoHighLevel clone with:
- Multi-tenant isolation
- Flexible data models
- Complex workflows
- Unified communications
- AI capabilities
- E-commerce features
- Marketing automation
- Advanced analytics
