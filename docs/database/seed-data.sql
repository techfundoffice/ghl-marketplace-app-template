-- ============================================================================
-- GoHighLevel Clone - Seed Data
-- ============================================================================
-- Description: Sample data for development and testing
-- Version: 1.0.0
-- ============================================================================

-- Clear existing data (for development only)
-- TRUNCATE TABLE agencies, users CASCADE;

-- ============================================================================
-- SECTION 1: SEED PERMISSIONS (System-level)
-- ============================================================================

INSERT INTO permissions (id, name, resource, action, description) VALUES
-- Contacts
('perm-001', 'contacts.create', 'contacts', 'create', 'Create new contacts'),
('perm-002', 'contacts.read', 'contacts', 'read', 'View contacts'),
('perm-003', 'contacts.update', 'contacts', 'update', 'Update contact information'),
('perm-004', 'contacts.delete', 'contacts', 'delete', 'Delete contacts'),
('perm-005', 'contacts.manage', 'contacts', 'manage', 'Full contact management'),

-- Opportunities
('perm-006', 'opportunities.create', 'opportunities', 'create', 'Create opportunities'),
('perm-007', 'opportunities.read', 'opportunities', 'read', 'View opportunities'),
('perm-008', 'opportunities.update', 'opportunities', 'update', 'Update opportunities'),
('perm-009', 'opportunities.delete', 'opportunities', 'delete', 'Delete opportunities'),

-- Calendars
('perm-010', 'calendars.create', 'calendars', 'create', 'Create calendars'),
('perm-011', 'calendars.read', 'calendars', 'read', 'View calendars'),
('perm-012', 'calendars.update', 'calendars', 'update', 'Update calendars'),

-- Workflows
('perm-013', 'workflows.create', 'workflows', 'create', 'Create workflows'),
('perm-014', 'workflows.read', 'workflows', 'read', 'View workflows'),
('perm-015', 'workflows.update', 'workflows', 'update', 'Update workflows'),
('perm-016', 'workflows.delete', 'workflows', 'delete', 'Delete workflows'),

-- Campaigns
('perm-017', 'campaigns.create', 'campaigns', 'create', 'Create campaigns'),
('perm-018', 'campaigns.read', 'campaigns', 'read', 'View campaigns'),
('perm-019', 'campaigns.update', 'campaigns', 'update', 'Update campaigns'),

-- Settings
('perm-020', 'settings.manage', 'settings', 'manage', 'Manage sub-account settings'),
('perm-021', 'users.manage', 'users', 'manage', 'Manage users and permissions'),
('perm-022', 'billing.manage', 'billing', 'manage', 'Manage billing and subscriptions');

-- ============================================================================
-- SECTION 2: SEED AGENCY & SUB-ACCOUNTS
-- ============================================================================

-- Agency 1: Digital Marketing Agency
INSERT INTO agencies (id, name, slug, plan_type, max_sub_accounts, max_users, is_active)
VALUES (
    'agency-001',
    'Digital Marketing Pro',
    'digital-marketing-pro',
    'enterprise',
    50,
    100,
    true
);

-- Sub-account 1: Restaurant Location A
INSERT INTO sub_accounts (id, agency_id, name, business_name, slug, email, phone, city, state, country, timezone, is_active)
VALUES (
    'sub-001',
    'agency-001',
    'Downtown Restaurant',
    'Downtown Bistro LLC',
    'downtown-restaurant',
    'info@downtownbistro.com',
    '+1-555-0101',
    'New York',
    'NY',
    'USA',
    'America/New_York',
    true
);

-- Sub-account 2: Fitness Studio
INSERT INTO sub_accounts (id, agency_id, name, business_name, slug, email, phone, city, state, country, timezone, is_active)
VALUES (
    'sub-002',
    'agency-001',
    'Elite Fitness Studio',
    'Elite Fitness LLC',
    'elite-fitness',
    'hello@elitefitness.com',
    '+1-555-0102',
    'Los Angeles',
    'CA',
    'USA',
    'America/Los_Angeles',
    true
);

-- ============================================================================
-- SECTION 3: SEED USERS
-- ============================================================================

-- Agency owner
INSERT INTO users (id, email, first_name, last_name, password_hash, email_verified, is_active)
VALUES (
    'user-001',
    'admin@digitalmarketingpro.com',
    'Sarah',
    'Johnson',
    '$2a$10$example_hash_here', -- bcrypt hash
    true,
    true
);

