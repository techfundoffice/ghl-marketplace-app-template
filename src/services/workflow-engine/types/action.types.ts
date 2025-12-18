/**
 * Workflow Actions - 40+ Action Types
 * All possible actions that can be executed in a workflow
 */

import { ConditionGroup, RetryConfig } from './workflow.types';

// ============================================================================
// ACTION BASE
// ============================================================================

export interface WorkflowAction {
  id: string;
  type: ActionType;
  name: string;
  description?: string;

  config: ActionConfig;

  // Execution settings
  retryConfig?: RetryConfig;
  timeout?: number; // milliseconds

  // Conditional execution
  executeIf?: ConditionGroup;

  // Next steps
  onSuccess?: string[]; // Next action IDs
  onFailure?: string[]; // Next action IDs on failure

  // Position (for UI)
  position?: { x: number; y: number };
}

export enum ActionType {
  // Communication Actions
  SEND_EMAIL = 'communication.email.send',
  SEND_SMS = 'communication.sms.send',
  SEND_WHATSAPP = 'communication.whatsapp.send',
  MAKE_CALL = 'communication.call.make',
  DROP_VOICEMAIL = 'communication.voicemail.drop',
  SEND_RCS = 'communication.rcs.send',

  // CRM Actions
  ADD_TAG = 'crm.tag.add',
  REMOVE_TAG = 'crm.tag.remove',
  UPDATE_CONTACT = 'crm.contact.update',
  CREATE_OPPORTUNITY = 'crm.opportunity.create',
  UPDATE_OPPORTUNITY = 'crm.opportunity.update',
  MOVE_OPPORTUNITY_STAGE = 'crm.opportunity.move_stage',
  ASSIGN_TO_USER = 'crm.assign.user',
  ADD_NOTE = 'crm.note.add',
  CREATE_TASK = 'crm.task.create',

  // Internal Flow Actions
  WAIT = 'internal.wait',
  DELAY = 'internal.delay',
  IF_ELSE = 'internal.if_else',
  SPLIT = 'internal.split',
  GOTO = 'internal.goto',
  END_WORKFLOW = 'internal.end',
  RANDOM_PATH = 'internal.random',

  // Math/Data Actions
  SET_VARIABLE = 'data.variable.set',
  MATH_OPERATION = 'data.math.operation',
  STRING_OPERATION = 'data.string.operation',
  ARRAY_OPERATION = 'data.array.operation',
  DATE_OPERATION = 'data.date.operation',

  // External Integration Actions
  WEBHOOK = 'external.webhook',
  HTTP_REQUEST = 'external.http.request',
  ZAPIER = 'external.zapier',
  CUSTOM_CODE = 'external.custom_code',

  // AI Actions
  AI_RESPONSE = 'ai.response',
  AI_SENTIMENT_ANALYSIS = 'ai.sentiment',
  AI_CLASSIFICATION = 'ai.classification',
  AI_APPOINTMENT_BOOKING = 'ai.appointment.book',

  // Appointment Actions
  CREATE_APPOINTMENT = 'appointment.create',
  CANCEL_APPOINTMENT = 'appointment.cancel',
  RESCHEDULE_APPOINTMENT = 'appointment.reschedule',
  SEND_APPOINTMENT_REMINDER = 'appointment.reminder.send',

  // Payment Actions
  CREATE_INVOICE = 'payment.invoice.create',
  SEND_PAYMENT_LINK = 'payment.link.send',
  PROCESS_PAYMENT = 'payment.process',
  REFUND_PAYMENT = 'payment.refund',
  SUBSCRIBE_TO_PLAN = 'payment.subscription.create',
  CANCEL_SUBSCRIPTION = 'payment.subscription.cancel',

  // Marketing Actions
  ADD_TO_CAMPAIGN = 'marketing.campaign.add',
  REMOVE_FROM_CAMPAIGN = 'marketing.campaign.remove',
  TRACK_EVENT = 'marketing.event.track',

  // Notification Actions
  SEND_INTERNAL_NOTIFICATION = 'notification.internal.send',
  SEND_SLACK_MESSAGE = 'notification.slack.send',
  SEND_TEAMS_MESSAGE = 'notification.teams.send',
}

