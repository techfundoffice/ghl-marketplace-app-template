/**
 * Workflow Automation Engine - Core Type Definitions
 * Event-driven workflow automation system for GoHighLevel clone
 */

// ============================================================================
// CORE WORKFLOW TYPES
// ============================================================================

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  WAITING = 'waiting',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export interface Workflow {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: WorkflowStatus;

  // Workflow configuration
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  goals?: WorkflowGoal[];

  // Enrollment settings
  enrollmentSettings: EnrollmentSettings;

  // Metadata
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  // Analytics
  stats: WorkflowStats;
}

export interface EnrollmentSettings {
  // Who can enter
  allowMultipleEnrollments: boolean;
  enrollmentLimit?: number; // Max times a contact can enter
  enrollmentWindow?: {
    amount: number;
    unit: 'hours' | 'days' | 'weeks' | 'months';
  };

  // Entry conditions
  entryConditions?: ConditionGroup;

  // Exit conditions
  exitConditions?: ConditionGroup;
  removeOnGoalAchievement?: boolean;

  // Re-enrollment
  reEnrollmentDelay?: {
    amount: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
}

export interface WorkflowStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  failedEnrollments: number;
  goalAchievements: number;
  averageCompletionTime?: number; // milliseconds
}

// ============================================================================
// WORKFLOW EXECUTION
// ============================================================================

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: number;

  // Contact information
  contactId: string;
  organizationId: string;

  // Execution state
  status: ExecutionStatus;
  currentStepId?: string;

  // State machine
  state: WorkflowState;
  context: ExecutionContext;

  // Timeline
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Goal tracking
  goalsAchieved: string[];

  // Error handling
  errors: ExecutionError[];
  retryCount: number;

  // Metadata
  metadata?: Record<string, any>;
}

export interface WorkflowState {
  // Current position in workflow
  currentNodeId: string;
  visitedNodes: string[];

  // Execution path
  executionPath: ExecutionPathNode[];

  // Wait states
  waitingUntil?: Date;
  waitReason?: string;

  // Branch tracking
  activeBranches: string[];

  // Step results
  stepResults: Map<string, StepResult>;
}

export interface ExecutionContext {
  // Contact data snapshot
  contact: ContactSnapshot;

  // Trigger data
  triggerData: Record<string, any>;

  // Custom variables
  variables: Map<string, any>;

  // Accumulated data from actions
  actionResults: Map<string, any>;

  // External data
  externalData?: Record<string, any>;
}

export interface ExecutionPathNode {
  stepId: string;
  stepType: string;
  timestamp: Date;
  result: StepResult;
  branches?: string[];
}

export interface StepResult {
  status: StepStatus;
  output?: any;
  error?: ExecutionError;
  startedAt: Date;
  completedAt?: Date;
  executionTime?: number; // milliseconds
}

export interface ExecutionError {
  stepId: string;
  timestamp: Date;
  error: string;
  errorCode?: string;
  retryable: boolean;
  retryCount: number;
  stackTrace?: string;
}

export interface ContactSnapshot {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  tags: string[];
  customFields: Record<string, any>;
  dnd: boolean;
  capturedAt: Date;
}

// ============================================================================
// WORKFLOW GOALS
// ============================================================================

export interface WorkflowGoal {
  id: string;
  name: string;
  description?: string;
  conditions: ConditionGroup;

  // Goal actions
  onAchievement: GoalAchievementAction;
}

export enum GoalAchievementAction {
  CONTINUE = 'continue', // Continue workflow
  EXIT = 'exit', // Exit workflow
  GOTO = 'goto', // Go to specific step
}

// ============================================================================
// CONDITION SYSTEM
// ============================================================================

export interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: (Condition | ConditionGroup)[];
}

export interface Condition {
  field: string; // e.g., "contact.email", "trigger.formId"
  operator: ConditionOperator;
  value: any;
  dataType?: DataType;
}

export enum ConditionOperator {
  // Comparison
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',

  // String
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  MATCHES_REGEX = 'matches_regex',

  // Array
  IN = 'in',
  NOT_IN = 'not_in',
  INCLUDES = 'includes',
  NOT_INCLUDES = 'not_includes',

  // Existence
  EXISTS = 'exists',
  NOT_EXISTS = 'not_exists',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',

  // Date
  BEFORE_DATE = 'before_date',
  AFTER_DATE = 'after_date',
  BETWEEN_DATES = 'between_dates',
  OLDER_THAN = 'older_than',
  NEWER_THAN = 'newer_than',
}

export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ARRAY = 'array',
  OBJECT = 'object',
}

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

export interface RetryConfig {
  enabled: boolean;
  maxAttempts: number;
  backoffStrategy: BackoffStrategy;
  retryableErrors?: string[]; // Specific error codes to retry
  retryDelay?: {
    initial: number; // milliseconds
    max: number; // milliseconds
    multiplier: number; // for exponential backoff
  };
}

export enum BackoffStrategy {
  FIXED = 'fixed',
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
}

// ============================================================================
// WORKFLOW GRAPH STRUCTURE
// ============================================================================

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'wait';
  config: any;

  // Graph connections
  next?: string[]; // Next node IDs

  // Position (for UI)
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string; // Source node ID
  target: string; // Target node ID
  label?: string; // For condition branches: "Yes", "No", etc.
  condition?: ConditionGroup; // For conditional edges
}
