/**
 * Wait Scheduler - Handles wait steps and delayed execution
 */

import { EventEmitter } from 'events';
import {
  WorkflowExecution,
  ExecutionContext,
  StepResult,
  StepStatus,
} from '../types/workflow.types';
import { WaitConfig } from '../types/action.types';
import { RedisMessageQueue } from '../events/MessageQueueService';

export interface WaitSchedulerConfig {
  messageQueue: RedisMessageQueue;
  checkInterval?: number; // ms, for condition-based waits
}

export interface ScheduledWait {
  executionId: string;
  stepId: string;
  waitConfig: WaitConfig;
  scheduledAt: Date;
  resumeAt?: Date;
  condition?: any;
  status: 'scheduled' | 'waiting' | 'completed' | 'timeout';
}

/**
 * Wait Scheduler
 * Manages wait steps with duration, date, and condition-based waits
 */
export class WaitScheduler extends EventEmitter {
  private config: WaitSchedulerConfig;
  private activeWaits: Map<string, ScheduledWait> = new Map();
  private conditionCheckInterval?: NodeJS.Timeout;

  constructor(config: WaitSchedulerConfig) {
    super();
    this.config = config;

    if (config.checkInterval) {
      this.startConditionChecker(config.checkInterval);
    }
  }

  /**
   * Schedule wait step
   */
  async scheduleWait(
    execution: WorkflowExecution,
    stepId: string,
    waitConfig: WaitConfig,
    context: ExecutionContext
  ): Promise<ScheduledWait> {
    const scheduledWait: ScheduledWait = {
      executionId: execution.id,
      stepId,
      waitConfig,
      scheduledAt: new Date(),
      status: 'scheduled',
    };

    switch (waitConfig.waitType) {
      case 'duration':
        return await this.scheduleDurationWait(scheduledWait, waitConfig);

      case 'until_date':
        return await this.scheduleDateWait(scheduledWait, waitConfig, context);

      case 'until_condition':
        return await this.scheduleConditionWait(
          scheduledWait,
          waitConfig,
          context
        );

      default:
        throw new Error(`Unknown wait type: ${waitConfig.waitType}`);
    }
  }

  /**
   * Schedule duration-based wait
   */
  private async scheduleDurationWait(
    scheduledWait: ScheduledWait,
    waitConfig: WaitConfig
  ): Promise<ScheduledWait> {
    if (!waitConfig.duration) {
      throw new Error('Duration not specified for duration wait');
    }

    const delayMs = this.convertToMilliseconds(
      waitConfig.duration.amount,
      waitConfig.duration.unit
    );

    const resumeAt = new Date(Date.now() + delayMs);
    scheduledWait.resumeAt = resumeAt;
    scheduledWait.status = 'waiting';

    // Schedule resume via message queue
    await this.config.messageQueue.scheduleDelayed(
      'workflow:wait:resume',
      {
        executionId: scheduledWait.executionId,
        stepId: scheduledWait.stepId,
      },
      delayMs
    );

    this.activeWaits.set(scheduledWait.executionId, scheduledWait);

    this.emit('wait:scheduled', scheduledWait);

    return scheduledWait;
  }

  /**
   * Schedule date-based wait
   */
  private async scheduleDateWait(
    scheduledWait: ScheduledWait,
    waitConfig: WaitConfig,
    context: ExecutionContext
  ): Promise<ScheduledWait> {
    if (!waitConfig.waitUntil) {
      throw new Error('Wait until date not specified');
    }

    // Parse date (could be ISO string or field reference)
    const resumeAt = this.parseDate(waitConfig.waitUntil, context);

    if (resumeAt <= new Date()) {
      // Date already passed, resume immediately
      scheduledWait.status = 'completed';
      return scheduledWait;
    }

    scheduledWait.resumeAt = resumeAt;
    scheduledWait.status = 'waiting';

    const delayMs = resumeAt.getTime() - Date.now();

    // Schedule resume
    await this.config.messageQueue.scheduleDelayed(
      'workflow:wait:resume',
      {
        executionId: scheduledWait.executionId,
        stepId: scheduledWait.stepId,
      },
      delayMs
    );

    this.activeWaits.set(scheduledWait.executionId, scheduledWait);

    this.emit('wait:scheduled', scheduledWait);

    return scheduledWait;
  }