-- Sub-account user 1 (Restaurant manager)
INSERT INTO users (id, email, first_name, last_name, password_hash, email_verified, is_active)
VALUES (
    'user-002',
    'manager@downtownbistro.com',
    'John',
    'Smith',
    '$2a$10$example_hash_here',
    true,
    true
);

-- Sub-account user 2 (Fitness studio owner)
INSERT INTO users (id, email, first_name, last_name, password_hash, email_verified, is_active)
VALUES (
    'user-003',
    'owner@elitefitness.com',
    'Emily',
    'Davis',
    '$2a$10$example_hash_here',
    true,
    true
);

-- ============================================================================
-- SECTION 4: SEED ROLES
-- ============================================================================

-- Agency-level role
INSERT INTO roles (id, agency_id, name, scope, is_system)
VALUES (
    'role-001',
    'agency-001',
    'Agency Admin',
    'agency',
    true
);

-- Sub-account roles
INSERT INTO roles (id, sub_account_id, name, scope, is_system)
VALUES
('role-002', 'sub-001', 'Account Owner', 'sub_account', true),
('role-003', 'sub-001', 'Sales Rep', 'sub_account', false),
('role-004', 'sub-002', 'Account Owner', 'sub_account', true);

-- ============================================================================
-- SECTION 5: SEED ROLE PERMISSIONS
-- ============================================================================

-- Agency Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-001', id FROM permissions;

-- Account Owner gets most permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-002', id FROM permissions
WHERE name NOT LIKE 'billing.%';

-- Sales Rep gets limited permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-003', id FROM permissions
WHERE name IN (
    'contacts.create', 'contacts.read', 'contacts.update',
    'opportunities.create', 'opportunities.read', 'opportunities.update',
    'calendars.read', 'calendars.update'
);

-- ============================================================================
-- SECTION 6: SEED USER MEMBERSHIPS
-- ============================================================================

-- Agency memberships
INSERT INTO user_agency_memberships (user_id, agency_id, role_id, membership_type, is_active, joined_at)
VALUES (
    'user-001',
    'agency-001',
    'role-001',
    'owner',
    true,
    CURRENT_TIMESTAMP
);

-- Sub-account memberships
INSERT INTO user_sub_account_memberships (user_id, sub_account_id, role_id, is_active, joined_at)
VALUES
('user-002', 'sub-001', 'role-002', true, CURRENT_TIMESTAMP),
('user-003', 'sub-002', 'role-004', true, CURRENT_TIMESTAMP);

-- ============================================================================
-- SECTION 7: SEED CONTACTS
-- ============================================================================

INSERT INTO contacts (id, sub_account_id, email, phone, first_name, last_name, contact_type, lifecycle_stage, lead_score, assigned_user_id, custom_fields)
VALUES
-- Restaurant contacts
('contact-001', 'sub-001', 'alice@example.com', '+1-555-1001', 'Alice', 'Williams', 'lead', 'subscriber', 45, 'user-002', '{"dietary_preferences": "vegetarian", "favorite_cuisine": "italian"}'),
('contact-002', 'sub-001', 'bob@example.com', '+1-555-1002', 'Bob', 'Brown', 'customer', 'customer', 85, 'user-002', '{"vip_member": true, "reservation_count": 12}'),
('contact-003', 'sub-001', 'charlie@example.com', '+1-555-1003', 'Charlie', 'Taylor', 'lead', 'lead', 60, 'user-002', '{"source": "google_ads"}'),

-- Fitness contacts
('contact-004', 'sub-002', 'diana@example.com', '+1-555-2001', 'Diana', 'Martinez', 'customer', 'customer', 90, 'user-003', '{"membership_type": "premium", "fitness_goals": "weight_loss"}'),
('contact-005', 'sub-002', 'eve@example.com', '+1-555-2002', 'Eve', 'Garcia', 'lead', 'marketing_qualified_lead', 70, 'user-003', '{"interested_in": "yoga", "referral_source": "friend"}');

-- ============================================================================
-- SECTION 8: SEED TAGS
-- ============================================================================

INSERT INTO tags (id, sub_account_id, name, color)
VALUES
('tag-001', 'sub-001', 'VIP Customer', '#FFD700'),
('tag-002', 'sub-001', 'First-Time Visitor', '#3B82F6'),
('tag-003', 'sub-001', 'Newsletter Subscriber', '#10B981'),
('tag-004', 'sub-002', 'Premium Member', '#8B5CF6'),
('tag-005', 'sub-002', 'Trial User', '#F59E0B');

