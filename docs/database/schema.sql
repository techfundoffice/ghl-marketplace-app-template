-- ============================================================================
-- GoHighLevel Clone - PostgreSQL Database Schema
-- ============================================================================
-- Description: Comprehensive database schema for a multi-tenant CRM, marketing,
--              and automation platform with AI capabilities
-- Version: 1.0.0
-- Created: 2025-12-18
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes

-- ============================================================================
-- SECTION 1: MULTI-TENANCY & USER MANAGEMENT
-- ============================================================================

-- Agencies (top-level tenants)
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255),
    logo_url TEXT,
    timezone VARCHAR(100) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',

    -- Subscription & limits
    plan_type VARCHAR(50) DEFAULT 'starter', -- starter, professional, enterprise
    max_sub_accounts INTEGER DEFAULT 3,
    max_users INTEGER DEFAULT 10,

    -- Settings
    settings JSONB DEFAULT '{}',

    -- Billing
    stripe_customer_id VARCHAR(255),
    billing_email VARCHAR(255),

    -- Status
    is_active BOOLEAN DEFAULT true,
    suspended_at TIMESTAMP,
    trial_ends_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_agencies_slug ON agencies(slug);
CREATE INDEX idx_agencies_active ON agencies(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_agencies_stripe ON agencies(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Sub-accounts (locations/clients under agencies)
CREATE TABLE sub_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    slug VARCHAR(255) NOT NULL,

    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),

    -- Branding
    logo_url TEXT,
    website TEXT,

    -- Configuration
    timezone VARCHAR(100) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    business_hours JSONB, -- {monday: {open: "09:00", close: "17:00"}, ...}

    -- Settings
    settings JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    UNIQUE(agency_id, slug)
);

CREATE INDEX idx_sub_accounts_agency ON sub_accounts(agency_id);
CREATE INDEX idx_sub_accounts_slug ON sub_accounts(agency_id, slug);
CREATE INDEX idx_sub_accounts_active ON sub_accounts(is_active) WHERE deleted_at IS NULL;

-- Roles (RBAC)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Scope: agency, sub_account
    scope VARCHAR(50) NOT NULL DEFAULT 'sub_account',

    -- Built-in roles cannot be deleted
    is_system BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (
        (scope = 'agency' AND agency_id IS NOT NULL AND sub_account_id IS NULL) OR
        (scope = 'sub_account' AND sub_account_id IS NOT NULL)
    )
);

CREATE INDEX idx_roles_agency ON roles(agency_id);
CREATE INDEX idx_roles_sub_account ON roles(sub_account_id);

-- Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL, -- contacts, opportunities, calendars, etc.
    action VARCHAR(50) NOT NULL, -- create, read, update, delete, manage
    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_resource ON permissions(resource);

-- Role Permissions (many-to-many)
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),

    -- Authentication
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,

    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255) GENERATED ALWAYS AS (
        COALESCE(first_name || ' ' || last_name, first_name, last_name, email)
    ) STORED,
    avatar_url TEXT,

    -- Settings
    timezone VARCHAR(100) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    settings JSONB DEFAULT '{}',

    -- Security
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    last_login_at TIMESTAMP,
    last_login_ip INET,

    -- Status
    is_active BOOLEAN DEFAULT true,
    suspended_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_full_name ON users USING gin(full_name gin_trgm_ops);

-- User Agency Memberships (many-to-many with roles)
CREATE TABLE user_agency_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,

    -- Owner, Admin, Member
    membership_type VARCHAR(50) DEFAULT 'member',

    -- Status
    is_active BOOLEAN DEFAULT true,
    invited_at TIMESTAMP,
    joined_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, agency_id)
);

CREATE INDEX idx_user_agency_user ON user_agency_memberships(user_id);
CREATE INDEX idx_user_agency_agency ON user_agency_memberships(agency_id);
CREATE INDEX idx_user_agency_active ON user_agency_memberships(is_active);

-- User Sub-Account Memberships (many-to-many with roles)
CREATE TABLE user_sub_account_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,

    -- Status
    is_active BOOLEAN DEFAULT true,
    invited_at TIMESTAMP,
    joined_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, sub_account_id)
);

CREATE INDEX idx_user_sub_account_user ON user_sub_account_memberships(user_id);
CREATE INDEX idx_user_sub_account_sub_account ON user_sub_account_memberships(sub_account_id);
CREATE INDEX idx_user_sub_account_active ON user_sub_account_memberships(is_active);

-- ============================================================================
-- SECTION 2: CRM - CONTACTS & RELATIONSHIPS
-- ============================================================================

-- Contact Custom Field Definitions
CREATE TABLE contact_custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    key VARCHAR(255) NOT NULL, -- snake_case identifier
    field_type VARCHAR(50) NOT NULL, -- text, number, date, boolean, select, multi_select, url, email, phone

    -- Validation
    is_required BOOLEAN DEFAULT false,
    options JSONB, -- For select/multi_select: ["Option 1", "Option 2"]
    validation_rules JSONB, -- {min: 0, max: 100, pattern: "..."}

    -- Display
    position INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(sub_account_id, key)
);

