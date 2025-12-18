# GoHighLevel Clone - Database Architecture

## Overview

This document describes the comprehensive PostgreSQL database schema for a multi-tenant CRM, marketing automation, and AI-powered platform similar to GoHighLevel.

## Architecture Decisions

### 1. Multi-Tenancy Strategy

**Decision**: Two-level tenant hierarchy with row-level isolation

**Rationale**:
- **Agencies** as top-level tenants enable white-label SaaS model
- **Sub-accounts** provide location/client isolation under agencies
- Row-level filtering via `sub_account_id` ensures data isolation
- Simpler than schema-per-tenant while maintaining security

**Trade-offs**:
- Pros: Easier maintenance, simpler backups, better resource utilization
- Cons: Requires careful query filtering, potential security risk if queries miss filters
- Mitigation: Use Row-Level Security (RLS) policies, application-level guards

### 2. Primary Key Strategy

**Decision**: UUID v4 for all primary keys

**Rationale**:
- Globally unique identifiers prevent ID collisions across tenants
- Safe for distributed systems and replication
- No information leakage (vs. sequential integers)
- Better for public-facing URLs

**Trade-offs**:
- Pros: Security, scalability, merge-friendly
- Cons: 16 bytes vs. 4-8 bytes for integers, slightly slower joins
- Mitigation: Proper indexing, consider `uuid_generate_v7()` for time-ordered UUIDs in future

### 3. Soft Deletes

**Decision**: `deleted_at` timestamp column for recoverable entities

**Rationale**:
- Data recovery capability
- Audit trail preservation
- Compliance requirements (GDPR, CCPA)

**Trade-offs**:
- Pros: Safety net, compliance-friendly
- Cons: Queries must filter `deleted_at IS NULL`, index bloat
- Mitigation: Partial indexes `WHERE deleted_at IS NULL`, periodic archival

### 4. JSONB for Flexible Fields

**Decision**: JSONB columns for custom fields, settings, and configuration

**Rationale**:
- Schema flexibility without migrations
- Binary JSON format is performable (vs. TEXT)
- GIN indexing enables efficient querying
- Perfect for user-defined custom fields

**Trade-offs**:
- Pros: Flexibility, no schema changes needed
- Cons: Weaker type safety, complex queries
- Mitigation: Application-level validation, JSON Schema validation

### 5. Timestamp Management

**Decision**: `created_at` and `updated_at` on all tables with automatic triggers

**Rationale**:
- Audit trail for all entities
- Debugging and troubleshooting
- Analytics and reporting

**Implementation**: PostgreSQL trigger function `update_updated_at_column()`

### 6. Indexing Strategy

**Decision**: Comprehensive indexing on foreign keys, frequently queried columns, and JSONB

**Rationale**:
- Foreign keys for join performance
- Status/type columns for filtering
- Partial indexes for conditional queries
- GIN indexes for JSONB and full-text search
- Composite indexes for multi-column queries

**Trade-offs**:
- Pros: Query performance, JOIN optimization
- Cons: Write performance impact, storage overhead
- Mitigation: Monitor index usage, drop unused indexes

## Schema Sections

### 1. Multi-Tenancy & User Management (7 tables)

**Core Tables**:
- `agencies` - Top-level tenants
- `sub_accounts` - Locations/clients under agencies
- `users` - User accounts
- `roles` - RBAC roles
- `permissions` - Granular permissions
- `role_permissions` - Role-permission mapping
- `user_agency_memberships` - User access to agencies
- `user_sub_account_memberships` - User access to sub-accounts

**Key Features**:
- Two-level tenant hierarchy
- RBAC with custom roles per tenant
- Support for both agency-level and sub-account-level roles
- User can belong to multiple agencies/sub-accounts

### 2. CRM - Contacts & Relationships (5 tables)

**Core Tables**:
- `contacts` - Customer/lead records
- `contact_custom_fields` - Custom field definitions
- `tags` - Classification tags
- `contact_tags` - Many-to-many contact-tag relationship
- `notes` - Contact notes with attachments
- `tasks` - To-do items linked to contacts

**Key Features**:
- Flexible custom fields via JSONB
- Full-text search on names (GIN indexes)
- Lead scoring and lifecycle stages
- Communication preferences (opt-in/out)

### 3. Conversations & Messaging (4 tables)

**Core Tables**:
- `channels` - Communication channel configurations
- `conversations` - Unified inbox conversations
- `messages` - Individual messages

