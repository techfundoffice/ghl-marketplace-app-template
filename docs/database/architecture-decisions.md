# Architecture Decision Records (ADR)

## ADR-001: Multi-Tenancy Model

**Status**: Accepted

**Context**:
We need to support white-label agencies that serve multiple clients (locations/sub-accounts). Each agency needs complete data isolation from other agencies, while maintaining efficient resource usage.

**Decision**:
Implement a two-level hierarchical multi-tenancy model:
- **Level 1**: Agencies (white-label tenants)
- **Level 2**: Sub-accounts (locations/clients under agencies)

Use row-level filtering with `sub_account_id` foreign keys on all tenant-scoped tables.

**Alternatives Considered**:

1. **Schema-per-tenant**:
   - Pros: Complete isolation, easier per-tenant backups
   - Cons: Complex migrations, resource overhead, connection pool management
   - Rejected: Doesn't scale to thousands of tenants

2. **Database-per-tenant**:
   - Pros: Maximum isolation, independent scaling
   - Cons: Extremely complex management, expensive
   - Rejected: Over-engineered for requirements

3. **Single-level tenancy** (sub-accounts only):
   - Pros: Simpler model
   - Cons: No agency-level features, can't support white-label
   - Rejected: Doesn't meet business requirements

**Consequences**:

Positive:
- Efficient resource utilization
- Simple schema management
- Easy cross-tenant reporting for platform analytics
- Cost-effective at scale

Negative:
- Must implement Row-Level Security (RLS) policies
- Risk of data leakage if queries don't filter properly
- More complex application-level logic

**Mitigation**:
- Implement PostgreSQL RLS policies
- Use database middleware that auto-injects tenant filters
- Regular security audits
- Comprehensive test coverage for tenant isolation

---

## ADR-002: UUID Primary Keys

**Status**: Accepted

**Context**:
Need to choose primary key strategy for all tables in a multi-tenant, distributed system.

**Decision**:
Use UUID v4 (`uuid_generate_v4()`) for all primary keys.

**Alternatives Considered**:

1. **Auto-incrementing integers**:
   - Pros: Smaller (4-8 bytes), faster joins, human-readable
   - Cons: Exposes record counts, sequential IDs leak info, merge conflicts
   - Rejected: Security and distribution concerns

2. **Composite keys** (tenant_id + sequence):
   - Pros: Ensures uniqueness per tenant
   - Cons: Complex joins, larger indexes
   - Rejected: Too complex for minimal benefit

3. **UUID v7** (time-ordered):
   - Pros: Better index locality, sequential insertion
   - Cons: Not widely supported yet (pg 13+)
   - Deferred: Consider for future migration

**Consequences**:

Positive:
- Globally unique identifiers
- Safe for distributed systems and replication
- No ID enumeration attacks
- Merge-friendly for multi-region setups
- Can generate in application layer

Negative:
- 16 bytes vs 4-8 bytes (2-4x storage)
- Random insertion hurts index locality
- Slightly slower joins
- Not human-readable

**Performance Impact**:
- ~10-15% slower for index lookups (acceptable trade-off)
- Mitigated by proper indexing and SSD storage

---

## ADR-003: Soft Delete Pattern

**Status**: Accepted

**Context**:
Users accidentally delete important data. Need recovery mechanism while supporting compliance requirements (GDPR, CCPA).

**Decision**:
Implement soft deletes using `deleted_at TIMESTAMP` column on recoverable entities.

**Scope**:
- Contacts
- Opportunities
- Campaigns
- Workflows
- Templates
- Pages/Funnels
- Products

**Alternatives Considered**:

1. **Hard deletes only**:
   - Pros: Clean data, no query overhead
   - Cons: Data loss, no audit trail
   - Rejected: Too risky

2. **Archive tables**:
   - Pros: Clean active tables
   - Cons: Complex restore process, split queries
   - Rejected: Over-engineered

3. **Audit log only**:
   - Pros: Small overhead
   - Cons: Difficult to restore relationships
   - Rejected: Insufficient for recovery

**Consequences**:

Positive:
- Data recovery capability
- Audit trail for compliance
- Gradual deletion (soft delete → hard delete after 90 days)
- Supports "undo" functionality