CREATE INDEX idx_contact_custom_fields_sub_account ON contact_custom_fields(sub_account_id);

-- Contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    -- Basic Info
    email VARCHAR(255),
    phone VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255) GENERATED ALWAYS AS (
        COALESCE(first_name || ' ' || last_name, first_name, last_name, email, phone)
    ) STORED,

    -- Additional Contact Info
    company_name VARCHAR(255),
    website TEXT,

    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),

    -- Social
    linkedin_url TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,

    -- Classification
    contact_type VARCHAR(50) DEFAULT 'lead', -- lead, customer, partner, vendor
    source VARCHAR(100), -- website, referral, facebook, google_ads, etc.

    -- Assignment
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Lifecycle
    lifecycle_stage VARCHAR(50) DEFAULT 'subscriber', -- subscriber, lead, marketing_qualified_lead, sales_qualified_lead, opportunity, customer, evangelist

    -- Scoring
    lead_score INTEGER DEFAULT 0,

    -- Communication preferences
    email_opt_in BOOLEAN DEFAULT true,
    sms_opt_in BOOLEAN DEFAULT true,
    do_not_disturb BOOLEAN DEFAULT false,

    -- Custom fields (JSONB for flexibility)
    custom_fields JSONB DEFAULT '{}',

    -- Metadata
    last_contacted_at TIMESTAMP,
    last_activity_at TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_contacts_sub_account ON contacts(sub_account_id);
CREATE INDEX idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_contacts_phone ON contacts(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_contacts_full_name ON contacts USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_contacts_assigned_user ON contacts(assigned_user_id);
CREATE INDEX idx_contacts_lifecycle ON contacts(lifecycle_stage);
CREATE INDEX idx_contacts_type ON contacts(contact_type);
CREATE INDEX idx_contacts_custom_fields ON contacts USING gin(custom_fields);
CREATE INDEX idx_contacts_active ON contacts(is_active) WHERE deleted_at IS NULL;

-- Tags
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color
    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(sub_account_id, name)
);

CREATE INDEX idx_tags_sub_account ON tags(sub_account_id);

-- Contact Tags (many-to-many)
CREATE TABLE contact_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(contact_id, tag_id)
);

CREATE INDEX idx_contact_tags_contact ON contact_tags(contact_id);
CREATE INDEX idx_contact_tags_tag ON contact_tags(tag_id);

-- Notes
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

    -- Author
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

    -- Content
    title VARCHAR(255),
    content TEXT NOT NULL,

    -- Classification
    note_type VARCHAR(50) DEFAULT 'general', -- general, call, meeting, email

    -- Attachments
    attachments JSONB, -- [{url: "...", name: "...", type: "..."}]

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_contact ON notes(contact_id);
CREATE INDEX idx_notes_sub_account ON notes(sub_account_id);
CREATE INDEX idx_notes_created_by ON notes(created_by_user_id);
CREATE INDEX idx_notes_type ON notes(note_type);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

    -- Assignment
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

    -- Task details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) DEFAULT 'general', -- call, email, meeting, follow_up, general

    -- Priority & Status
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled

    -- Scheduling
    due_date TIMESTAMP,
    reminder_at TIMESTAMP,

    -- Completion
    completed_at TIMESTAMP,
    completed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_contact ON tasks(contact_id);
CREATE INDEX idx_tasks_sub_account ON tasks(sub_account_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to_user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE status != 'completed';

-- ============================================================================
-- SECTION 3: CONVERSATIONS & MESSAGING
-- ============================================================================

-- Channels (communication channels configuration)
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    channel_type VARCHAR(50) NOT NULL, -- sms, email, whatsapp, facebook, instagram, webchat, voice
    name VARCHAR(255) NOT NULL,

    -- Configuration (provider-specific settings)
    provider VARCHAR(100), -- twilio, sendgrid, vonage, meta, etc.
    config JSONB NOT NULL, -- {apiKey: "...", phoneNumber: "...", webhookUrl: "..."}

    -- Credentials
    credentials_encrypted TEXT, -- Encrypted sensitive data

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,

    -- Limits & Usage
    monthly_limit INTEGER,
    current_usage INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(sub_account_id, channel_type, provider)
);

CREATE INDEX idx_channels_sub_account ON channels(sub_account_id);
CREATE INDEX idx_channels_type ON channels(channel_type);
CREATE INDEX idx_channels_active ON channels(is_active);

