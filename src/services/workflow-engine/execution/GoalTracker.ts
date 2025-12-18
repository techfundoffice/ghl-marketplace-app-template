/**
 * Goal Tracker - Monitors and evaluates workflow goals
 */

import { EventEmitter } from 'events';
import {
  WorkflowExecution,
  ExecutionContext,
  WorkflowGoal,
  GoalAchievementAction,
  ConditionGroup,
} from '../types/workflow.types';

export interface GoalAchievement {
  goalId: string;
  goalName: string;
  achievedAt: Date;
  executionId: string;
  contactId: string;
  triggerData?: any;
  action: GoalAchievementAction;
}

export interface GoalTrackerConfig {
  evaluateOnStepComplete?: boolean;
  evaluateOnContextChange?: boolean;
  autoExecuteActions?: boolean;
}

/**
 * Goal Tracker
 * Monitors workflow executions for goal achievements
 */
export class GoalTracker extends EventEmitter {
  private config: GoalTrackerConfig;
  private achievements: Map<string, GoalAchievement[]> = new Map();

  constructor(config: GoalTrackerConfig = {}) {
    super();
    this.config = {
      evaluateOnStepComplete: true,
      evaluateOnContextChange: true,
      autoExecuteActions: true,
      ...config,
    };
  }

  /**
   * Evaluate goals for an execution
   */
  async evaluateGoals(
    execution: WorkflowExecution,
    goals: WorkflowGoal[],
    context: ExecutionContext
  ): Promise<GoalAchievement[]> {
    const newAchievements: GoalAchievement[] = [];

    for (const goal of goals) {
      // Skip if already achieved
      if (execution.goalsAchieved.includes(goal.id)) {
        continue;
      }

      // Evaluate goal conditions
      const achieved = await this.evaluateGoalConditions(goal, context);

      if (achieved) {
        const achievement: GoalAchievement = {
          goalId: goal.id,
          goalName: goal.name,
          achievedAt: new Date(),
          executionId: execution.id,
          contactId: execution.contactId,
          triggerData: context.triggerData,
          action: goal.onAchievement,
        };

        newAchievements.push(achievement);

        // Store achievement
        if (!this.achievements.has(execution.id)) {
          this.achievements.set(execution.id, []);
        }
        this.achievements.get(execution.id)!.push(achievement);

        // Update execution
        execution.goalsAchieved.push(goal.id);

        this.emit('goal:achieved', achievement);
      }
    }

    return newAchievements;
  }

  /**
   * Check if execution should exit based on goals
   */
  shouldExitWorkflow(
    execution: WorkflowExecution,
    goals: WorkflowGoal[]
  ): {
    shouldExit: boolean;
    reason?: string;
    targetStepId?: string;
  } {
    for (const goalId of execution.goalsAchieved) {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) continue;

      switch (goal.onAchievement) {
        case GoalAchievementAction.EXIT:
          return {
            shouldExit: true,
            reason: `Goal achieved: ${goal.name}`,
          };

        case GoalAchievementAction.GOTO:
          // Would need target step from goal config
          return {
            shouldExit: false,
            reason: `Goal achieved: ${goal.name}, jumping to step`,
            targetStepId: (goal as any).targetStepId,
          };

        case GoalAchievementAction.CONTINUE:
          // Continue workflow
          break;
      }
    }

    return { shouldExit: false };
  }

  /**
   * Get achievements for execution
   */
  getAchievements(executionId: string): GoalAchievement[] {
    return this.achievements.get(executionId) || [];
  }

  /**
   * Get achievement statistics
   */
  getAchievementStats(goalId: string): {
    totalAchievements: number;
    uniqueContacts: number;
    averageTimeToAchieve?: number;
  } {
    const allAchievements = Array.from(this.achievements.values()).flat();
    const goalAchievements = allAchievements.filter((a) => a.goalId === goalId);

    const uniqueContacts = new Set(
      goalAchievements.map((a) => a.contactId)
    ).size;

    return {
      totalAchievements: goalAchievements.length,
      uniqueContacts,
    };
  }

  /**
   * Evaluate goal conditions
   */
  private async evaluateGoalConditions(
    goal: WorkflowGoal,
    context: ExecutionContext
  ): Promise<boolean> {
    return this.evaluateConditionGroup(goal.conditions, context);
  }

  /**
   * Evaluate condition group (shared with branching engine)
   */
  private async evaluateConditionGroup(
    conditionGroup: ConditionGroup,
    context: ExecutionContext
  ): Promise<boolean> {
    const results: boolean[] = [];

    for (const condition of conditionGroup.conditions) {
      if ('operator' in condition && typeof condition.operator === 'string') {
        // Single condition
        const result = await this.evaluateSingleCondition(
          condition as any,
          context
        );
        results.push(result);
      } else {
        // Nested condition group
        const result = await this.evaluateConditionGroup(
          condition as ConditionGroup,
          context
        );
        results.push(result);
      }
    }

    // Apply AND/OR operator
    if (conditionGroup.operator === 'AND') {
      return results.every((r) => r === true);
    } else {
      return results.some((r) => r === true);
    }
  }

  /**
   * Evaluate single condition
   */
  private async evaluateSingleCondition(
    condition: any,
    context: ExecutionContext
  ): Promise<boolean> {
    const fieldValue = this.getFieldValue(condition.field, context);

    switch (condition.operator) {
      case 'equals':
        return fieldValue == condition.value;
      case 'not_equals':
        return fieldValue != condition.value;
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined;
      case 'not_exists':
        return fieldValue === null || fieldValue === undefined;
      default:
        return false;
    }
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
    } else if (parts[0] === 'trigger') {
      let value: any = context.triggerData;
      for (let i = 1; i < parts.length; i++) {
        value = value?.[parts[i]];
      }
      return value;
    } else if (parts[0] === 'variable') {
      return context.variables.get(parts.slice(1).join('.'));
    } else if (parts[0] === 'action') {
      return context.actionResults.get(parts.slice(1).join('.'));
    }

    return undefined;
  }
}