-- Contact tags
INSERT INTO contact_tags (contact_id, tag_id)
VALUES
('contact-002', 'tag-001'),
('contact-001', 'tag-003'),
('contact-004', 'tag-004'),
('contact-005', 'tag-005');

-- ============================================================================
-- SECTION 9: SEED PIPELINES & OPPORTUNITIES
-- ============================================================================

-- Restaurant pipeline
INSERT INTO pipelines (id, sub_account_id, name, is_default, currency)
VALUES ('pipeline-001', 'sub-001', 'Catering Sales', true, 'USD');

-- Pipeline stages
INSERT INTO pipeline_stages (id, pipeline_id, name, probability, position, color)
VALUES
('stage-001', 'pipeline-001', 'New Lead', 10, 1, '#94A3B8'),
('stage-002', 'pipeline-001', 'Qualified', 25, 2, '#3B82F6'),
('stage-003', 'pipeline-001', 'Proposal Sent', 50, 3, '#F59E0B'),
('stage-004', 'pipeline-001', 'Negotiation', 75, 4, '#8B5CF6'),
('stage-005', 'pipeline-001', 'Won', 100, 5, '#10B981');

-- Opportunities
INSERT INTO opportunities (id, sub_account_id, pipeline_id, stage_id, contact_id, title, value, currency, expected_close_date, assigned_user_id, status)
VALUES
('opp-001', 'sub-001', 'pipeline-001', 'stage-002', 'contact-001', 'Wedding Catering', 5000.00, 'USD', '2026-06-15', 'user-002', 'open'),
('opp-002', 'sub-001', 'pipeline-001', 'stage-003', 'contact-003', 'Corporate Event', 12000.00, 'USD', '2026-03-20', 'user-002', 'open');

-- ============================================================================
-- SECTION 10: SEED CHANNELS & CONVERSATIONS
-- ============================================================================

-- Channels
INSERT INTO channels (id, sub_account_id, channel_type, name, provider, config, is_active, is_verified)
VALUES
('channel-001', 'sub-001', 'sms', 'Restaurant SMS', 'twilio', '{"phone_number": "+15550101"}'::jsonb, true, true),
('channel-002', 'sub-001', 'email', 'Restaurant Email', 'sendgrid', '{"from_email": "info@downtownbistro.com"}'::jsonb, true, true),
('channel-003', 'sub-002', 'sms', 'Fitness SMS', 'twilio', '{"phone_number": "+15550102"}'::jsonb, true, true);

-- Conversations
INSERT INTO conversations (id, sub_account_id, contact_id, channel_id, assigned_user_id, status, subject, last_message_at, unread_count)
VALUES
('conv-001', 'sub-001', 'contact-001', 'channel-001', 'user-002', 'open', 'Reservation inquiry', CURRENT_TIMESTAMP - INTERVAL '2 hours', 1),
('conv-002', 'sub-002', 'contact-004', 'channel-003', 'user-003', 'resolved', 'Class schedule question', CURRENT_TIMESTAMP - INTERVAL '1 day', 0);

-- Messages
INSERT INTO messages (id, conversation_id, direction, sender_type, sender_id, content_type, body, status)
VALUES
('msg-001', 'conv-001', 'inbound', 'contact', 'contact-001', 'text', 'Hi, do you have availability for dinner on Saturday?', 'delivered'),
('msg-002', 'conv-001', 'outbound', 'user', 'user-002', 'text', 'Yes! We have tables available. What time works for you?', 'delivered'),
('msg-003', 'conv-002', 'inbound', 'contact', 'contact-004', 'text', 'What time is the yoga class tomorrow?', 'delivered'),
('msg-004', 'conv-002', 'outbound', 'user', 'user-003', 'text', 'Our yoga class is at 9 AM. See you there!', 'read');

-- ============================================================================
-- SECTION 11: SEED CALENDARS & APPOINTMENTS
-- ============================================================================

-- Calendars
INSERT INTO calendars (id, sub_account_id, user_id, name, is_default, is_active)
VALUES
('cal-001', 'sub-001', 'user-002', 'Restaurant Manager Calendar', true, true),
('cal-002', 'sub-002', 'user-003', 'Fitness Trainer Calendar', true, true);