Negative:
- All queries must filter `WHERE deleted_at IS NULL`
- Index bloat over time
- Storage overhead

**Implementation Details**:

```sql
-- Partial index for active records
CREATE INDEX idx_contacts_active ON contacts(id) WHERE deleted_at IS NULL;

-- View for active records
CREATE VIEW v_contacts AS
SELECT * FROM contacts WHERE deleted_at IS NULL;
```

**Archival Process**:
- Soft delete: `UPDATE SET deleted_at = NOW()`
- Hard delete after 90 days: `DELETE FROM WHERE deleted_at < NOW() - INTERVAL '90 days'`

---

## ADR-004: JSONB for Custom Fields

**Status**: Accepted

**Context**:
Users need to define custom fields on contacts and opportunities without schema changes. Must support various field types (text, number, date, select, etc.).

**Decision**:
Use JSONB columns (`custom_fields`) with separate definition tables (`contact_custom_fields`, `opportunity_custom_fields`).

**Alternatives Considered**:

1. **EAV (Entity-Attribute-Value)**:
   - Pros: Normalized, strongly typed
   - Cons: Complex queries, poor performance, many joins
   - Rejected: Query complexity

2. **Separate table per field**:
   - Pros: Typed columns
   - Cons: Schema migrations required, table explosion
   - Rejected: Not scalable

3. **XML fields**:
   - Pros: Structured
   - Cons: Verbose, poor performance vs JSONB
   - Rejected: JSONB is superior in PostgreSQL

**Consequences**:

Positive:
- No schema changes needed for custom fields
- Fast read performance with GIN indexes
- Flexible field types
- Easy to serialize to application layer

Negative:
- Weaker type safety (validation in application)
- Complex aggregations
- Can't enforce DB constraints on nested values

**Implementation**:

```sql
-- Custom field definition
INSERT INTO contact_custom_fields (sub_account_id, key, name, field_type, is_required)
VALUES ('...', 'company_size', 'Company Size', 'select', false);

-- Store value
UPDATE contacts SET custom_fields = jsonb_set(
    custom_fields,
    '{company_size}',
    '"1-10 employees"'
) WHERE id = '...';

-- Query with GIN index
SELECT * FROM contacts
WHERE custom_fields @> '{"company_size": "1-10 employees"}';
```

**Validation Strategy**:
- Store JSON Schema in `validation_rules` column
- Validate in application before save
- Optional: PostgreSQL CHECK constraints with JSON Schema extension

---

## ADR-005: Unified Inbox (Conversations Table)

**Status**: Accepted

**Context**:
Platform supports multiple communication channels (SMS, email, WhatsApp, Facebook, Instagram, webchat). Need unified inbox for agents.

**Decision**:
Create `conversations` table that normalizes all channels with `messages` table for channel-agnostic storage.

**Alternatives Considered**:

1. **Separate table per channel**:
   - Tables: `sms_messages`, `emails`, `whatsapp_messages`
   - Pros: Channel-specific fields
   - Cons: Complex unified inbox queries, code duplication
   - Rejected: Poor UX for unified inbox

2. **Single messages table without conversations**:
   - Pros: Simple
   - Cons: Hard to group by conversation, no assignment
   - Rejected: Doesn't support inbox workflows

3. **Polymorphic associations**:
   - Pros: Flexible
   - Cons: No foreign key constraints, complex joins
   - Rejected: Too error-prone

**Consequences**:

Positive:
- Single query for unified inbox
- Channel-agnostic assignment and routing
- Consistent conversation state (open/closed)
- Easy to add new channels

Negative:
- JSONB for channel-specific metadata
- Generic schema may not fit all future channels

**Schema Design**:

```sql
-- conversations: Conversation thread
-- messages: Individual messages within conversation
-- channels: Channel configuration (credentials, settings)

-- Example: Fetch all open conversations across channels
SELECT c.*, COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.status = 'open' AND c.assigned_user_id = ?
GROUP BY c.id;
```

---

## ADR-006: Workflow Execution Model

**Status**: Accepted

**Context**:
Need to support complex marketing automation workflows with branching, delays, and error handling.

