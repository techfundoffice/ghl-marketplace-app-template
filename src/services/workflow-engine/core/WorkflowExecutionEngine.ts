/**
 * Workflow Execution Engine
 * State machine-based workflow executor with event-driven architecture
 */

import { EventEmitter } from 'events';
import {
  Workflow,
  WorkflowExecution,
  ExecutionStatus,
  WorkflowState,
  ExecutionContext,
  StepResult,
  StepStatus,
  ExecutionError,
} from '../types/workflow.types';
import { WorkflowAction, ActionType } from '../types/action.types';
import { TriggerEvent } from '../types/trigger.types';

export interface ExecutionEngineConfig {
  // Redis/RabbitMQ configuration
  messageQueue: MessageQueueAdapter;

  // Action executors
  actionExecutors: Map<ActionType, ActionExecutor>;

  // Persistence
  executionStore: ExecutionStore;
  workflowStore: WorkflowStore;

  // Monitoring
  metricsCollector?: MetricsCollector;
}

export interface MessageQueueAdapter {
  publish(topic: string, message: any): Promise<void>;
  subscribe(topic: string, handler: (message: any) => Promise<void>): Promise<void>;
  scheduleDelayed(topic: string, message: any, delayMs: number): Promise<void>;
}

export interface ActionExecutor {
  execute(action: WorkflowAction, context: ExecutionContext): Promise<StepResult>;
  validate(action: WorkflowAction): Promise<boolean>;
}

export interface ExecutionStore {
  save(execution: WorkflowExecution): Promise<void>;
  get(executionId: string): Promise<WorkflowExecution | null>;
  update(executionId: string, updates: Partial<WorkflowExecution>): Promise<void>;
  listByWorkflow(workflowId: string, status?: ExecutionStatus): Promise<WorkflowExecution[]>;
  listByContact(contactId: string, status?: ExecutionStatus): Promise<WorkflowExecution[]>;
}

export interface WorkflowStore {
  get(workflowId: string): Promise<Workflow | null>;
  getByTrigger(triggerType: string): Promise<Workflow[]>;
}

export interface MetricsCollector {
  recordExecution(execution: WorkflowExecution): void;
  recordStepExecution(executionId: string, step: StepResult): void;
  recordError(error: ExecutionError): void;
}

/**
 * Main Workflow Execution Engine
 * Implements state machine pattern with event-driven execution
 */
export class WorkflowExecutionEngine extends EventEmitter {
  private config: ExecutionEngineConfig;
  private activeExecutions: Map<string, WorkflowExecution> = new Map();

  constructor(config: ExecutionEngineConfig) {
    super();
    this.config = config;
    this.setupMessageQueueHandlers();
  }

  /**
   * Initialize workflow execution from trigger event
   */
  async initiateFromTrigger(
    workflow: Workflow,
    triggerEvent: TriggerEvent
  ): Promise<WorkflowExecution> {
    // Check enrollment eligibility
    const canEnroll = await this.checkEnrollmentEligibility(
      workflow,
      triggerEvent.contactId
    );

    if (!canEnroll.allowed) {
      this.emit('enrollment:blocked', {
        workflowId: workflow.id,
        contactId: triggerEvent.contactId,
        reason: canEnroll.reason,
      });
      throw new Error(`Enrollment blocked: ${canEnroll.reason}`);
    }

    // Create execution
    const execution = await this.createExecution(workflow, triggerEvent);

    // Save execution
    await this.config.executionStore.save(execution);

    // Start execution asynchronously
    await this.config.messageQueue.publish('workflow:execution:start', {
      executionId: execution.id,
    });

    this.emit('execution:created', execution);

    return execution;
  }