-- Availability
INSERT INTO availability (calendar_id, day_of_week, start_time, end_time, timezone)
VALUES
-- Restaurant (Mon-Fri, 9 AM - 5 PM)
('cal-001', 1, '09:00', '17:00', 'America/New_York'),
('cal-001', 2, '09:00', '17:00', 'America/New_York'),
('cal-001', 3, '09:00', '17:00', 'America/New_York'),
('cal-001', 4, '09:00', '17:00', 'America/New_York'),
('cal-001', 5, '09:00', '17:00', 'America/New_York'),

-- Fitness (Mon-Sat, 6 AM - 8 PM)
('cal-002', 1, '06:00', '20:00', 'America/Los_Angeles'),
('cal-002', 2, '06:00', '20:00', 'America/Los_Angeles'),
('cal-002', 3, '06:00', '20:00', 'America/Los_Angeles'),
('cal-002', 4, '06:00', '20:00', 'America/Los_Angeles'),
('cal-002', 5, '06:00', '20:00', 'America/Los_Angeles'),
('cal-002', 6, '08:00', '18:00', 'America/Los_Angeles');

-- Services
INSERT INTO services (id, sub_account_id, name, description, duration_minutes, price, currency, requires_payment)
VALUES
('service-001', 'sub-001', 'Consultation Call', 'Catering consultation', 30, 0, 'USD', false),
('service-002', 'sub-002', 'Personal Training Session', '1-on-1 training', 60, 75.00, 'USD', true),
('service-003', 'sub-002', 'Nutrition Consultation', 'Diet planning session', 45, 50.00, 'USD', true);

-- Appointments
INSERT INTO appointments (id, sub_account_id, calendar_id, contact_id, service_id, title, start_time, end_time, assigned_user_id, status, location_type)
VALUES
('appt-001', 'sub-001', 'cal-001', 'contact-001', 'service-001', 'Catering Consultation', CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '30 minutes', 'user-002', 'scheduled', 'phone'),
('appt-002', 'sub-002', 'cal-002', 'contact-004', 'service-002', 'PT Session', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '1 hour', 'user-003', 'confirmed', 'in_person');

-- ============================================================================
-- SECTION 12: SEED EMAIL & SMS TEMPLATES
-- ============================================================================

-- Email templates
INSERT INTO email_templates (id, sub_account_id, name, subject, html_content, text_content, category)
VALUES
('email-template-001', 'sub-001', 'Welcome Email', 'Welcome to {{business_name}}!',
 '<p>Hi {{first_name}},</p><p>Welcome to Downtown Bistro! We are excited to serve you.</p>',
 'Hi {{first_name}}, Welcome to Downtown Bistro! We are excited to serve you.',
 'onboarding'),

('email-template-002', 'sub-002', 'Trial Reminder', 'Your trial ends soon',
 '<p>Hey {{first_name}},</p><p>Your trial at Elite Fitness ends in 3 days. Join now!</p>',
 'Hey {{first_name}}, Your trial at Elite Fitness ends in 3 days. Join now!',
 'sales');

-- SMS templates
INSERT INTO sms_templates (id, sub_account_id, name, content, category)
VALUES
('sms-template-001', 'sub-001', 'Reservation Confirmation', 'Hi {{first_name}}, your reservation at {{business_name}} is confirmed for {{date}}. See you soon!', 'booking'),
('sms-template-002', 'sub-002', 'Class Reminder', 'Reminder: {{class_name}} starts in 1 hour at Elite Fitness. See you there!', 'reminder');

-- ============================================================================
-- SECTION 13: SEED WORKFLOWS
-- ============================================================================

-- Workflow 1: Welcome new contacts
INSERT INTO workflows (id, sub_account_id, name, description, trigger_type, trigger_config, is_active)
VALUES (
    'workflow-001',
    'sub-001',
    'Welcome New Contacts',
    'Send welcome email to new contacts',
    'contact_created',
    '{"source": "form"}'::jsonb,
    true
);

-- Workflow actions
INSERT INTO workflow_actions (id, workflow_id, action_type, action_config, position)
VALUES
('action-001', 'workflow-001', 'send_email', '{"template_id": "email-template-001"}'::jsonb, 1),
('action-002', 'workflow-001', 'wait', '{"duration": "1 day"}'::jsonb, 2),
('action-003', 'workflow-001', 'add_tag', '{"tag": "Newsletter Subscriber"}'::jsonb, 3);