**Decision**:
Use parent-child action model with execution tracking:
- `workflows`: Workflow definitions
- `workflow_actions`: Steps in workflow (tree structure via `parent_action_id`)
- `workflow_executions`: Instances of workflows running for contacts
- `workflow_action_executions`: Individual step executions

**Alternatives Considered**:

1. **Flat action list**:
   - Pros: Simple
   - Cons: No branching support
   - Rejected: Insufficient for if/else logic

2. **DAG (Directed Acyclic Graph)**:
   - Pros: Formal graph model
   - Cons: Over-complex for requirements
   - Rejected: Too complex to build UI for

3. **External workflow engine** (Temporal, Airflow):
   - Pros: Battle-tested
   - Cons: Additional infrastructure, vendor lock-in
   - Deferred: Consider for future scale

**Consequences**:

Positive:
- Supports conditional branching (if/else)
- Wait/delay actions via `scheduled_for`
- Error tracking per action
- Pause/resume capability
- Audit trail of all executions

Negative:
- Recursive queries needed for tree traversal
- Complex state management
- Need background job processor

**Execution Flow**:

```sql
-- 1. Workflow triggered
INSERT INTO workflow_executions (workflow_id, contact_id, status)
VALUES (?, ?, 'running');

-- 2. Queue first action
INSERT INTO workflow_action_executions (
    workflow_execution_id,
    workflow_action_id,
    status
) VALUES (?, ?, 'pending');

-- 3. Process actions sequentially
-- 4. Check conditions for branches
-- 5. Queue child actions based on condition results
```

**Background Processor**:
- Poll `workflow_action_executions WHERE status = 'pending' AND scheduled_for <= NOW()`
- Execute action
- Update status
- Queue next actions

---

## ADR-007: Calendar & Appointments Design

**Status**: Accepted

**Context**:
Support appointment scheduling with external calendar sync (Google Calendar, Outlook), availability rules, and multiple service types.

**Decision**:
Separate calendars (user calendars with external sync) from appointments (bookings):
- `calendars`: User calendars (can sync with external)
- `availability`: Availability rules per calendar
- `calendar_types`: Service categories
- `services`: Bookable services with pricing
- `appointments`: Scheduled appointments

**Alternatives Considered**:

1. **Monolithic appointments table**:
   - Pros: Simple
   - Cons: Hard to manage availability rules
   - Rejected: Doesn't support complex scheduling

2. **External scheduling service** (Calendly API):
   - Pros: No need to build
   - Cons: Vendor lock-in, less control
   - Rejected: Core feature must be in-house

**Consequences**:

Positive:
- Flexible availability rules (day/time/date range)
- External calendar sync
- Multiple service types per user
- Double-booking prevention
- Custom booking questions per service

Negative:
- Complex availability calculation
- Need background sync job for external calendars

**Availability Calculation**:

```sql
-- Find available time slots
WITH user_availability AS (
    SELECT day_of_week, start_time, end_time
    FROM availability
    WHERE calendar_id = ?
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= ?)
    AND (valid_to IS NULL OR valid_to >= ?)
),
existing_appointments AS (
    SELECT start_time, end_time
    FROM appointments
    WHERE calendar_id = ?
    AND status NOT IN ('cancelled', 'no_show')
    AND start_time::date = ?
)
SELECT generate_available_slots(...);
```

---

## ADR-008: Payment & Subscription Management

**Status**: Accepted

**Context**:
Support both one-time payments and recurring subscriptions with Stripe integration.

**Decision**:
Separate products from pricing, track subscriptions and transactions independently:
- `products`: Products/services
- `prices`: Pricing plans (one-time or recurring)
- `subscriptions`: Active subscriptions
- `invoices`: Invoice management
- `transactions`: Payment records

**Alternatives Considered**:

1. **Stripe as source of truth**:
   - Pros: Less to build
   - Cons: API latency, offline queries impossible
   - Rejected: Need local caching for performance

2. **Monolithic payments table**:
   - Pros: Simple
   - Cons: Hard to model subscriptions
   - Rejected: Insufficient for subscription logic

**Consequences**:

Positive:
- Local cache of Stripe data for fast queries
- Support multiple payment gateways (Stripe, PayPal, Square)
- Complex reporting without API calls
- Subscription lifecycle management