-- Conversations (unified inbox)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,

    -- Assignment
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Status
    status VARCHAR(50) DEFAULT 'open', -- open, pending, resolved, closed
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high

    -- Classification
    subject VARCHAR(500),
    tags JSONB, -- ["support", "sales"]

    -- Metadata
    last_message_at TIMESTAMP,
    last_message_preview TEXT,
    unread_count INTEGER DEFAULT 0,

    -- Resolution
    resolved_at TIMESTAMP,
    resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_sub_account ON conversations(sub_account_id);
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_channel ON conversations(channel_id);
CREATE INDEX idx_conversations_assigned_user ON conversations(assigned_user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Direction
    direction VARCHAR(20) NOT NULL, -- inbound, outbound

    -- Sender/Recipient
    sender_type VARCHAR(50) NOT NULL, -- contact, user, system, bot
    sender_id UUID, -- Reference to contact or user

    -- Content
    content_type VARCHAR(50) DEFAULT 'text', -- text, image, video, audio, file, template
    body TEXT,

    -- Media/Attachments
    media_url TEXT,
    media_type VARCHAR(100),
    attachments JSONB, -- [{url: "...", type: "...", name: "..."}]

    -- Status (for outbound)
    status VARCHAR(50) DEFAULT 'sent', -- queued, sent, delivered, read, failed

    -- External reference
    external_id VARCHAR(255), -- Provider's message ID

    -- Metadata
    metadata JSONB, -- Provider-specific metadata

    -- Error tracking
    error_code VARCHAR(100),
    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_external_id ON messages(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_messages_status ON messages(status) WHERE direction = 'outbound';

-- ============================================================================
-- SECTION 4: OPPORTUNITIES & PIPELINES
-- ============================================================================

-- Pipelines
CREATE TABLE pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Configuration
    is_default BOOLEAN DEFAULT false,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Display
    position INTEGER DEFAULT 0,
    color VARCHAR(7) DEFAULT '#3B82F6',

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_pipelines_sub_account ON pipelines(sub_account_id);
CREATE INDEX idx_pipelines_active ON pipelines(is_active) WHERE deleted_at IS NULL;

-- Pipeline Stages
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Win probability
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),

    -- Display
    position INTEGER DEFAULT 0,
    color VARCHAR(7) DEFAULT '#3B82F6',

    -- Stage type
    is_won BOOLEAN DEFAULT false,
    is_lost BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX idx_pipeline_stages_position ON pipeline_stages(pipeline_id, position);

-- Opportunity Custom Field Definitions
CREATE TABLE opportunity_custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    key VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL,

    is_required BOOLEAN DEFAULT false,
    options JSONB,
    validation_rules JSONB,

    position INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(sub_account_id, key)
);

CREATE INDEX idx_opportunity_custom_fields_sub_account ON opportunity_custom_fields(sub_account_id);

-- Opportunities
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
    stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

    -- Opportunity details
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Value
    value DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Assignment
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Dates
    expected_close_date DATE,
    closed_at TIMESTAMP,

    -- Status
    status VARCHAR(50) DEFAULT 'open', -- open, won, lost, abandoned

    -- Win/Loss reason
    lost_reason VARCHAR(255),
    lost_reason_description TEXT,

    -- Source
    source VARCHAR(100),

    -- Custom fields
    custom_fields JSONB DEFAULT '{}',

    -- Metadata
    last_activity_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_opportunities_sub_account ON opportunities(sub_account_id);
CREATE INDEX idx_opportunities_pipeline ON opportunities(pipeline_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage_id);
CREATE INDEX idx_opportunities_contact ON opportunities(contact_id);
CREATE INDEX idx_opportunities_assigned_user ON opportunities(assigned_user_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_close_date ON opportunities(expected_close_date) WHERE status = 'open';
CREATE INDEX idx_opportunities_custom_fields ON opportunities USING gin(custom_fields);

-- Opportunity Stage History (audit trail)
CREATE TABLE opportunity_stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,

    from_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    to_stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,

    changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    duration_seconds INTEGER, -- Time spent in previous stage

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_opportunity_stage_history_opportunity ON opportunity_stage_history(opportunity_id);
CREATE INDEX idx_opportunity_stage_history_created_at ON opportunity_stage_history(created_at DESC);

-- ============================================================================
-- SECTION 5: CALENDAR & APPOINTMENTS
-- ============================================================================

-- Calendar Types (service types for booking)
CREATE TABLE calendar_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Duration
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    buffer_before_minutes INTEGER DEFAULT 0,
    buffer_after_minutes INTEGER DEFAULT 0,

    -- Scheduling
    advance_booking_days INTEGER DEFAULT 60,
    minimum_notice_hours INTEGER DEFAULT 24,

    -- Display
    color VARCHAR(7) DEFAULT '#3B82F6',

    -- Form
    custom_questions JSONB, -- [{question: "...", type: "text", required: true}]

    -- Confirmation
    confirmation_message TEXT,
    redirect_url TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendar_types_sub_account ON calendar_types(sub_account_id);
CREATE INDEX idx_calendar_types_active ON calendar_types(is_active);

-- Calendars (user calendars)
CREATE TABLE calendars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- External calendar integration
    external_calendar_provider VARCHAR(50), -- google, outlook, apple
    external_calendar_id VARCHAR(255),
    sync_enabled BOOLEAN DEFAULT false,
    last_synced_at TIMESTAMP,

    -- Display
    color VARCHAR(7) DEFAULT '#3B82F6',

    -- Status
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendars_sub_account ON calendars(sub_account_id);
CREATE INDEX idx_calendars_user ON calendars(user_id);
CREATE INDEX idx_calendars_external ON calendars(external_calendar_id) WHERE external_calendar_id IS NOT NULL;

-- Availability (user availability rules)
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,

    -- Day of week (0 = Sunday, 6 = Saturday)
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),

    -- Time slots
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Timezone
    timezone VARCHAR(100) DEFAULT 'UTC',

    -- Date range (optional - for overrides)
    valid_from DATE,
    valid_to DATE,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (end_time > start_time)
);