// ============================================================================
// ACTION CONFIGURATIONS
// ============================================================================

export type ActionConfig =
  | CommunicationActionConfig
  | CRMActionConfig
  | InternalActionConfig
  | DataActionConfig
  | ExternalActionConfig
  | AIActionConfig
  | AppointmentActionConfig
  | PaymentActionConfig
  | MarketingActionConfig
  | NotificationActionConfig;

// ============================================================================
// COMMUNICATION ACTIONS
// ============================================================================

export interface CommunicationActionConfig {
  actionCategory: 'communication';
}

export interface SendEmailConfig extends CommunicationActionConfig {
  type: 'email';

  // Email content
  from?: {
    email: string;
    name?: string;
  };
  to: string | string[]; // Email addresses or variables like {{contact.email}}
  cc?: string[];
  bcc?: string[];

  subject: string;
  body: string; // HTML or plain text with variables
  bodyType: 'html' | 'text';

  // Template
  templateId?: string;
  templateVariables?: Record<string, any>;

  // Attachments
  attachments?: EmailAttachment[];

  // Tracking
  trackOpens?: boolean;
  trackClicks?: boolean;

  // Reply settings
  replyTo?: string;
}

export interface SendSMSConfig extends CommunicationActionConfig {
  type: 'sms';

  // Phone number
  to: string; // Phone number or variable like {{contact.phone}}
  from?: string; // Sender ID or phone number

  // Message
  message: string; // With variable support
  maxLength?: number;

  // Media (MMS)
  mediaUrls?: string[];
}

export interface SendWhatsAppConfig extends CommunicationActionConfig {
  type: 'whatsapp';

  to: string;
  messageType: 'text' | 'template' | 'media' | 'interactive';

  // Text message
  text?: string;

  // Template message
  templateId?: string;
  templateParameters?: Record<string, any>;

  // Media message
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document' | 'audio';
  caption?: string;
}

export interface MakeCallConfig extends CommunicationActionConfig {
  type: 'call';

  to: string;
  from?: string;

  // Call type
  callType: 'power_dial' | 'predictive' | 'preview';

  // Voice message
  voiceMessage?: string;
  voiceMessageUrl?: string;

  // Agent assignment
  assignToUserId?: string;
  assignToTeamId?: string;

  // Call script
  callScriptId?: string;
}

export interface DropVoicemailConfig extends CommunicationActionConfig {
  type: 'voicemail';

  to: string;
  audioUrl: string;

  // Fallback if voicemail not available
  fallbackAction?: 'skip' | 'leave_message' | 'send_sms';
}

export interface EmailAttachment {
  filename: string;
  url?: string;
  content?: string; // Base64 encoded
  contentType?: string;
}

// ============================================================================
// CRM ACTIONS
// ============================================================================

export interface CRMActionConfig {
  actionCategory: 'crm';
}

export interface AddTagConfig extends CRMActionConfig {
  type: 'tag.add';
  tags: string[];
}

export interface RemoveTagConfig extends CRMActionConfig {
  type: 'tag.remove';
  tags: string[];
}

export interface UpdateContactConfig extends CRMActionConfig {
  type: 'contact.update';

  fields: Record<string, any>; // Field name -> value mapping

  // Special operations
  appendToField?: Record<string, any>; // Append instead of replace
  removeFromField?: Record<string, any>; // Remove from array fields
}

export interface CreateOpportunityConfig extends CRMActionConfig {
  type: 'opportunity.create';

  name: string;
  pipelineId: string;
  stageId: string;

  value?: number;
  probability?: number;

  assignedTo?: string;

  customFields?: Record<string, any>;
}

export interface UpdateOpportunityConfig extends CRMActionConfig {
  type: 'opportunity.update';

  opportunityId?: string; // If not provided, use from context

  fields: Record<string, any>;
}

export interface MoveOpportunityStageConfig extends CRMActionConfig {
  type: 'opportunity.move_stage';

  opportunityId?: string;
  stageId: string;
}

export interface AssignToUserConfig extends CRMActionConfig {
  type: 'assign.user';

  userId: string;
  entityType: 'contact' | 'opportunity' | 'appointment';
  entityId?: string;
}