Negative:
- Need to sync with Stripe via webhooks
- Data consistency challenges
- Eventual consistency model

**Sync Strategy**:

```sql
-- Stripe webhook handlers
-- payment_intent.succeeded → Insert transaction
-- customer.subscription.updated → Update subscription
-- invoice.payment_succeeded → Update invoice

-- Store Stripe IDs for reconciliation
stripe_customer_id
stripe_subscription_id
stripe_invoice_id
stripe_payment_method_id
```

---

## ADR-009: AI Agent Architecture

**Status**: Accepted

**Context**:
Support AI-powered chatbots with knowledge bases, multiple LLM providers, and conversation handoff to humans.

**Decision**:
Separate AI agent configuration from knowledge bases and conversation logs:
- `ai_agents`: AI configuration (model, temperature, prompt)
- `knowledge_bases`: Knowledge base containers
- `training_data`: Q&A pairs and documents
- `conversation_ai_configs`: Per-conversation AI settings
- `ai_conversation_logs`: Interaction logs for training

**Alternatives Considered**:

1. **External AI platform** (Voiceflow, Landbot):
   - Pros: Pre-built UI
   - Cons: Vendor lock-in, limited customization
   - Rejected: Core feature

2. **Monolithic AI table**:
   - Pros: Simple
   - Cons: Can't separate agent config from knowledge
   - Rejected: Not flexible enough

**Consequences**:

Positive:
- Support multiple LLM providers (OpenAI, Anthropic, etc.)
- Knowledge base versioning
- Conversation logs for fine-tuning
- Human handoff capability
- Token usage tracking

Negative:
- Complex vector search (need pgvector extension)
- Cost tracking per conversation
- Need to implement RAG (Retrieval-Augmented Generation)

**Vector Search Implementation**:

```sql
-- Enable pgvector extension
CREATE EXTENSION vector;

-- Add embedding column
ALTER TABLE training_data ADD COLUMN embedding vector(1536);

-- Find similar content
SELECT content, answer, (embedding <=> ?) as distance
FROM training_data
WHERE knowledge_base_id = ?
ORDER BY distance
LIMIT 5;
```

---

## ADR-010: Indexing Strategy

**Status**: Accepted

**Context**:
Need to optimize query performance for multi-tenant SaaS with millions of records.

**Decision**:
Comprehensive indexing strategy with partial, composite, and GIN indexes.

**Index Types**:

1. **B-tree** (default): Foreign keys, lookup columns
2. **GIN**: JSONB, arrays, full-text search
3. **Partial**: Filtered indexes for common queries
4. **Composite**: Multi-column queries

**Guidelines**:

```sql
-- Foreign keys: ALWAYS index
CREATE INDEX idx_contacts_sub_account ON contacts(sub_account_id);

-- Lookup columns: Email, phone, slug
CREATE INDEX idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;

-- Partial indexes: Active records
CREATE INDEX idx_contacts_active ON contacts(is_active) WHERE deleted_at IS NULL;

-- JSONB: GIN index for containment queries
CREATE INDEX idx_contacts_custom_fields ON contacts USING gin(custom_fields);

-- Full-text: GIN with pg_trgm
CREATE INDEX idx_contacts_full_name ON contacts USING gin(full_name gin_trgm_ops);

-- Composite: Multi-column WHERE clauses
CREATE INDEX idx_tasks_user_status ON tasks(assigned_to_user_id, status);
```

**Monitoring**:

```sql
-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexname NOT LIKE '%pkey%';

-- Index size
SELECT pg_size_pretty(pg_relation_size('idx_contacts_email'));
```

**Trade-offs**:
- Write performance: ~5-10% slower
- Storage: ~20-30% overhead
- Query performance: 10-100x faster

---

## Summary

These architectural decisions prioritize:
1. **Scalability**: Multi-tenancy, UUIDs, indexing
2. **Flexibility**: JSONB for custom fields
3. **Data Integrity**: Soft deletes, foreign keys
4. **Performance**: Comprehensive indexing
5. **Compliance**: Audit logs, data retention

Future reviews scheduled:
- Q2 2026: Evaluate UUID v7 migration
- Q3 2026: Consider table partitioning
- Q4 2026: Review AI vector search performance