  /**
   * Start or resume workflow execution
   */
  async executeWorkflow(executionId: string): Promise<void> {
    // Load execution
    let execution = await this.config.executionStore.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    // Check if waiting
    if (execution.status === ExecutionStatus.WAITING) {
      if (
        execution.state.waitingUntil &&
        new Date() < execution.state.waitingUntil
      ) {
        // Still waiting, reschedule
        await this.scheduleWaitResume(execution);
        return;
      }
    }

    // Update status to running
    execution.status = ExecutionStatus.RUNNING;
    await this.config.executionStore.update(executionId, {
      status: ExecutionStatus.RUNNING,
    });

    this.activeExecutions.set(executionId, execution);

    try {
      // Load workflow
      const workflow = await this.config.workflowStore.get(execution.workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${execution.workflowId}`);
      }

      // Execute state machine
      await this.executeStateMachine(execution, workflow);
    } catch (error) {
      await this.handleExecutionError(execution, error as Error);
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * State machine execution loop
   */
  private async executeStateMachine(
    execution: WorkflowExecution,
    workflow: Workflow
  ): Promise<void> {
    let currentStepId = execution.state.currentNodeId;

    while (currentStepId) {
      // Find current action
      const action = workflow.actions.find((a) => a.id === currentStepId);
      if (!action) {
        throw new Error(`Action not found: ${currentStepId}`);
      }

      // Check if already completed (resuming from wait)
      if (execution.state.stepResults.has(currentStepId)) {
        const previousResult = execution.state.stepResults.get(currentStepId);
        if (previousResult?.status === StepStatus.COMPLETED) {
          // Move to next step
          currentStepId = this.getNextStep(action, previousResult);
          continue;
        }
      }

      // Execute step
      const stepResult = await this.executeStep(execution, action);

      // Update execution state
      execution.state.stepResults.set(currentStepId, stepResult);
      execution.state.visitedNodes.push(currentStepId);
      execution.state.executionPath.push({
        stepId: currentStepId,
        stepType: action.type,
        timestamp: new Date(),
        result: stepResult,
      });

      // Save progress
      await this.config.executionStore.update(execution.id, {
        state: execution.state,
      });

      // Handle step result
      if (stepResult.status === StepStatus.FAILED) {
        // Check retry logic
        if (await this.shouldRetry(action, execution)) {
          await this.scheduleRetry(execution, action);
          return;
        } else {
          await this.handleExecutionError(execution, new Error(stepResult.error?.error || 'Step failed'));
          return;
        }
      }

      // Check for wait state
      if (action.type === ActionType.WAIT) {
        execution.status = ExecutionStatus.WAITING;
        await this.scheduleWaitResume(execution);
        return;
      }

      // Check goals
      const goalAchieved = await this.checkGoals(execution, workflow);
      if (goalAchieved) {
        await this.completeExecution(execution, 'goal_achieved');
        return;
      }

      // Determine next step
      currentStepId = this.getNextStep(action, stepResult);

      // Check for end of workflow
      if (!currentStepId) {
        await this.completeExecution(execution, 'completed');
        return;
      }

      // Handle branching
      if (this.isBranchingAction(action)) {
        await this.handleBranching(execution, action, stepResult);
        return; // Branching creates separate execution paths
      }

      // Update current step
      execution.state.currentNodeId = currentStepId;
    }

    // Workflow completed
    await this.completeExecution(execution, 'completed');
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    execution: WorkflowExecution,
    action: WorkflowAction
  ): Promise<StepResult> {
    const startTime = Date.now();

    try {
      // Check conditional execution
      if (action.executeIf) {
        const conditionMet = await this.evaluateCondition(
          action.executeIf,
          execution.context
        );
        if (!conditionMet) {
          return {
            status: StepStatus.SKIPPED,
            startedAt: new Date(),
            completedAt: new Date(),
            executionTime: 0,
          };
        }
      }

      // Get executor
      const executor = this.config.actionExecutors.get(action.type);
      if (!executor) {
        throw new Error(`No executor found for action type: ${action.type}`);
      }

      // Execute action with timeout
      const result = await this.executeWithTimeout(
        executor.execute(action, execution.context),
        action.timeout || 30000
      );

      // Record metrics
      this.config.metricsCollector?.recordStepExecution(execution.id, result);

      this.emit('step:completed', {
        executionId: execution.id,
        stepId: action.id,
        result,
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const stepError: ExecutionError = {
        stepId: action.id,
        timestamp: new Date(),
        error: (error as Error).message,
        retryable: this.isRetryableError(error as Error),
        retryCount: execution.retryCount,
        stackTrace: (error as Error).stack,
      };

      execution.errors.push(stepError);
      this.config.metricsCollector?.recordError(stepError);

      this.emit('step:failed', {
        executionId: execution.id,
        stepId: action.id,
        error: stepError,
      });

      return {
        status: StepStatus.FAILED,
        error: stepError,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        executionTime,
      };
    }
  }

  /**
   * Check if contact can be enrolled in workflow
   */
  private async checkEnrollmentEligibility(
    workflow: Workflow,
    contactId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const settings = workflow.enrollmentSettings;

    // Check multiple enrollments
    if (!settings.allowMultipleEnrollments) {
      const existingExecutions = await this.config.executionStore.listByContact(
        contactId
      );
      const hasActiveExecution = existingExecutions.some(
        (e) =>
          e.workflowId === workflow.id &&
          (e.status === ExecutionStatus.RUNNING ||
            e.status === ExecutionStatus.WAITING)
      );

      if (hasActiveExecution) {
        return {
          allowed: false,
          reason: 'Contact already enrolled in workflow',
        };
      }
    }

    // Check enrollment limit
    if (settings.enrollmentLimit) {
      const allExecutions = await this.config.executionStore.listByContact(
        contactId
      );
      const workflowExecutions = allExecutions.filter(
        (e) => e.workflowId === workflow.id
      );

      if (workflowExecutions.length >= settings.enrollmentLimit) {
        return {
          allowed: false,
          reason: `Enrollment limit reached (${settings.enrollmentLimit})`,
        };
      }
    }

    // Check re-enrollment delay
    if (settings.reEnrollmentDelay) {
      const recentExecutions = await this.config.executionStore.listByContact(
        contactId
      );
      const lastExecution = recentExecutions
        .filter((e) => e.workflowId === workflow.id)
        .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0];

      if (lastExecution?.completedAt) {
        const delayMs = this.convertToMilliseconds(
          settings.reEnrollmentDelay.amount,
          settings.reEnrollmentDelay.unit
        );
        const nextAllowedTime = new Date(
          lastExecution.completedAt.getTime() + delayMs
        );

        if (new Date() < nextAllowedTime) {
          return {
            allowed: false,
            reason: `Re-enrollment delay not met (available after ${nextAllowedTime.toISOString()})`,
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Create new workflow execution
   */
  private async createExecution(
    workflow: Workflow,
    triggerEvent: TriggerEvent
  ): Promise<WorkflowExecution> {
    const executionId = this.generateExecutionId();
    const firstActionId = workflow.actions[0]?.id;

    if (!firstActionId) {
      throw new Error('Workflow has no actions');
    }

    return {
      id: executionId,
      workflowId: workflow.id,
      workflowVersion: workflow.version,
      contactId: triggerEvent.contactId,
      organizationId: workflow.organizationId,
      status: ExecutionStatus.PENDING,
      currentStepId: firstActionId,
      state: {
        currentNodeId: firstActionId,
        visitedNodes: [],
        executionPath: [],
        activeBranches: [],
        stepResults: new Map(),
      },
      context: {
        contact: await this.captureContactSnapshot(triggerEvent.contactId),
        triggerData: triggerEvent.payload,
        variables: new Map(),
        actionResults: new Map(),
      },
      goalsAchieved: [],
      errors: [],
      retryCount: 0,
      enrolledAt: new Date(),
    };
  }

  /**
   * Complete workflow execution
   */
  private async completeExecution(
    execution: WorkflowExecution,
    reason: string
  ): Promise<void> {
    execution.status = ExecutionStatus.COMPLETED;
    execution.completedAt = new Date();

    await this.config.executionStore.update(execution.id, {
      status: ExecutionStatus.COMPLETED,
      completedAt: execution.completedAt,
    });

    this.emit('execution:completed', {
      executionId: execution.id,
      reason,
    });

    this.config.metricsCollector?.recordExecution(execution);
  }

  /**
   * Handle execution error
   */
  private async handleExecutionError(
    execution: WorkflowExecution,
    error: Error
  ): Promise<void> {
    execution.status = ExecutionStatus.FAILED;

    const executionError: ExecutionError = {
      stepId: execution.state.currentNodeId,
      timestamp: new Date(),
      error: error.message,
      retryable: false,
      retryCount: execution.retryCount,
      stackTrace: error.stack,
    };

    execution.errors.push(executionError);

    await this.config.executionStore.update(execution.id, {
      status: ExecutionStatus.FAILED,
      errors: execution.errors,
    });

    this.emit('execution:failed', {
      executionId: execution.id,
      error: executionError,
    });

    this.config.metricsCollector?.recordError(executionError);
  }

  /**
   * Setup message queue handlers
   */
  private setupMessageQueueHandlers(): void {
    this.config.messageQueue.subscribe(
      'workflow:execution:start',
      async (message) => {
        await this.executeWorkflow(message.executionId);
      }
    );

    this.config.messageQueue.subscribe(
      'workflow:execution:resume',
      async (message) => {
        await this.executeWorkflow(message.executionId);
      }
    );
  }

  /**
   * Schedule wait resume
   */
  private async scheduleWaitResume(execution: WorkflowExecution): Promise<void> {
    if (!execution.state.waitingUntil) {
      throw new Error('No wait time specified');
    }

    const delayMs =
      execution.state.waitingUntil.getTime() - Date.now();

    await this.config.messageQueue.scheduleDelayed(
      'workflow:execution:resume',
      { executionId: execution.id },
      delayMs
    );

    await this.config.executionStore.update(execution.id, {
      status: ExecutionStatus.WAITING,
      state: execution.state,
    });

    this.emit('execution:waiting', {
      executionId: execution.id,
      waitingUntil: execution.state.waitingUntil,
    });
  }

  // Helper methods (implementation details omitted for brevity)
  private getNextStep(action: WorkflowAction, result: StepResult): string | null {
    if (result.status === StepStatus.COMPLETED && action.onSuccess) {
      return action.onSuccess[0] || null;
    }
    if (result.status === StepStatus.FAILED && action.onFailure) {
      return action.onFailure[0] || null;
    }
    return null;
  }

  private async evaluateCondition(
    condition: any,
    context: ExecutionContext
  ): Promise<boolean> {
    // Condition evaluation logic
    return true;
  }

  private async shouldRetry(
    action: WorkflowAction,
    execution: WorkflowExecution
  ): Promise<boolean> {
    if (!action.retryConfig?.enabled) return false;
    return execution.retryCount < action.retryConfig.maxAttempts;
  }

  private async scheduleRetry(
    execution: WorkflowExecution,
    action: WorkflowAction
  ): Promise<void> {
    // Retry scheduling logic
  }

  private async checkGoals(
    execution: WorkflowExecution,
    workflow: Workflow
  ): Promise<boolean> {
    // Goal checking logic
    return false;
  }

  private isBranchingAction(action: WorkflowAction): boolean {
    return [ActionType.IF_ELSE, ActionType.SPLIT, ActionType.RANDOM_PATH].includes(
      action.type
    );
  }

  private async handleBranching(
    execution: WorkflowExecution,
    action: WorkflowAction,
    result: StepResult
  ): Promise<void> {
    // Branching logic
  }

  private isRetryableError(error: Error): boolean {
    // Determine if error is retryable
    return true;
  }

  private executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), timeoutMs)
      ),
    ]);
  }

  private async captureContactSnapshot(contactId: string): Promise<any> {
    // Capture contact data
    return {};
  }

  private convertToMilliseconds(amount: number, unit: string): number {
    const multipliers: Record<string, number> = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000,
      months: 30 * 24 * 60 * 60 * 1000,
    };
    return amount * (multipliers[unit] || 1000);
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