export interface AddNoteConfig extends CRMActionConfig {
  type: 'note.add';

  content: string;
  entityType: 'contact' | 'opportunity';
  entityId?: string;
}

export interface CreateTaskConfig extends CRMActionConfig {
  type: 'task.create';

  title: string;
  description?: string;

  assignedTo?: string;
  dueDate?: string; // ISO date or relative like "+2 days"

  priority?: 'low' | 'medium' | 'high';
}

// ============================================================================
// INTERNAL FLOW ACTIONS
// ============================================================================

export interface InternalActionConfig {
  actionCategory: 'internal';
}

export interface WaitConfig extends InternalActionConfig {
  type: 'wait';

  waitType: 'duration' | 'until_date' | 'until_condition';

  // Duration wait
  duration?: {
    amount: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  };

  // Date wait
  waitUntil?: string; // ISO date or field reference like {{contact.nextContactDate}}

  // Condition wait (max timeout required)
  condition?: ConditionGroup;
  maxWaitDuration?: {
    amount: number;
    unit: 'hours' | 'days' | 'weeks';
  };
}

export interface IfElseConfig extends InternalActionConfig {
  type: 'if_else';

  condition: ConditionGroup;

  // Branch paths
  trueBranch: string[]; // Action IDs
  falseBranch: string[]; // Action IDs
}

export interface SplitConfig extends InternalActionConfig {
  type: 'split';

  splitType: 'percentage' | 'conditional';

  // Percentage split (A/B testing)
  branches?: {
    id: string;
    name: string;
    percentage: number;
    actions: string[]; // Action IDs
  }[];

  // Conditional split
  conditionalBranches?: {
    id: string;
    name: string;
    condition: ConditionGroup;
    actions: string[];
  }[];

  // Default branch if no conditions match
  defaultBranch?: string[];
}

export interface GoToConfig extends InternalActionConfig {
  type: 'goto';

  targetActionId: string;

  // Loop prevention
  maxIterations?: number;
}

export interface RandomPathConfig extends InternalActionConfig {
  type: 'random';

  paths: {
    id: string;
    weight: number; // Relative weight for random selection
    actions: string[];
  }[];
}

// ============================================================================
// DATA ACTIONS
// ============================================================================

export interface DataActionConfig {
  actionCategory: 'data';
}

export interface SetVariableConfig extends DataActionConfig {
  type: 'variable.set';

  variableName: string;
  value: any; // Can include expressions like "{{contact.firstName}} {{contact.lastName}}"
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
}

export interface MathOperationConfig extends DataActionConfig {
  type: 'math.operation';

  operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'modulo' | 'power' | 'round' | 'ceil' | 'floor';
  operand1: number | string; // Can be variable reference
  operand2?: number | string;

  // Store result
  resultVariable: string;
}

export interface StringOperationConfig extends DataActionConfig {
  type: 'string.operation';

  operation: 'concat' | 'substring' | 'replace' | 'uppercase' | 'lowercase' | 'trim' | 'split';

  input: string; // Can be variable reference
  parameters?: Record<string, any>;

  // Store result
  resultVariable: string;
}

export interface DateOperationConfig extends DataActionConfig {
  type: 'date.operation';

  operation: 'add' | 'subtract' | 'format' | 'parse' | 'diff';

  date: string; // ISO date or variable
  parameters?: Record<string, any>;

  resultVariable: string;
}

// ============================================================================
// EXTERNAL INTEGRATION ACTIONS
// ============================================================================

export interface ExternalActionConfig {
  actionCategory: 'external';
}

export interface WebhookConfig extends ExternalActionConfig {
  type: 'webhook';

  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  headers?: Record<string, string>;
  body?: Record<string, any> | string;

  // Authentication
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2';
    credentials?: Record<string, string>;
  };

  // Response handling
  responseMapping?: {
    field: string; // Field in response
    variable: string; // Variable to store in
  }[];

  successCriteria?: {
    statusCode?: number[];
    responseContains?: string;
  };
}

export interface CustomCodeConfig extends ExternalActionConfig {
  type: 'custom_code';

  code: string; // JavaScript code
  language: 'javascript' | 'typescript';