/**
 * Exit Condition Evaluator
 * Evaluates exit conditions for workflows
 */
export class ExitConditionEvaluator {
  /**
   * Check if execution should exit based on exit conditions
   */
  async shouldExit(
    exitConditions: ConditionGroup | undefined,
    context: ExecutionContext
  ): Promise<{ shouldExit: boolean; reason?: string }> {
    if (!exitConditions) {
      return { shouldExit: false };
    }

    const conditionMet = await this.evaluateConditionGroup(
      exitConditions,
      context
    );

    if (conditionMet) {
      return {
        shouldExit: true,
        reason: 'Exit condition met',
      };
    }

    return { shouldExit: false };
  }

  /**
   * Evaluate condition group
   */
  private async evaluateConditionGroup(
    conditionGroup: ConditionGroup,
    context: ExecutionContext
  ): Promise<boolean> {
    const results: boolean[] = [];

    for (const condition of conditionGroup.conditions) {
      if ('operator' in condition && typeof condition.operator === 'string') {
        const result = await this.evaluateSingleCondition(
          condition as any,
          context
        );
        results.push(result);
      } else {
        const result = await this.evaluateConditionGroup(
          condition as ConditionGroup,
          context
        );
        results.push(result);
      }
    }

    if (conditionGroup.operator === 'AND') {
      return results.every((r) => r === true);
    } else {
      return results.some((r) => r === true);
    }
  }

  /**
   * Evaluate single condition
   */
  private async evaluateSingleCondition(
    condition: any,
    context: ExecutionContext
  ): Promise<boolean> {
    const fieldValue = this.getFieldValue(condition.field, context);

    switch (condition.operator) {
      case 'equals':
        return fieldValue == condition.value;
      case 'not_equals':
        return fieldValue != condition.value;
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined;
      default:
        return false;
    }
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
}

/**
 * Goal-based Workflow Router
 * Routes workflow based on achieved goals
 */
export class GoalBasedRouter {
  /**
   * Get next step based on goal achievement
   */
  getNextStepForGoal(
    goal: WorkflowGoal,
    currentStepId: string
  ): string | null {
    switch (goal.onAchievement) {
      case GoalAchievementAction.EXIT:
        return null; // End workflow

      case GoalAchievementAction.GOTO:
        // Get target step from goal configuration
        return (goal as any).targetStepId || null;

      case GoalAchievementAction.CONTINUE:
        return currentStepId; // Continue current flow

      default:
        return currentStepId;
    }
  }

  /**
   * Determine workflow path based on multiple goals
   */
  determinePathFromGoals(
    achievedGoals: string[],
    allGoals: WorkflowGoal[],
    currentStepId: string
  ): {
    action: 'exit' | 'goto' | 'continue';
    targetStepId?: string;
    reason: string;
  } {
    // Prioritize EXIT actions
    for (const goalId of achievedGoals) {
      const goal = allGoals.find((g) => g.id === goalId);
      if (goal?.onAchievement === GoalAchievementAction.EXIT) {
        return {
          action: 'exit',
          reason: `Goal "${goal.name}" achieved with EXIT action`,
        };
      }
    }

    // Then GOTO actions (use first one)
    for (const goalId of achievedGoals) {
      const goal = allGoals.find((g) => g.id === goalId);
      if (goal?.onAchievement === GoalAchievementAction.GOTO) {
        return {
          action: 'goto',
          targetStepId: (goal as any).targetStepId,
          reason: `Goal "${goal.name}" achieved with GOTO action`,
        };
      }
    }

    // Default: continue
    return {
      action: 'continue',
      reason: 'No routing goals achieved or only CONTINUE actions',
    };
  }
}
