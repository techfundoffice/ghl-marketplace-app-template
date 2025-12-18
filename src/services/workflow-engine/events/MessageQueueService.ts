/**
 * Message Queue Service
 * Implements event-driven architecture using Redis/RabbitMQ
 */

import Redis from 'ioredis';
import { EventEmitter } from 'events';

export interface MessageQueueConfig {
  type: 'redis' | 'rabbitmq';
  redis?: RedisConfig;
  rabbitmq?: RabbitMQConfig;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

export interface RabbitMQConfig {
  url: string;
  exchangeName?: string;
  queuePrefix?: string;
}

/**
 * Redis-based Message Queue Implementation
 */
export class RedisMessageQueue extends EventEmitter {
  private client: Redis;
  private subscriber: Redis;
  private scheduler: Redis;
  private handlers: Map<string, (message: any) => Promise<void>> = new Map();

  constructor(config: RedisConfig) {
    super();

    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      keyPrefix: config.keyPrefix || 'workflow:',
    });

    this.subscriber = this.client.duplicate();
    this.scheduler = this.client.duplicate();

    this.setupSubscriber();
    this.setupScheduler();
  }

  /**
   * Publish message to topic
   */
  async publish(topic: string, message: any): Promise<void> {
    const payload = JSON.stringify({
      topic,
      message,
      timestamp: Date.now(),
    });

    await this.client.publish(topic, payload);
    this.emit('message:published', { topic, message });
  }

  /**
   * Subscribe to topic
   */
  async subscribe(
    topic: string,
    handler: (message: any) => Promise<void>
  ): Promise<void> {
    this.handlers.set(topic, handler);
    await this.subscriber.subscribe(topic);
    this.emit('subscribed', { topic });
  }

  /**
   * Unsubscribe from topic
   */
  async unsubscribe(topic: string): Promise<void> {
    this.handlers.delete(topic);
    await this.subscriber.unsubscribe(topic);
    this.emit('unsubscribed', { topic });
  }

  /**
   * Schedule delayed message
   */
  async scheduleDelayed(
    topic: string,
    message: any,
    delayMs: number
  ): Promise<void> {
    const executeAt = Date.now() + delayMs;
    const payload = JSON.stringify({
      topic,
      message,
      scheduledAt: Date.now(),
      executeAt,
    });

    // Use Redis sorted set for scheduling
    await this.scheduler.zadd('scheduled:messages', executeAt, payload);

    this.emit('message:scheduled', { topic, message, executeAt });
  }

  /**
   * Schedule recurring message
   */
  async scheduleRecurring(
    topic: string,
    message: any,
    intervalMs: number,
    options?: {
      startAt?: Date;
      endAt?: Date;
      maxExecutions?: number;
    }
  ): Promise<string> {
    const scheduleId = `recurring:${topic}:${Date.now()}`;

    const recurringConfig = {
      scheduleId,
      topic,
      message,
      intervalMs,
      startAt: options?.startAt || new Date(),
      endAt: options?.endAt,
      maxExecutions: options?.maxExecutions,
      executionCount: 0,
    };

    await this.client.hset(
      'recurring:schedules',
      scheduleId,
      JSON.stringify(recurringConfig)
    );

    // Schedule first execution
    const firstExecutionTime = options?.startAt?.getTime() || Date.now();
    await this.scheduleDelayed(topic, message, firstExecutionTime - Date.now());

    return scheduleId;
  }

  /**
   * Cancel scheduled message
   */
  async cancelScheduled(topic: string, message: any): Promise<void> {
    const payload = JSON.stringify({ topic, message });
    await this.scheduler.zrem('scheduled:messages', payload);
  }

  /**
   * Get queue depth
   */
  async getQueueDepth(topic: string): Promise<number> {
    return await this.client.llen(`queue:${topic}`);
  }

  /**
   * Get pending scheduled messages
   */
  async getPendingScheduled(topic?: string): Promise<any[]> {
    const messages = await this.scheduler.zrange(
      'scheduled:messages',
      0,
      -1,
      'WITHSCORES'
    );

    const pending = [];
    for (let i = 0; i < messages.length; i += 2) {
      const payload = JSON.parse(messages[i]);
      if (!topic || payload.topic === topic) {
        pending.push({
          ...payload,
          executeAt: parseInt(messages[i + 1]),
        });
      }
    }

    return pending;
  }

  /**
   * Setup subscriber for incoming messages
   */
  private setupSubscriber(): void {
    this.subscriber.on('message', async (topic, payload) => {
      try {
        const { message } = JSON.parse(payload);
        const handler = this.handlers.get(topic);

        if (handler) {
          await handler(message);
          this.emit('message:processed', { topic, message });
        }
      } catch (error) {
        this.emit('error', {
          topic,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  /**
   * Setup scheduler to process delayed messages
   */
  private setupScheduler(): void {
    // Poll for scheduled messages every second
    setInterval(async () => {
      await this.processScheduledMessages();
    }, 1000);
  }

  /**
   * Process scheduled messages that are due
   */
  private async processScheduledMessages(): Promise<void> {
    const now = Date.now();

    // Get messages that should be executed
    const dueMessages = await this.scheduler.zrangebyscore(
      'scheduled:messages',
      0,
      now
    );

    for (const payload of dueMessages) {
      try {
        const { topic, message } = JSON.parse(payload);

        // Publish message
        await this.publish(topic, message);

        // Remove from scheduled set
        await this.scheduler.zrem('scheduled:messages', payload);

        this.emit('scheduled:executed', { topic, message });
      } catch (error) {
        this.emit('error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.client.quit();
    await this.subscriber.quit();
    await this.scheduler.quit();
  }
}

/**
 * Message Queue Factory
 */
export class MessageQueueFactory {
  static create(config: MessageQueueConfig): RedisMessageQueue {
    if (config.type === 'redis' && config.redis) {
      return new RedisMessageQueue(config.redis);
    }

    throw new Error(`Unsupported message queue type: ${config.type}`);
  }
}

/**
 * Workflow Event Bus
 * High-level event bus for workflow-specific events
 */
export class WorkflowEventBus extends EventEmitter {
  private messageQueue: RedisMessageQueue;

  constructor(messageQueue: RedisMessageQueue) {
    super();
    this.messageQueue = messageQueue;
    this.setupEventHandlers();
  }

  /**
   * Emit workflow event
   */
  async emitWorkflowEvent(
    eventType: WorkflowEventType,
    data: any
  ): Promise<void> {
    await this.messageQueue.publish(`workflow:event:${eventType}`, data);
  }

  /**
   * Listen for workflow events
   */
  async onWorkflowEvent(
    eventType: WorkflowEventType,
    handler: (data: any) => Promise<void>
  ): Promise<void> {
    await this.messageQueue.subscribe(`workflow:event:${eventType}`, handler);
  }

  /**
   * Emit trigger event
   */
  async emitTriggerEvent(triggerType: string, data: any): Promise<void> {
    await this.messageQueue.publish(`trigger:${triggerType}`, data);
  }

  /**
   * Listen for trigger events
   */
  async onTriggerEvent(
    triggerType: string,
    handler: (data: any) => Promise<void>
  ): Promise<void> {
    await this.messageQueue.subscribe(`trigger:${triggerType}`, handler);
  }

  private setupEventHandlers(): void {
    this.messageQueue.on('message:published', (data) => {
      this.emit('event:published', data);
    });

    this.messageQueue.on('message:processed', (data) => {
      this.emit('event:processed', data);
    });

    this.messageQueue.on('error', (data) => {
      this.emit('error', data);
    });
  }
}

export enum WorkflowEventType {
  EXECUTION_STARTED = 'execution:started',
  EXECUTION_COMPLETED = 'execution:completed',
  EXECUTION_FAILED = 'execution:failed',
  EXECUTION_WAITING = 'execution:waiting',
  STEP_STARTED = 'step:started',
  STEP_COMPLETED = 'step:completed',
  STEP_FAILED = 'step:failed',
  GOAL_ACHIEVED = 'goal:achieved',
  ENROLLMENT_BLOCKED = 'enrollment:blocked',
}

/**
 * Priority Queue for workflow executions
 */
export class PriorityWorkflowQueue {
  private messageQueue: RedisMessageQueue;

  constructor(messageQueue: RedisMessageQueue) {
    this.messageQueue = messageQueue;
  }

  /**
   * Enqueue workflow execution with priority
   */
  async enqueue(
    executionId: string,
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): Promise<void> {
    const priorityScore = this.getPriorityScore(priority);

    await this.messageQueue['client'].zadd(
      'workflow:execution:queue',
      priorityScore,
      executionId
    );
  }

  /**
   * Dequeue next execution
   */
  async dequeue(): Promise<string | null> {
    const result = await this.messageQueue['client'].zpopmin(
      'workflow:execution:queue'
    );

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get queue size
   */
  async getSize(): Promise<number> {
    return await this.messageQueue['client'].zcard('workflow:execution:queue');
  }

  private getPriorityScore(priority: string): number {
    const scores = {
      urgent: 1,
      high: 2,
      medium: 3,
      low: 4,
    };
    return scores[priority as keyof typeof scores] || 3;
  }
}