  // Input variables available in code
  inputVariables?: string[];

  // Output variable to store result
  outputVariable?: string;

  // Execution limits
  timeout?: number; // milliseconds
  maxMemory?: number; // bytes
}

// ============================================================================
// AI ACTIONS
// ============================================================================

export interface AIActionConfig {
  actionCategory: 'ai';
}

export interface AIResponseConfig extends AIActionConfig {
  type: 'ai.response';

  prompt: string; // Prompt template with variables
  model?: string; // GPT-4, Claude, etc.

  // Context
  includeConversationHistory?: boolean;
  maxContextLength?: number;

  // Response handling
  responseVariable: string;
  autoSend?: boolean; // Auto-send response via SMS/Email

  // Action based on response
  conditionalActions?: {
    condition: ConditionGroup;
    actions: string[];
  }[];
}

export interface AISentimentAnalysisConfig extends AIActionConfig {
  type: 'ai.sentiment';

  text: string; // Text to analyze or variable reference

  resultVariable: string; // Stores: positive, negative, neutral
}

export interface AIClassificationConfig extends AIActionConfig {
  type: 'ai.classification';

  text: string;
  categories: string[];

  resultVariable: string;
}

export interface AIAppointmentBookingConfig extends AIActionConfig {
  type: 'ai.appointment.book';

  conversationVariable: string; // Variable containing conversation
  calendarId: string;

  autoConfirm?: boolean;
  confirmationMessage?: string;
}

// ============================================================================
// APPOINTMENT ACTIONS
// ============================================================================

export interface AppointmentActionConfig {
  actionCategory: 'appointment';
}

export interface CreateAppointmentConfig extends AppointmentActionConfig {
  type: 'appointment.create';

  calendarId: string;
  appointmentTypeId?: string;

  title: string;
  description?: string;

  // Date/time
  startTime: string; // ISO date or variable
  endTime?: string;
  duration?: number; // minutes

  // Attendees
  contactId?: string;
  assignedTo?: string;

  // Location
  location?: string;
  locationType?: 'physical' | 'phone' | 'video';
  videoMeetingUrl?: string;
}

export interface CancelAppointmentConfig extends AppointmentActionConfig {
  type: 'appointment.cancel';

  appointmentId?: string; // If not provided, use from context

  reason?: string;
  notifyContact?: boolean;
}

// ============================================================================
// PAYMENT ACTIONS
// ============================================================================

export interface PaymentActionConfig {
  actionCategory: 'payment';
}

export interface CreateInvoiceConfig extends PaymentActionConfig {
  type: 'invoice.create';

  contactId?: string;

  items: {
    description: string;
    amount: number;
    quantity?: number;
  }[];

  dueDate?: string;
  notes?: string;

  autoSend?: boolean;
}

export interface SendPaymentLinkConfig extends PaymentActionConfig {
  type: 'payment.link.send';

  amount: number;
  description: string;

  // Delivery
  sendVia: 'email' | 'sms' | 'both';

  // Payment options
  allowedPaymentMethods?: ('card' | 'bank' | 'paypal')[];

  expiryDate?: string;
}

// ============================================================================
// MARKETING ACTIONS
// ============================================================================

export interface MarketingActionConfig {
  actionCategory: 'marketing';
}

export interface AddToCampaignConfig extends MarketingActionConfig {
  type: 'campaign.add';

  campaignId: string;
}

export interface TrackEventConfig extends MarketingActionConfig {
  type: 'event.track';

  eventName: string;
  properties?: Record<string, any>;
}

// ============================================================================
// NOTIFICATION ACTIONS
// ============================================================================

export interface NotificationActionConfig {
  actionCategory: 'notification';
}

export interface SendInternalNotificationConfig extends NotificationActionConfig {
  type: 'internal.send';

  recipientUserIds?: string[];
  recipientTeamIds?: string[];

  title: string;
  message: string;

  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
}

export interface SendSlackMessageConfig extends NotificationActionConfig {
  type: 'slack.send';

  channel: string; // Channel ID or name
  message: string;

  // Slack-specific formatting
  blocks?: any[]; // Slack Block Kit
  attachments?: any[];
}
