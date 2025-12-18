/**
 * Workflow Triggers - 30+ Trigger Types
 * All possible events that can start a workflow
 */

// ============================================================================
// TRIGGER BASE
// ============================================================================

export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  config: TriggerConfig;
  filters?: TriggerFilter[];

  // Rate limiting
  rateLimiting?: {
    maxPerContact?: number; // Max triggers per contact per time window
    timeWindow?: {
      amount: number;
      unit: 'minutes' | 'hours' | 'days';
    };
  };
}

export enum TriggerType {
  // Contact triggers
  CONTACT_CREATED = 'contact.created',
  CONTACT_UPDATED = 'contact.updated',
  TAG_ADDED = 'contact.tag.added',
  TAG_REMOVED = 'contact.tag.removed',
  CONTACT_DND_CHANGED = 'contact.dnd.changed',
  CUSTOM_FIELD_CHANGED = 'contact.field.changed',

  // Form/Survey triggers
  FORM_SUBMITTED = 'form.submitted',
  FORM_ABANDONED = 'form.abandoned',
  SURVEY_COMPLETED = 'survey.completed',
  SURVEY_RESPONSE = 'survey.response',

  // Appointment triggers
  APPOINTMENT_BOOKED = 'appointment.booked',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment.rescheduled',
  APPOINTMENT_NO_SHOW = 'appointment.no_show',
  APPOINTMENT_COMPLETED = 'appointment.completed',
  APPOINTMENT_REMINDER = 'appointment.reminder',

  // Opportunity/Pipeline triggers
  OPPORTUNITY_CREATED = 'opportunity.created',
  OPPORTUNITY_STAGE_CHANGED = 'opportunity.stage.changed',
  OPPORTUNITY_STATUS_CHANGED = 'opportunity.status.changed',
  OPPORTUNITY_STALE = 'opportunity.stale',
  OPPORTUNITY_WON = 'opportunity.won',
  OPPORTUNITY_LOST = 'opportunity.lost',

  // Payment triggers
  PAYMENT_SUCCESSFUL = 'payment.successful',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_RENEWED = 'subscription.renewed',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  SUBSCRIPTION_EXPIRED = 'subscription.expired',

  // Communication triggers
  EMAIL_OPENED = 'email.opened',
  EMAIL_CLICKED = 'email.clicked',
  EMAIL_REPLIED = 'email.replied',
  EMAIL_BOUNCED = 'email.bounced',
  EMAIL_UNSUBSCRIBED = 'email.unsubscribed',
  SMS_RECEIVED = 'sms.received',
  SMS_REPLIED = 'sms.replied',
  CALL_COMPLETED = 'call.completed',
  CALL_MISSED = 'call.missed',
  VOICEMAIL_RECEIVED = 'voicemail.received',

  // Date-based triggers
  BIRTHDAY = 'date.birthday',
  ANNIVERSARY = 'date.anniversary',
  CUSTOM_DATE = 'date.custom',
  DATE_REACHED = 'date.reached',

  // Custom triggers
  WEBHOOK_RECEIVED = 'webhook.received',
  CUSTOM_EVENT = 'custom.event',
  MANUAL_ENROLLMENT = 'manual.enrollment',
  API_TRIGGER = 'api.trigger',
}

// ============================================================================
// TRIGGER CONFIGURATIONS
// ============================================================================

export type TriggerConfig =
  | ContactTriggerConfig
  | FormTriggerConfig
  | AppointmentTriggerConfig
  | OpportunityTriggerConfig
  | PaymentTriggerConfig
  | CommunicationTriggerConfig
  | DateTriggerConfig
  | WebhookTriggerConfig
  | CustomTriggerConfig;

// Contact Triggers
export interface ContactTriggerConfig {
  triggerType: 'contact';

  // For TAG_ADDED/TAG_REMOVED
  tags?: string[];
  tagMatchMode?: 'any' | 'all';

  // For CUSTOM_FIELD_CHANGED
  fieldName?: string;
  oldValue?: any;
  newValue?: any;