-- ============================================================================
-- SECTION 14: SEED PRODUCTS & PRICING
-- ============================================================================

-- Products
INSERT INTO products (id, sub_account_id, name, description, product_type, is_active)
VALUES
('product-001', 'sub-002', 'Monthly Membership', 'Unlimited access to all classes', 'recurring', true),
('product-002', 'sub-002', 'Personal Training Package', '10 sessions with certified trainer', 'one_time', true);

-- Prices
INSERT INTO prices (id, product_id, amount, currency, billing_period, billing_interval, is_active)
VALUES
('price-001', 'product-001', 99.00, 'USD', 'month', 1, true),
('price-002', 'product-001', 999.00, 'USD', 'year', 1, true), -- Annual discount
('price-003', 'product-002', 650.00, 'USD', null, null, true); -- One-time

-- ============================================================================
-- SECTION 15: SEED AI AGENTS
-- ============================================================================

-- AI Agent
INSERT INTO ai_agents (id, sub_account_id, name, description, model, temperature, system_prompt, capabilities, enabled_channels, is_active)
VALUES (
    'ai-agent-001',
    'sub-001',
    'Restaurant Concierge Bot',
    'Handles reservations and FAQs',
    'gpt-4-turbo',
    0.7,
    'You are a friendly restaurant concierge assistant. Help customers with reservations, menu questions, and general inquiries. Be warm and professional.',
    '["answer_faq", "book_appointments", "check_availability"]'::jsonb,
    '["sms", "webchat", "facebook"]'::jsonb,
    true
);

-- Knowledge Base
INSERT INTO knowledge_bases (id, sub_account_id, ai_agent_id, name, description, source_type)
VALUES (
    'kb-001',
    'sub-001',
    'ai-agent-001',
    'Restaurant FAQ',
    'Common questions about menu, hours, reservations',
    'manual'
);

-- Training Data
INSERT INTO training_data (id, knowledge_base_id, question, answer, category, tags)
VALUES
('training-001', 'kb-001', 'What are your hours?', 'We are open Monday-Saturday 11 AM - 10 PM, and Sunday 12 PM - 9 PM.', 'General', '["hours", "schedule"]'::jsonb),
('training-002', 'kb-001', 'Do you have vegetarian options?', 'Yes! We have a dedicated vegetarian menu with 12+ options including pasta, salads, and entrees.', 'Menu', '["vegetarian", "menu"]'::jsonb),
('training-003', 'kb-001', 'How do I make a reservation?', 'You can book online, call us at +1-555-0101, or text us. We recommend booking 2-3 days in advance for weekends.', 'Reservations', '["booking", "reservation"]'::jsonb);

-- ============================================================================
-- SECTION 16: SEED ANALYTICS EVENTS
-- ============================================================================

INSERT INTO analytics_events (sub_account_id, contact_id, event_name, event_category, properties, source)
VALUES
('sub-001', 'contact-001', 'page_viewed', 'engagement', '{"page": "/menu", "duration": 45}'::jsonb, 'web'),
('sub-001', 'contact-001', 'form_submitted', 'conversion', '{"form": "contact_form"}'::jsonb, 'web'),
('sub-002', 'contact-004', 'class_booked', 'conversion', '{"class": "yoga", "date": "2025-12-20"}'::jsonb, 'mobile'),
('sub-002', 'contact-005', 'trial_started', 'conversion', '{"trial_days": 7}'::jsonb, 'web');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify data counts
DO $$
BEGIN
    RAISE NOTICE 'Agencies: %', (SELECT COUNT(*) FROM agencies);
    RAISE NOTICE 'Sub-accounts: %', (SELECT COUNT(*) FROM sub_accounts);
    RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Contacts: %', (SELECT COUNT(*) FROM contacts);
    RAISE NOTICE 'Conversations: %', (SELECT COUNT(*) FROM conversations);
    RAISE NOTICE 'Opportunities: %', (SELECT COUNT(*) FROM opportunities);
    RAISE NOTICE 'Appointments: %', (SELECT COUNT(*) FROM appointments);
    RAISE NOTICE 'Workflows: %', (SELECT COUNT(*) FROM workflows);
    RAISE NOTICE 'AI Agents: %', (SELECT COUNT(*) FROM ai_agents);
END $$;

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