**Key Features**:
- Multi-channel support (SMS, email, WhatsApp, FB, IG, webchat)
- Unified inbox across all channels
- Message status tracking (delivered, read, failed)
- Conversation assignment and routing

### 4. Opportunities & Pipelines (5 tables)

**Core Tables**:
- `pipelines` - Sales pipelines
- `pipeline_stages` - Stages within pipelines
- `opportunities` - Sales opportunities
- `opportunity_custom_fields` - Custom field definitions
- `opportunity_stage_history` - Audit trail for stage movements

**Key Features**:
- Multiple pipelines per sub-account
- Win probability per stage
- Stage movement history for analytics
- Custom fields for opportunity data

### 5. Calendar & Appointments (6 tables)

**Core Tables**:
- `calendars` - User calendars
- `calendar_types` - Service types for booking
- `availability` - User availability rules
- `services` - Bookable services with pricing
- `appointments` - Scheduled appointments

**Key Features**:
- External calendar sync (Google, Outlook)
- Flexible availability rules
- Service-based booking
- Multiple meeting types (in-person, phone, video)
- Custom booking questions

### 6. Workflows & Automation (6 tables)

**Core Tables**:
- `workflows` - Automation workflows
- `workflow_triggers` - Workflow trigger definitions
- `workflow_actions` - Workflow steps
- `workflow_executions` - Workflow instances
- `workflow_action_executions` - Individual action runs

**Key Features**:
- Event-driven triggers (contact created, tag added, etc.)
- Visual workflow builder support (via JSONB)
- Conditional branching (if/else)
- Wait/delay actions
- Execution tracking and error handling

### 7. Marketing - Campaigns & Templates (7 tables)

**Core Tables**:
- `campaigns` - Email/SMS campaigns
- `email_templates` - Reusable email templates
- `sms_templates` - Reusable SMS templates
- `campaign_recipients` - Individual send tracking
- `email_clicks` - Click tracking

**Key Features**:
- Drag-and-drop template builder (design_json)
- Template variables
- Campaign scheduling (immediate, scheduled, recurring)
- Comprehensive engagement tracking (opens, clicks, bounces)
- Unsubscribe management

### 8. Payments & Billing (8 tables)

**Core Tables**:
- `products` - Products/services for sale
- `prices` - Pricing plans (one-time, recurring)
- `payment_methods` - Stored payment methods
- `invoices` - Invoice management
- `invoice_line_items` - Invoice line items
- `subscriptions` - Recurring subscriptions
- `transactions` - Payment transactions

**Key Features**:
- Stripe integration ready
- One-time and recurring pricing
- Subscription management
- Invoice generation
- Transaction tracking

### 9. Sites - Funnels, Pages & Forms (6 tables)

**Core Tables**:
- `funnels` - Marketing funnels
- `pages` - Landing pages
- `forms` - Data capture forms
- `form_submissions` - Form submission data
- `surveys` - Survey builder
- `survey_responses` - Survey responses

**Key Features**:
- Drag-and-drop page builder (builder_json)
- Custom domain support
- Form builder with validation
- Survey creation
- SEO optimization fields

### 10. AI - Agents & Knowledge Base (5 tables)

**Core Tables**:
- `ai_agents` - AI chatbot configurations
- `knowledge_bases` - Knowledge base containers
- `training_data` - KB articles/Q&A pairs
- `conversation_ai_configs` - AI conversation settings
- `ai_conversation_logs` - AI interaction logs

**Key Features**:
- Multiple AI models support (GPT-4, Claude, etc.)
- Knowledge base with vector embeddings
- AI-to-human handoff
- Conversation tracking
- Token usage monitoring

### 11. Additional Tables

**Supporting Infrastructure**:
- `activity_logs` - Audit trail
- `integrations` - Third-party integrations
- `webhooks` - Webhook management
- `webhook_logs` - Webhook delivery logs
- `analytics_events` - Custom event tracking

## Performance Optimizations

### Indexing Strategy

1. **Foreign Keys**: All foreign keys indexed
2. **Lookup Fields**: Email, phone, slug, status columns
3. **Date Ranges**: Created_at, due_date, scheduled_at
4. **JSONB**: GIN indexes on custom_fields, settings
5. **Full-Text**: GIN indexes with pg_trgm for name search
6. **Partial Indexes**: Filtered indexes for active/non-deleted records

### Query Optimization