  // For CONTACT_UPDATED
  fieldsToWatch?: string[];
}

// Form Triggers
export interface FormTriggerConfig {
  triggerType: 'form';
  formId?: string;

  // For FORM_ABANDONED
  abandonmentTime?: {
    amount: number;
    unit: 'minutes' | 'hours';
  };

  // Field-specific triggers
  fieldConditions?: {
    fieldId: string;
    operator: string;
    value: any;
  }[];
}

// Appointment Triggers
export interface AppointmentTriggerConfig {
  triggerType: 'appointment';
  calendarId?: string;
  appointmentTypeId?: string;

  // For APPOINTMENT_REMINDER
  reminderTiming?: {
    amount: number;
    unit: 'minutes' | 'hours' | 'days';
    before: boolean;
  };

  // For APPOINTMENT_STALE
  staleAfter?: {
    amount: number;
    unit: 'days' | 'weeks';
  };
}

// Opportunity Triggers
export interface OpportunityTriggerConfig {
  triggerType: 'opportunity';
  pipelineId?: string;
  stageId?: string;

  // For OPPORTUNITY_STALE
  staleAfter?: {
    amount: number;
    unit: 'days' | 'weeks';
  };

  // For OPPORTUNITY_STAGE_CHANGED
  fromStageId?: string;
  toStageId?: string;
}

// Payment Triggers
export interface PaymentTriggerConfig {
  triggerType: 'payment';

  // Filter by amount
  amountRange?: {
    min?: number;
    max?: number;
  };

  // Filter by product/subscription
  productIds?: string[];
  subscriptionPlanIds?: string[];

  // Payment method
  paymentMethods?: ('card' | 'bank' | 'cash' | 'other')[];
}

// Communication Triggers
export interface CommunicationTriggerConfig {
  triggerType: 'communication';

  // For EMAIL_CLICKED
  linkUrl?: string;
  linkContains?: string;

  // For EMAIL_OPENED
  minimumOpens?: number;

  // For SMS/CALL
  phoneNumber?: string;
  direction?: 'inbound' | 'outbound';

  // Message content matching
  messageContains?: string;
  messageRegex?: string;
}

// Date Triggers
export interface DateTriggerConfig {
  triggerType: 'date';

  // For BIRTHDAY/ANNIVERSARY
  daysBeforeAfter?: {
    amount: number;
    before: boolean;
  };

  // For CUSTOM_DATE
  dateField?: string;

  // Recurring
  recurring?: {
    enabled: boolean;
    interval: 'yearly' | 'monthly' | 'weekly';
  };
}

// Webhook Triggers
export interface WebhookTriggerConfig {
  triggerType: 'webhook';
  webhookUrl: string;
  secret?: string;

  // Payload validation
  expectedPayloadSchema?: Record<string, any>;

  // Filtering
  payloadFilters?: {
    field: string;
    operator: string;
    value: any;
  }[];
}

// Custom Triggers
export interface CustomTriggerConfig {
  triggerType: 'custom';
  eventName: string;

  // Custom event data
  requiredFields?: string[];
  optionalFields?: string[];
}

// ============================================================================
// TRIGGER FILTERS
// ============================================================================

export interface TriggerFilter {
  id: string;
  field: string;
  operator: string;
  value: any;
  dataType?: string;
}

// ============================================================================
// TRIGGER EVENT PAYLOAD
// ============================================================================

export interface TriggerEvent {
  id: string;
  type: TriggerType;
  timestamp: Date;

  // Core entities
  contactId: string;
  organizationId: string;

  // Event-specific data
  payload: TriggerEventPayload;

  // Metadata
  source?: string;
  userId?: string;
}

export type TriggerEventPayload = Record<string, any>;

// ============================================================================
// TRIGGER HISTORY
// ============================================================================

export interface TriggerHistory {
  id: string;
  triggerId: string;
  workflowId: string;
  contactId: string;

  event: TriggerEvent;

  // Outcome
  enrolled: boolean;
  enrollmentBlockedReason?: string;

  timestamp: Date;
}
