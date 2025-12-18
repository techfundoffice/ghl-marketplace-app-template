/**
 * Step Executor - Handles retry logic and step execution
 */

import { WorkflowAction } from '../types/action.types';
import {
  ExecutionContext,
  StepResult,
  StepStatus,
  ExecutionError,
  RetryConfig,
  BackoffStrategy,
} from '../types/workflow.types';

export interface StepExecutorConfig {
  defaultTimeout: number;
  maxRetries: number;
  defaultBackoffStrategy: BackoffStrategy;
}

/**
 * Base Step Executor with retry logic
 */
export class StepExecutor {
  private config: StepExecutorConfig;

  constructor(config: StepExecutorConfig) {
    this.config = config;
  }

  /**
   * Execute step with retry logic
   */
  async executeWithRetry(
    action: WorkflowAction,
    context: ExecutionContext,
    executor: (action: WorkflowAction, context: ExecutionContext) => Promise<any>,
    currentRetry: number = 0
  ): Promise<StepResult> {
    const startTime = Date.now();

    try {
      // Execute action
      const output = await this.executeWithTimeout(
        executor(action, context),
        action.timeout || this.config.defaultTimeout
      );

      return {
        status: StepStatus.COMPLETED,
        output,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Check if should retry
      const retryConfig = action.retryConfig || this.getDefaultRetryConfig();

      if (this.shouldRetry(error as Error, retryConfig, currentRetry)) {
        // Calculate delay
        const delay = this.calculateRetryDelay(retryConfig, currentRetry);

        // Wait before retry
        await this.sleep(delay);

        // Retry
        return this.executeWithRetry(action, context, executor, currentRetry + 1);
      }

      // Failed after retries
      const stepError: ExecutionError = {
        stepId: action.id,
        timestamp: new Date(),
        error: (error as Error).message,
        errorCode: this.getErrorCode(error as Error),
        retryable: this.isRetryableError(error as Error),
        retryCount: currentRetry,
        stackTrace: (error as Error).stack,
      };

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
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Execution timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Determine if error should be retried
   */
  private shouldRetry(
    error: Error,
    retryConfig: RetryConfig,
    currentRetry: number
  ): boolean {
    if (!retryConfig.enabled) return false;
    if (currentRetry >= retryConfig.maxAttempts) return false;

    // Check if error is retryable
    if (!this.isRetryableError(error)) return false;

    // Check specific error codes
    if (retryConfig.retryableErrors && retryConfig.retryableErrors.length > 0) {
      const errorCode = this.getErrorCode(error);
      return retryConfig.retryableErrors.includes(errorCode);
    }

    return true;
  }

  /**
   * Calculate retry delay based on backoff strategy
   */
  private calculateRetryDelay(
    retryConfig: RetryConfig,
    attemptNumber: number
  ): number {
    if (!retryConfig.retryDelay) {
      return 1000; // Default 1 second
    }

    const { initial, max, multiplier } = retryConfig.retryDelay;

    let delay: number;

    switch (retryConfig.backoffStrategy) {
      case BackoffStrategy.FIXED:
        delay = initial;
        break;

      case BackoffStrategy.LINEAR:
        delay = initial * (attemptNumber + 1);
        break;

      case BackoffStrategy.EXPONENTIAL:
        delay = initial * Math.pow(multiplier || 2, attemptNumber);
        break;

      default:
        delay = initial;
    }

    // Apply max delay cap
    return Math.min(delay, max || delay);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /ENOTFOUND/i,
      /503/i, // Service Unavailable
      /429/i, // Too Many Requests
      /500/i, // Internal Server Error
      /502/i, // Bad Gateway
      /504/i, // Gateway Timeout
    ];

    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }

  /**
   * Extract error code from error
   */
  private getErrorCode(error: Error): string {
    // Try to extract HTTP status code or error code
    const statusMatch = error.message.match(/\b([45]\d{2})\b/);
    if (statusMatch) {
      return statusMatch[1];
    }

    // Check for specific error codes
    if ('code' in error) {
      return (error as any).code;
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Get default retry config
   */
  private getDefaultRetryConfig(): RetryConfig {
    return {
      enabled: true,
      maxAttempts: this.config.maxRetries,
      backoffStrategy: this.config.defaultBackoffStrategy,
      retryDelay: {
        initial: 1000,
        max: 30000,
        multiplier: 2,
      },
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Circuit Breaker for preventing cascading failures
 */
export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private halfOpenRequests: number = 3
  ) {}

  /**
   * Execute function with circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();

      // Success
      if (this.state === 'half-open') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Record failure
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }

  /**
   * Reset circuit breaker
   */
  private reset(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  /**
   * Get current state
   */
  getState(): string {
    return this.state;
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }
}

/**
 * Rate Limiter for preventing API abuse
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}

  /**
   * Check if request is allowed
   */
  async checkLimit(key: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests
    let requestTimes = this.requests.get(key) || [];

    // Remove old requests
    requestTimes = requestTimes.filter((time) => time > windowStart);

    // Check limit
    if (requestTimes.length >= this.maxRequests) {
      return false;
    }

    // Record new request
    requestTimes.push(now);
    this.requests.set(key, requestTimes);

    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const requestTimes = this.requests.get(key) || [];
    const recentRequests = requestTimes.filter((time) => time > windowStart);

    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  /**
   * Reset limit for key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * Bulk Executor for parallel step execution
 */
export class BulkStepExecutor {
  constructor(
    private stepExecutor: StepExecutor,
    private concurrency: number = 5
  ) {}

  /**
   * Execute multiple steps in parallel with concurrency limit
   */
  async executeParallel(
    actions: WorkflowAction[],
    context: ExecutionContext,
    executor: (action: WorkflowAction, context: ExecutionContext) => Promise<any>
  ): Promise<Map<string, StepResult>> {
    const results = new Map<string, StepResult>();
    const queue = [...actions];
    const executing: Promise<void>[] = [];

    while (queue.length > 0 || executing.length > 0) {
      // Start new executions up to concurrency limit
      while (queue.length > 0 && executing.length < this.concurrency) {
        const action = queue.shift()!;

        const promise = this.stepExecutor
          .executeWithRetry(action, context, executor)
          .then((result) => {
            results.set(action.id, result);
          })
          .finally(() => {
            // Remove from executing
            const index = executing.indexOf(promise);
            if (index > -1) {
              executing.splice(index, 1);
            }
          });

        executing.push(promise);
      }

      // Wait for at least one to complete
      if (executing.length > 0) {
        await Promise.race(executing);
      }
    }

    return results;
  }

  /**
   * Execute steps in sequence
   */
  async executeSequential(
    actions: WorkflowAction[],
    context: ExecutionContext,
    executor: (action: WorkflowAction, context: ExecutionContext) => Promise<any>
  ): Promise<Map<string, StepResult>> {
    const results = new Map<string, StepResult>();

    for (const action of actions) {
      const result = await this.stepExecutor.executeWithRetry(
        action,
        context,
        executor
      );
      results.set(action.id, result);

      // Stop on failure
      if (result.status === StepStatus.FAILED) {
        break;
      }
    }

    return results;
  }
}