  /**
   * Schedule condition-based wait
   */
  private async scheduleConditionWait(
    scheduledWait: ScheduledWait,
    waitConfig: WaitConfig,
    context: ExecutionContext
  ): Promise<ScheduledWait> {
    if (!waitConfig.condition) {
      throw new Error('Condition not specified for condition wait');
    }

    scheduledWait.condition = waitConfig.condition;
    scheduledWait.status = 'waiting';

    // Calculate max wait timeout
    if (waitConfig.maxWaitDuration) {
      const timeoutMs = this.convertToMilliseconds(
        waitConfig.maxWaitDuration.amount,
        waitConfig.maxWaitDuration.unit
      );

      const timeoutAt = new Date(Date.now() + timeoutMs);

      // Schedule timeout
      await this.config.messageQueue.scheduleDelayed(
        'workflow:wait:timeout',
        {
          executionId: scheduledWait.executionId,
          stepId: scheduledWait.stepId,
        },
        timeoutMs
      );

      this.emit('wait:timeout_scheduled', {
        executionId: scheduledWait.executionId,
        timeoutAt,
      });
    }

    this.activeWaits.set(scheduledWait.executionId, scheduledWait);

    this.emit('wait:scheduled', scheduledWait);

    return scheduledWait;
  }

  /**
   * Check if wait is complete
   */
  async checkWaitComplete(executionId: string): Promise<boolean> {
    const wait = this.activeWaits.get(executionId);
    if (!wait) {
      return true; // Not waiting
    }

    if (wait.status === 'completed') {
      return true;
    }

    if (wait.resumeAt && new Date() >= wait.resumeAt) {
      return true;
    }

    return false;
  }

  /**
   * Complete wait
   */
  async completeWait(executionId: string): Promise<void> {
    const wait = this.activeWaits.get(executionId);
    if (wait) {
      wait.status = 'completed';
      this.activeWaits.delete(executionId);
      this.emit('wait:completed', wait);
    }
  }

  /**
   * Cancel wait
   */
  async cancelWait(executionId: string): Promise<void> {
    const wait = this.activeWaits.get(executionId);
    if (wait) {
      this.activeWaits.delete(executionId);
      this.emit('wait:cancelled', wait);
    }
  }

  /**
   * Get active waits
   */
  getActiveWaits(): ScheduledWait[] {
    return Array.from(this.activeWaits.values());
  }

  /**
   * Start condition checker for condition-based waits
   */
  private startConditionChecker(intervalMs: number): void {
    this.conditionCheckInterval = setInterval(() => {
      this.checkConditionWaits();
    }, intervalMs);
  }

  /**
   * Check all condition-based waits
   */
  private async checkConditionWaits(): Promise<void> {
    for (const wait of this.activeWaits.values()) {
      if (wait.waitConfig.waitType === 'until_condition' && wait.condition) {
        // Condition checking would be delegated to the execution engine
        // which has access to the full context
        this.emit('wait:condition_check', {
          executionId: wait.executionId,
          condition: wait.condition,
        });
      }
    }
  }

  /**
   * Parse date from string or field reference
   */
  private parseDate(dateStr: string, context: ExecutionContext): Date {
    // Check if it's a field reference
    if (dateStr.startsWith('{{') && dateStr.endsWith('}}')) {
      const field = dateStr.slice(2, -2);
      const value = this.getFieldValue(field, context);

      if (value instanceof Date) {
        return value;
      } else if (typeof value === 'string') {
        return new Date(value);
      } else {
        throw new Error(`Invalid date value from field: ${field}`);
      }
    }

    // Parse as ISO date
    return new Date(dateStr);
  }

  /**
   * Get field value from context
   */
  private getFieldValue(field: string, context: ExecutionContext): any {
    const parts = field.split('.');

    if (parts[0] === 'contact') {
      let value: any = context.contact;
      for (let i = 1; i < parts.length; i++) {
        value = value?.[parts[i]];
      }
      return value;
    } else if (parts[0] === 'variable') {
      return context.variables.get(parts.slice(1).join('.'));
    }

    return undefined;
  }

  /**
   * Convert time unit to milliseconds
   */
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

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.conditionCheckInterval) {
      clearInterval(this.conditionCheckInterval);
    }
    this.activeWaits.clear();
  }
}

/**
 * Wait Analytics
 * Track wait step performance and patterns
 */
export class WaitAnalytics {
  private waitDurations: Map<string, number[]> = new Map();

  /**
   * Record wait duration
   */
  recordWaitDuration(stepId: string, durationMs: number): void {
    if (!this.waitDurations.has(stepId)) {
      this.waitDurations.set(stepId, []);
    }
    this.waitDurations.get(stepId)!.push(durationMs);
  }

  /**
   * Get average wait duration
   */
  getAverageWaitDuration(stepId: string): number {
    const durations = this.waitDurations.get(stepId);
    if (!durations || durations.length === 0) {
      return 0;
    }

    const sum = durations.reduce((a, b) => a + b, 0);
    return sum / durations.length;
  }

  /**
   * Get wait statistics
   */
  getWaitStatistics(stepId: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    median: number;
  } {
    const durations = this.waitDurations.get(stepId) || [];

    if (durations.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, median: 0 };
    }

    const sorted = [...durations].sort((a, b) => a - b);

    return {
      count: durations.length,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
    };
  }
}