1. **Views**: Pre-computed views for common queries
   - `v_active_contacts` - Contacts with counts
   - `v_pipeline_metrics` - Pipeline analytics

2. **Generated Columns**: `full_name` computed from first/last name

3. **Check Constraints**: Validate data integrity at DB level

## Scalability Considerations

### Horizontal Scaling

1. **Partitioning** (Future):
   - Partition large tables by `created_at` (time-series data)
   - Partition by `sub_account_id` for tenant isolation

2. **Read Replicas**:
   - Route read queries to replicas
   - Primary handles writes only

### Vertical Scaling

1. **Connection Pooling**: Use PgBouncer
2. **Query Optimization**: Regular EXPLAIN ANALYZE
3. **Index Maintenance**: VACUUM, REINDEX schedules

## Security Measures

### Row-Level Security (RLS)

Implement RLS policies for tenant isolation:

```sql
-- Example RLS policy
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON contacts
    USING (sub_account_id = current_setting('app.current_sub_account_id')::uuid);
```

### Encryption

1. **At Rest**: PostgreSQL encryption
2. **In Transit**: SSL/TLS connections
3. **Sensitive Fields**: Encrypted credentials (application-level)

### Access Control

1. **Principle of Least Privilege**: Role-based DB users
2. **Application User**: Read/write access only
3. **Admin User**: DDL operations
4. **Read-Only User**: Reporting/analytics

## Monitoring & Maintenance

### Performance Monitoring

1. **pg_stat_statements**: Query performance tracking
2. **pg_stat_user_tables**: Table usage statistics
3. **Index Usage**: Monitor unused indexes

### Regular Maintenance

1. **VACUUM ANALYZE**: Weekly
2. **REINDEX**: Monthly for high-churn tables
3. **Backup**: Daily full + continuous WAL archiving
4. **Archive Old Data**: Quarterly for deleted records

## Migration Strategy

### Schema Versioning

Use migration tool (e.g., Flyway, Liquibase, or custom):

```sql
CREATE TABLE schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Deployment Process

1. **Backup**: Full database backup before migration
2. **Dry Run**: Test on staging environment
3. **Apply**: Run migrations with rollback plan
4. **Verify**: Check data integrity
5. **Monitor**: Watch for performance issues

## Data Retention Policy

### Retention Periods

- **Contacts**: Indefinite (with soft delete)
- **Messages**: 2 years
- **Logs**: 90 days
- **Webhook Logs**: 30 days
- **Analytics Events**: 1 year

### Archival Strategy

```sql
-- Archive to cold storage table
CREATE TABLE archived_messages (LIKE messages);

-- Move old records
INSERT INTO archived_messages
SELECT * FROM messages
WHERE created_at < NOW() - INTERVAL '2 years';
```

## Integration Points

### External Systems

1. **Stripe**: Payment processing
   - Store `stripe_customer_id`, `stripe_subscription_id`
   - Webhook handling for payment events

2. **Twilio**: SMS/Voice
   - Channel configuration in `channels` table
   - Message delivery tracking

3. **SendGrid**: Email delivery
   - Template sync
   - Bounce/spam tracking

4. **Calendar Sync**: Google/Outlook
   - OAuth tokens in `calendars`
   - Two-way sync for appointments

## Future Enhancements

### Planned Features

1. **Time-Series Tables**: For analytics_events using TimescaleDB
2. **Full-Text Search**: PostgreSQL FTS or Elasticsearch integration
3. **Graph Relationships**: Add PostGIS for location-based features
4. **CDC**: Change Data Capture for real-time syncing
5. **Multi-Region**: Geographic data distribution

### Schema Evolution

1. **Custom Fields v2**: Dedicated table per custom field type
2. **Advanced AI**: Conversation sentiment analysis
3. **Social Listening**: Social media integration tables
4. **Affiliate Management**: Referral and commission tracking

---

## Quick Start

### 1. Create Database

```sql
CREATE DATABASE gohighlevel_clone;
\c gohighlevel_clone
```

### 2. Run Schema

```bash
psql -U postgres -d gohighlevel_clone -f schema.sql
```

### 3. Create Seed Data

```bash
psql -U postgres -d gohighlevel_clone -f seeds.sql
```

### 4. Verify Installation

```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Should return ~70+ tables
```

## Support

For questions or issues with the database schema:
- Review this documentation
- Check the inline SQL comments
- Review the entity relationship diagrams
- Consult the architecture decision records