CREATE INDEX idx_availability_calendar ON availability(calendar_id);
CREATE INDEX idx_availability_day ON availability(day_of_week);
CREATE INDEX idx_availability_active ON availability(is_active);

-- Services (bookable services/appointment types)
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
    calendar_type_id UUID REFERENCES calendar_types(id) ON DELETE SET NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Duration
    duration_minutes INTEGER NOT NULL DEFAULT 30,

    -- Pricing
    price DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Payment
    requires_payment BOOLEAN DEFAULT false,
    payment_required_percentage INTEGER DEFAULT 100 CHECK (payment_required_percentage >= 0 AND payment_required_percentage <= 100),

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_sub_account ON services(sub_account_id);
CREATE INDEX idx_services_calendar_type ON services(calendar_type_id);
CREATE INDEX idx_services_active ON services(is_active);

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
    calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

    -- Service
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    calendar_type_id UUID REFERENCES calendar_types(id) ON DELETE SET NULL,

    -- Appointment details
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Scheduling
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    timezone VARCHAR(100) DEFAULT 'UTC',

    -- Assignment
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Location
    location_type VARCHAR(50) DEFAULT 'in_person', -- in_person, phone, video, custom
    location TEXT,
    meeting_url TEXT, -- For video calls

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled, no_show

    -- Cancellation
    cancelled_at TIMESTAMP,
    cancelled_by VARCHAR(50), -- contact, user, system
    cancellation_reason TEXT,

    -- Reminders
    reminder_sent_at TIMESTAMP,

    -- Form responses
    custom_responses JSONB, -- Answers to custom questions

    -- Notes
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (end_time > start_time)
);

CREATE INDEX idx_appointments_sub_account ON appointments(sub_account_id);
CREATE INDEX idx_appointments_calendar ON appointments(calendar_id);
CREATE INDEX idx_appointments_contact ON appointments(contact_id);
CREATE INDEX idx_appointments_service ON appointments(service_id);
CREATE INDEX idx_appointments_assigned_user ON appointments(assigned_user_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_upcoming ON appointments(start_time) WHERE status IN ('scheduled', 'confirmed');

-- ============================================================================
-- SECTION 6: WORKFLOWS & AUTOMATION
-- ============================================================================

-- Workflows
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Trigger configuration
    trigger_type VARCHAR(100) NOT NULL, -- contact_created, tag_added, opportunity_stage_changed, form_submitted, etc.
    trigger_config JSONB NOT NULL, -- Trigger-specific configuration

    -- Execution
    is_active BOOLEAN DEFAULT false,

    -- Settings
    allow_multiple_executions BOOLEAN DEFAULT false, -- Can a contact enter multiple times?
    exit_on_goal_completion BOOLEAN DEFAULT false,

    -- Stats
    total_executions INTEGER DEFAULT 0,
    active_executions INTEGER DEFAULT 0,

    -- Version control
    version INTEGER DEFAULT 1,
    published_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_workflows_sub_account ON workflows(sub_account_id);
CREATE INDEX idx_workflows_active ON workflows(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_workflows_trigger_type ON workflows(trigger_type);

-- Workflow Triggers (multiple triggers per workflow)
CREATE TABLE workflow_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,

    trigger_type VARCHAR(100) NOT NULL,

    -- Filter conditions
    conditions JSONB, -- [{field: "tag", operator: "equals", value: "vip"}]

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_triggers_workflow ON workflow_triggers(workflow_id);
CREATE INDEX idx_workflow_triggers_type ON workflow_triggers(trigger_type);

-- Workflow Actions (steps in the workflow)
CREATE TABLE workflow_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,

    -- Parent action (for branching)
    parent_action_id UUID REFERENCES workflow_actions(id) ON DELETE CASCADE,

    -- Action details
    action_type VARCHAR(100) NOT NULL, -- send_email, send_sms, add_tag, wait, if_else, create_task, update_contact, etc.
    action_config JSONB NOT NULL,

    -- Positioning
    position INTEGER DEFAULT 0,

    -- Conditional execution
    conditions JSONB, -- For if/else branches

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_actions_workflow ON workflow_actions(workflow_id);
CREATE INDEX idx_workflow_actions_parent ON workflow_actions(parent_action_id);
CREATE INDEX idx_workflow_actions_position ON workflow_actions(workflow_id, position);

-- Workflow Executions (instances of workflow runs)
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

    -- Execution status
    status VARCHAR(50) DEFAULT 'running', -- running, completed, failed, paused, cancelled

    -- Tracking
    current_action_id UUID REFERENCES workflow_actions(id) ON DELETE SET NULL,

    -- Timing
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    -- Error tracking
    error_message TEXT,
    error_count INTEGER DEFAULT 0,

    -- Context
    context JSONB, -- Variables and state for this execution

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_contact ON workflow_executions(contact_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_started ON workflow_executions(started_at DESC);

-- Workflow Action Executions (individual action runs)
CREATE TABLE workflow_action_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    workflow_action_id UUID NOT NULL REFERENCES workflow_actions(id) ON DELETE CASCADE,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed, skipped

    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    scheduled_for TIMESTAMP, -- For wait/delay actions

    -- Result
    result JSONB, -- Action-specific result data
    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_action_executions_execution ON workflow_action_executions(workflow_execution_id);
CREATE INDEX idx_workflow_action_executions_action ON workflow_action_executions(workflow_action_id);
CREATE INDEX idx_workflow_action_executions_status ON workflow_action_executions(status);
CREATE INDEX idx_workflow_action_executions_scheduled ON workflow_action_executions(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- ============================================================================
-- SECTION 7: MARKETING - CAMPAIGNS & TEMPLATES
-- ============================================================================

-- Email Templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,

    -- Content
    html_content TEXT,
    text_content TEXT,

    -- Template variables
    variables JSONB, -- [{name: "first_name", default: "there"}]

    -- Design
    design_json JSONB, -- For drag-and-drop builder state

    -- Categorization
    category VARCHAR(100),

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_email_templates_sub_account ON email_templates(sub_account_id);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_active ON email_templates(is_active) WHERE deleted_at IS NULL;

-- SMS Templates
CREATE TABLE sms_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,

    -- Template variables
    variables JSONB,

    -- Categorization
    category VARCHAR(100),

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_sms_templates_sub_account ON sms_templates(sub_account_id);
CREATE INDEX idx_sms_templates_category ON sms_templates(category);
CREATE INDEX idx_sms_templates_active ON sms_templates(is_active) WHERE deleted_at IS NULL;

-- Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Campaign type
    campaign_type VARCHAR(50) NOT NULL, -- email, sms, multi_channel

    -- Template references
    email_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    sms_template_id UUID REFERENCES sms_templates(id) ON DELETE SET NULL,

    -- Audience
    target_type VARCHAR(50) DEFAULT 'manual', -- manual, tag, segment, all
    target_config JSONB, -- Tags, filters, segments to target

    -- Scheduling
    schedule_type VARCHAR(50) DEFAULT 'immediate', -- immediate, scheduled, recurring
    scheduled_at TIMESTAMP,
    recurring_config JSONB, -- {frequency: "weekly", day: "monday", time: "09:00"}

    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sending, sent, paused, cancelled

    -- Stats
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,

    -- Timing
    sent_at TIMESTAMP,
    completed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_campaigns_sub_account ON campaigns(sub_account_id);
CREATE INDEX idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled ON campaigns(scheduled_at) WHERE status = 'scheduled';

-- Campaign Recipients (tracking individual sends)
CREATE TABLE campaign_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

    -- Delivery status
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, opened, clicked, bounced, failed, unsubscribed

    -- Tracking
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    first_clicked_at TIMESTAMP,
    bounced_at TIMESTAMP,
    unsubscribed_at TIMESTAMP,

    -- Engagement
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,

    -- Error tracking
    error_code VARCHAR(100),
    error_message TEXT,

    -- External reference
    external_id VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(campaign_id, contact_id)
);

CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_contact ON campaign_recipients(contact_id);
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(status);

-- Email Tracking (clicks)
CREATE TABLE email_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_recipient_id UUID NOT NULL REFERENCES campaign_recipients(id) ON DELETE CASCADE,

    url TEXT NOT NULL,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Request info
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_clicks_recipient ON email_clicks(campaign_recipient_id);
CREATE INDEX idx_email_clicks_clicked_at ON email_clicks(clicked_at DESC);

-- ============================================================================
-- SECTION 8: PAYMENTS & BILLING
-- ============================================================================

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Product type
    product_type VARCHAR(50) DEFAULT 'one_time', -- one_time, recurring, usage_based

    -- Images
    image_url TEXT,
    images JSONB, -- [{url: "...", alt: "..."}]

    -- External integration
    stripe_product_id VARCHAR(255),

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_products_sub_account ON products(sub_account_id);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_active ON products(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_stripe ON products(stripe_product_id) WHERE stripe_product_id IS NOT NULL;

-- Prices
CREATE TABLE prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- Price details
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Billing
    billing_period VARCHAR(50), -- month, year, week, day (for recurring)
    billing_interval INTEGER DEFAULT 1, -- Bill every X periods

    -- Trial
    trial_period_days INTEGER DEFAULT 0,

    -- External integration
    stripe_price_id VARCHAR(255),

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prices_product ON prices(product_id);
CREATE INDEX idx_prices_active ON prices(is_active);
CREATE INDEX idx_prices_stripe ON prices(stripe_price_id) WHERE stripe_price_id IS NOT NULL;

-- Payment Methods
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

    -- Payment method type
    method_type VARCHAR(50) NOT NULL, -- card, bank_account, paypal, etc.

    -- Card details (partial, for display)
    card_brand VARCHAR(50),
    card_last4 VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,

    -- Bank account details (partial)
    bank_name VARCHAR(255),
    account_last4 VARCHAR(4),

    -- External reference
    stripe_payment_method_id VARCHAR(255),

    -- Status
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_payment_methods_contact ON payment_methods(contact_id);
CREATE INDEX idx_payment_methods_stripe ON payment_methods(stripe_payment_method_id) WHERE stripe_payment_method_id IS NOT NULL;

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

    -- Invoice details
    invoice_number VARCHAR(100) UNIQUE NOT NULL,

    -- Amounts
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(15, 2) DEFAULT 0,
    amount_due DECIMAL(15, 2) NOT NULL DEFAULT 0,

    currency VARCHAR(3) DEFAULT 'USD',

    -- Dates
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, open, paid, void, uncollectible

    -- Payment
    paid_at TIMESTAMP,

    -- Notes
    notes TEXT,
    terms TEXT,

    -- External reference
    stripe_invoice_id VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_sub_account ON invoices(sub_account_id);
CREATE INDEX idx_invoices_contact ON invoices(contact_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status = 'open';
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

-- Invoice Line Items
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,

    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_price DECIMAL(15, 2) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    price_id UUID NOT NULL REFERENCES prices(id) ON DELETE RESTRICT,

    -- Subscription details
    status VARCHAR(50) DEFAULT 'active', -- active, paused, cancelled, expired, trialing

    -- Dates
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    trial_start DATE,
    trial_end DATE,
    cancelled_at TIMESTAMP,
    ended_at TIMESTAMP,

    -- Billing
    collection_method VARCHAR(50) DEFAULT 'charge_automatically', -- charge_automatically, send_invoice

    -- External reference
    stripe_subscription_id VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_sub_account ON subscriptions(sub_account_id);
CREATE INDEX idx_subscriptions_contact ON subscriptions(contact_id);
CREATE INDEX idx_subscriptions_product ON subscriptions(product_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end) WHERE status = 'active';
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- Transaction details
    transaction_type VARCHAR(50) NOT NULL, -- payment, refund, adjustment

    -- Amount
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Payment method
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, succeeded, failed, cancelled

    -- Payment gateway
    gateway VARCHAR(50), -- stripe, paypal, square, etc.
    gateway_transaction_id VARCHAR(255),

    -- Metadata
    metadata JSONB,

    -- Error tracking
    error_code VARCHAR(100),
    error_message TEXT,

    -- Timing
    processed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_sub_account ON transactions(sub_account_id);
CREATE INDEX idx_transactions_contact ON transactions(contact_id);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_id);
CREATE INDEX idx_transactions_subscription ON transactions(subscription_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_gateway_id ON transactions(gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================================================
-- SECTION 9: SITES - FUNNELS, PAGES & FORMS
-- ============================================================================

-- Funnels
CREATE TABLE funnels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Domain
    domain VARCHAR(255),
    subdomain VARCHAR(255),
    custom_domain VARCHAR(255),

    -- SEO
    favicon_url TEXT,

    -- Tracking
    google_analytics_id VARCHAR(100),
    facebook_pixel_id VARCHAR(100),

    -- Settings
    settings JSONB DEFAULT '{}',

    -- Status
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_funnels_sub_account ON funnels(sub_account_id);
CREATE INDEX idx_funnels_domain ON funnels(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_funnels_published ON funnels(is_published) WHERE deleted_at IS NULL;

-- Pages
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
    funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    title VARCHAR(255), -- HTML title

    -- URL
    slug VARCHAR(255) NOT NULL,
    full_path VARCHAR(500),

    -- Content
    html_content TEXT,
    css_content TEXT,
    js_content TEXT,

    -- Builder data
    builder_json JSONB, -- Drag-and-drop builder state

    -- SEO
    meta_description TEXT,
    meta_keywords TEXT,
    og_image_url TEXT,

    -- Settings
    page_type VARCHAR(50) DEFAULT 'standard', -- standard, landing, thank_you, error

    -- Redirect
    redirect_url TEXT,

    -- Status
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_pages_sub_account ON pages(sub_account_id);
CREATE INDEX idx_pages_funnel ON pages(funnel_id);
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_published ON pages(is_published) WHERE deleted_at IS NULL;

-- Forms
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
    page_id UUID REFERENCES pages(id) ON DELETE SET NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Form configuration
    fields JSONB NOT NULL, -- [{name: "email", type: "email", required: true, label: "Email Address"}]

    -- Submission settings
    submit_button_text VARCHAR(100) DEFAULT 'Submit',
    success_message TEXT,
    redirect_url TEXT,

    -- Notifications
    notification_emails JSONB, -- ["admin@example.com"]

    -- Integration
    webhook_url TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_forms_sub_account ON forms(sub_account_id);
CREATE INDEX idx_forms_page ON forms(page_id);
CREATE INDEX idx_forms_active ON forms(is_active) WHERE deleted_at IS NULL;

-- Form Submissions
CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- Auto-created or matched

    -- Submission data
    data JSONB NOT NULL, -- {email: "...", name: "...", ...}

    -- Source
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,

    -- Processing
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_contact ON form_submissions(contact_id);
CREATE INDEX idx_form_submissions_created_at ON form_submissions(created_at DESC);
CREATE INDEX idx_form_submissions_processed ON form_submissions(is_processed);

-- Surveys
CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Questions
    questions JSONB NOT NULL, -- [{question: "...", type: "multiple_choice", options: [...]}]

    -- Settings
    allow_multiple_responses BOOLEAN DEFAULT false,
    show_results BOOLEAN DEFAULT false,

    -- Timing
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_surveys_sub_account ON surveys(sub_account_id);
CREATE INDEX idx_surveys_active ON surveys(is_active) WHERE deleted_at IS NULL;

-- Survey Responses
CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

    -- Responses
    responses JSONB NOT NULL, -- [{question_id: "1", answer: "..."}]

    -- Source
    ip_address INET,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_contact ON survey_responses(contact_id);
CREATE INDEX idx_survey_responses_created_at ON survey_responses(created_at DESC);

-- ============================================================================
-- SECTION 10: AI - AGENTS & KNOWLEDGE BASE
-- ============================================================================

-- AI Agents
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- AI Configuration
    model VARCHAR(100) DEFAULT 'gpt-4', -- gpt-4, gpt-3.5-turbo, claude-3, etc.
    temperature DECIMAL(3, 2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 2000,

    -- Personality & Instructions
    system_prompt TEXT,
    personality JSONB, -- {tone: "professional", style: "concise"}

    -- Capabilities
    capabilities JSONB, -- ["answer_questions", "book_appointments", "qualify_leads"]

    -- Integration
    enabled_channels JSONB, -- ["sms", "email", "webchat", "whatsapp"]

    -- Training
    training_status VARCHAR(50) DEFAULT 'untrained', -- untrained, training, trained
    last_trained_at TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_ai_agents_sub_account ON ai_agents(sub_account_id);
CREATE INDEX idx_ai_agents_active ON ai_agents(is_active) WHERE deleted_at IS NULL;

-- Knowledge Bases
CREATE TABLE knowledge_bases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
    ai_agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Source
    source_type VARCHAR(50), -- manual, url, file, integration
    source_url TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_knowledge_bases_sub_account ON knowledge_bases(sub_account_id);
CREATE INDEX idx_knowledge_bases_agent ON knowledge_bases(ai_agent_id);

-- Training Data (knowledge base entries)
CREATE TABLE training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,

    -- Content
    question TEXT,
    answer TEXT NOT NULL,
    content TEXT, -- For documents/articles

    -- Categorization
    category VARCHAR(100),
    tags JSONB,

    -- Metadata
    metadata JSONB,

    -- Vector embeddings (for semantic search)
    embedding vector(1536), -- OpenAI embeddings dimension

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_training_data_knowledge_base ON training_data(knowledge_base_id);
CREATE INDEX idx_training_data_category ON training_data(category);

-- Conversation AI Configurations (per conversation AI settings)
CREATE TABLE conversation_ai_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    ai_agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,

    -- AI Handoff
    handoff_to_human BOOLEAN DEFAULT false,
    handoff_reason TEXT,
    handoff_at TIMESTAMP,

    -- Engagement metrics
    messages_handled INTEGER DEFAULT 0,
    satisfaction_score DECIMAL(3, 2), -- 0-5 rating

    -- Status
    is_active BOOLEAN DEFAULT true,
    deactivated_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(conversation_id)
);

CREATE INDEX idx_conversation_ai_configs_conversation ON conversation_ai_configs(conversation_id);
CREATE INDEX idx_conversation_ai_configs_agent ON conversation_ai_configs(ai_agent_id);
CREATE INDEX idx_conversation_ai_configs_active ON conversation_ai_configs(is_active);

-- AI Conversation Logs (for training and improvement)
CREATE TABLE ai_conversation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ai_agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,

    -- Input/Output
    user_input TEXT NOT NULL,
    ai_response TEXT NOT NULL,

    -- Context
    context JSONB, -- Conversation context used

    -- Quality metrics
    confidence_score DECIMAL(3, 2), -- AI's confidence in response
    was_helpful BOOLEAN, -- User feedback

    -- Token usage
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_conversation_logs_agent ON ai_conversation_logs(ai_agent_id);
CREATE INDEX idx_ai_conversation_logs_conversation ON ai_conversation_logs(conversation_id);
CREATE INDEX idx_ai_conversation_logs_created_at ON ai_conversation_logs(created_at DESC);

-- ============================================================================
-- SECTION 11: AUDIT & ACTIVITY LOGGING
-- ============================================================================

-- Activity Logs (audit trail)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Context
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Activity details
    entity_type VARCHAR(100) NOT NULL, -- contacts, opportunities, workflows, etc.
    entity_id UUID,
    action VARCHAR(100) NOT NULL, -- created, updated, deleted, viewed, exported, etc.

    -- Changes
    changes JSONB, -- {field: {old: "...", new: "..."}}

    -- Request info
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_agency ON activity_logs(agency_id);
CREATE INDEX idx_activity_logs_sub_account ON activity_logs(sub_account_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================================================
-- SECTION 12: INTEGRATIONS & WEBHOOKS
-- ============================================================================

-- Integrations
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    -- Integration details
    integration_type VARCHAR(100) NOT NULL, -- stripe, zapier, google, facebook, mailchimp, etc.
    name VARCHAR(255) NOT NULL,

    -- Configuration
    config JSONB NOT NULL,
    credentials_encrypted TEXT,

    -- OAuth tokens (encrypted)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMP,
    sync_status VARCHAR(50), -- success, failed, in_progress
    sync_error TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_integrations_sub_account ON integrations(sub_account_id);
CREATE INDEX idx_integrations_type ON integrations(integration_type);
CREATE INDEX idx_integrations_active ON integrations(is_active);

-- Webhooks
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,

    -- Events to listen for
    events JSONB NOT NULL, -- ["contact.created", "opportunity.won", "form.submitted"]

    -- Security
    secret VARCHAR(255),

    -- Configuration
    headers JSONB, -- Custom headers

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Stats
    total_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    last_called_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_sub_account ON webhooks(sub_account_id);
CREATE INDEX idx_webhooks_active ON webhooks(is_active);

-- Webhook Logs
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,

    -- Event
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,

    -- Response
    response_status INTEGER,
    response_body TEXT,
    response_time_ms INTEGER,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed
    error_message TEXT,

    -- Retry
    retry_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_logs_webhook ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- ============================================================================
-- SECTION 13: REPORTING & ANALYTICS
-- ============================================================================

-- Analytics Events (custom event tracking)
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,

    -- Event details
    event_name VARCHAR(255) NOT NULL,
    event_category VARCHAR(100),

    -- Context
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Properties
    properties JSONB,

    -- Source
    source VARCHAR(100), -- web, mobile, api, automation

    -- Session
    session_id VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_sub_account ON analytics_events(sub_account_id);
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_contact ON analytics_events(contact_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active contacts with full details
CREATE VIEW v_active_contacts AS
SELECT
    c.*,
    sa.name as sub_account_name,
    u.full_name as assigned_user_name,
    COUNT(DISTINCT ct.tag_id) as tag_count,
    COUNT(DISTINCT n.id) as note_count,
    COUNT(DISTINCT t.id) as task_count,
    COUNT(DISTINCT o.id) as opportunity_count
FROM contacts c
LEFT JOIN sub_accounts sa ON c.sub_account_id = sa.id
LEFT JOIN users u ON c.assigned_user_id = u.id
LEFT JOIN contact_tags ct ON c.id = ct.contact_id
LEFT JOIN notes n ON c.id = n.contact_id
LEFT JOIN tasks t ON c.id = t.contact_id AND t.status != 'completed'
LEFT JOIN opportunities o ON c.id = o.contact_id AND o.status = 'open'
WHERE c.deleted_at IS NULL AND c.is_active = true
GROUP BY c.id, sa.name, u.full_name;

-- Pipeline performance metrics
CREATE VIEW v_pipeline_metrics AS
SELECT
    p.id as pipeline_id,
    p.name as pipeline_name,
    ps.id as stage_id,
    ps.name as stage_name,
    COUNT(o.id) as opportunity_count,
    SUM(o.value) as total_value,
    AVG(o.value) as average_value
FROM pipelines p
JOIN pipeline_stages ps ON p.id = ps.pipeline_id
LEFT JOIN opportunities o ON ps.id = o.stage_id AND o.status = 'open' AND o.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, ps.id, ps.name
ORDER BY p.id, ps.position;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE agencies IS 'Top-level tenant organizations (white-label agencies)';
COMMENT ON TABLE sub_accounts IS 'Locations/clients under agencies (multi-tenant isolation)';
COMMENT ON TABLE contacts IS 'CRM contacts with custom fields support via JSONB';
COMMENT ON TABLE workflows IS 'Marketing automation workflows with trigger-action model';
COMMENT ON TABLE ai_agents IS 'AI-powered chatbots and assistants with knowledge base integration';
COMMENT ON TABLE conversations IS 'Unified inbox for all communication channels';
COMMENT ON TABLE opportunities IS 'Sales pipeline opportunities with custom fields';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Vacuum analyze for optimal performance
VACUUM ANALYZE;
