/**
 * Branching Engine - Handles parallel and sequential branching
 * Supports If/Else, Split (A/B testing), and Random paths
 */

import {
  WorkflowExecution,
  ExecutionContext,
  StepResult,
  StepStatus,
  ConditionGroup,
} from '../types/workflow.types';
import {
  WorkflowAction,
  ActionType,
  IfElseConfig,
  SplitConfig,
  RandomPathConfig,
} from '../types/action.types';

export interface BranchExecutionResult {
  branchId: string;
  branchName: string;
  selectedPath: string[]; // Action IDs
  reason: string;
}

/**
 * Branching Engine for workflow control flow
 */
export class BranchingEngine {
  /**
   * Execute If/Else branching
   */
  async executeIfElse(
    action: WorkflowAction,
    context: ExecutionContext
  ): Promise<BranchExecutionResult> {
    const config = action.config as IfElseConfig;

    // Evaluate condition
    const conditionMet = await this.evaluateConditionGroup(
      config.condition,
      context
    );

    if (conditionMet) {
      return {
        branchId: `${action.id}:true`,
        branchName: 'True Branch',
        selectedPath: config.trueBranch,
        reason: 'Condition evaluated to true',
      };
    } else {
      return {
        branchId: `${action.id}:false`,
        branchName: 'False Branch',
        selectedPath: config.falseBranch,
        reason: 'Condition evaluated to false',
      };
    }
  }

  /**
   * Execute Split (A/B testing or conditional)
   */
  async executeSplit(
    action: WorkflowAction,
    context: ExecutionContext
  ): Promise<BranchExecutionResult> {
    const config = action.config as SplitConfig;

    if (config.splitType === 'percentage') {
      return this.executePercentageSplit(action.id, config, context);
    } else {
      return this.executeConditionalSplit(action.id, config, context);
    }
  }

  /**
   * Execute Random Path
   */
  async executeRandomPath(
    action: WorkflowAction,
    context: ExecutionContext
  ): Promise<BranchExecutionResult> {
    const config = action.config as RandomPathConfig;

    // Calculate total weight
    const totalWeight = config.paths.reduce((sum, path) => sum + path.weight, 0);

    // Generate random number
    const random = Math.random() * totalWeight;

    // Select path based on weight
    let cumulativeWeight = 0;
    for (const path of config.paths) {
      cumulativeWeight += path.weight;
      if (random <= cumulativeWeight) {
        return {
          branchId: path.id,
          branchName: path.id,
          selectedPath: path.actions,
          reason: `Random selection (weight: ${path.weight}/${totalWeight})`,
        };
      }
    }

    // Fallback to first path
    const firstPath = config.paths[0];
    return {
      branchId: firstPath.id,
      branchName: firstPath.id,
      selectedPath: firstPath.actions,
      reason: 'Fallback to first path',
    };
  }

  /**
   * Execute percentage-based split
   */
  private async executePercentageSplit(
    actionId: string,
    config: SplitConfig,
    context: ExecutionContext
  ): Promise<BranchExecutionResult> {
    if (!config.branches) {
      throw new Error('No branches defined for percentage split');
    }

    // Validate percentages sum to 100
    const totalPercentage = config.branches.reduce(
      (sum, branch) => sum + branch.percentage,
      0
    );
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(
        `Branch percentages must sum to 100, got ${totalPercentage}`
      );
    }

    // Deterministic selection based on contact ID (for consistent A/B testing)
    const contactId = context.contact.id;
    const hash = this.hashString(contactId);
    const random = (hash % 10000) / 100; // 0-100

    // Select branch based on percentage
    let cumulativePercentage = 0;
    for (const branch of config.branches) {
      cumulativePercentage += branch.percentage;
      if (random <= cumulativePercentage) {
        return {
          branchId: branch.id,
          branchName: branch.name,
          selectedPath: branch.actions,
          reason: `Percentage split: ${branch.percentage}% (deterministic)`,
        };
      }
    }

    // Fallback to last branch
    const lastBranch = config.branches[config.branches.length - 1];
    return {
      branchId: lastBranch.id,
      branchName: lastBranch.name,
      selectedPath: lastBranch.actions,
      reason: 'Fallback to last branch',
    };
  }

  /**
   * Execute conditional split
   */
  private async executeConditionalSplit(
    actionId: string,
    config: SplitConfig,
    context: ExecutionContext
  ): Promise<BranchExecutionResult> {
    if (!config.conditionalBranches) {
      throw new Error('No conditional branches defined');
    }

    // Evaluate each branch condition
    for (const branch of config.conditionalBranches) {
      const conditionMet = await this.evaluateConditionGroup(
        branch.condition,
        context
      );

      if (conditionMet) {
        return {
          branchId: branch.id,
          branchName: branch.name,
          selectedPath: branch.actions,
          reason: `Condition met: ${branch.name}`,
        };
      }
    }

    // No conditions met, use default branch
    if (config.defaultBranch) {
      return {
        branchId: `${actionId}:default`,
        branchName: 'Default Branch',
        selectedPath: config.defaultBranch,
        reason: 'No conditions met, using default branch',
      };
    }

    throw new Error('No matching branch and no default branch defined');
  }

  /**
   * Evaluate condition group (AND/OR logic)
   */
  private async evaluateConditionGroup(
    conditionGroup: ConditionGroup,
    context: ExecutionContext
  ): Promise<boolean> {
    const results: boolean[] = [];

    for (const condition of conditionGroup.conditions) {
      if ('operator' in condition) {
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
    // Get field value from context
    const fieldValue = this.getFieldValue(condition.field, context);

    // Evaluate based on operator
    switch (condition.operator) {
      case 'equals':
        return fieldValue == condition.value;
      case 'not_equals':
        return fieldValue != condition.value;
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'greater_than_or_equal':
        return Number(fieldValue) >= Number(condition.value);
      case 'less_than_or_equal':
        return Number(fieldValue) <= Number(condition.value);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'not_contains':
        return !String(fieldValue).includes(String(condition.value));
      case 'starts_with':
        return String(fieldValue).startsWith(String(condition.value));
      case 'ends_with':
        return String(fieldValue).endsWith(String(condition.value));
      case 'matches_regex':
        return new RegExp(condition.value).test(String(fieldValue));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'includes':
        return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
      case 'not_includes':
        return Array.isArray(fieldValue) && !fieldValue.includes(condition.value);
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined;
      case 'not_exists':
        return fieldValue === null || fieldValue === undefined;
      case 'is_empty':
        return (
          fieldValue === '' ||
          fieldValue === null ||
          fieldValue === undefined ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        );
      case 'is_not_empty':
        return (
          fieldValue !== '' &&
          fieldValue !== null &&
          fieldValue !== undefined &&
          (!Array.isArray(fieldValue) || fieldValue.length > 0)
        );
      default:
        throw new Error(`Unknown operator: ${condition.operator}`);
    }
  }

  /**
   * Get field value from context using dot notation
   */
  private getFieldValue(field: string, context: ExecutionContext): any {
    const parts = field.split('.');

    // Handle different namespaces
    if (parts[0] === 'contact') {
      return this.getNestedValue(context.contact, parts.slice(1));
    } else if (parts[0] === 'trigger') {
      return this.getNestedValue(context.triggerData, parts.slice(1));
    } else if (parts[0] === 'variable') {
      return context.variables.get(parts.slice(1).join('.'));
    } else if (parts[0] === 'action') {
      return context.actionResults.get(parts.slice(1).join('.'));
    }

    return undefined;
  }

  /**
   * Get nested object value
   */
  private getNestedValue(obj: any, path: string[]): any {
    let current = obj;
    for (const key of path) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }
    return current;
  }

  /**
   * Hash string to number (for deterministic random selection)
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Parallel Branch Executor
 * Executes multiple branches in parallel
 */
export class ParallelBranchExecutor {
  /**
   * Execute multiple branches in parallel
   */
  async executeParallel(
    branches: BranchExecutionResult[],
    executeAction: (actionId: string) => Promise<StepResult>
  ): Promise<Map<string, StepResult>> {
    const results = new Map<string, StepResult>();

    // Execute all branches in parallel
    await Promise.all(
      branches.map(async (branch) => {
        for (const actionId of branch.selectedPath) {
          const result = await executeAction(actionId);
          results.set(actionId, result);

          // Stop branch on failure
          if (result.status === StepStatus.FAILED) {
            break;
          }
        }
      })
    );

    return results;
  }

  /**
   * Execute branches with racing (first to complete wins)
   */
  async executeRacing(
    branches: BranchExecutionResult[],
    executeAction: (actionId: string) => Promise<StepResult>
  ): Promise<{ branchId: string; results: Map<string, StepResult> }> {
    const branchPromises = branches.map(async (branch) => {
      const results = new Map<string, StepResult>();

      for (const actionId of branch.selectedPath) {
        const result = await executeAction(actionId);
        results.set(actionId, result);

        if (result.status === StepStatus.FAILED) {
          throw new Error(`Branch ${branch.branchId} failed`);
        }
      }

      return { branchId: branch.branchId, results };
    });

    return await Promise.race(branchPromises);
  }
}

/**
 * Branch Merger
 * Merges results from parallel branches
 */
export class BranchMerger {
  /**
   * Merge context from multiple branches
   */
  mergeContexts(
    originalContext: ExecutionContext,
    branchContexts: ExecutionContext[]
  ): ExecutionContext {
    const merged = { ...originalContext };

    // Merge variables
    merged.variables = new Map(originalContext.variables);
    for (const branchContext of branchContexts) {
      for (const [key, value] of branchContext.variables.entries()) {
        merged.variables.set(key, value);
      }
    }

    // Merge action results
    merged.actionResults = new Map(originalContext.actionResults);
    for (const branchContext of branchContexts) {
      for (const [key, value] of branchContext.actionResults.entries()) {
        merged.actionResults.set(key, value);
      }
    }

    return merged;
  }

  /**
   * Resolve conflicts when same variable set in multiple branches
   */
  resolveConflicts(
    branchContexts: ExecutionContext[],
    strategy: 'first' | 'last' | 'merge' = 'last'
  ): Map<string, any> {
    const resolved = new Map<string, any>();

    if (strategy === 'first') {
      // Use first non-undefined value
      for (const context of branchContexts) {
        for (const [key, value] of context.variables.entries()) {
          if (!resolved.has(key)) {
            resolved.set(key, value);
          }
        }
      }
    } else if (strategy === 'last') {
      // Use last value (override)
      for (const context of branchContexts) {
        for (const [key, value] of context.variables.entries()) {
          resolved.set(key, value);
        }
      }
    } else {
      // Merge arrays, keep last for primitives
      for (const context of branchContexts) {
        for (const [key, value] of context.variables.entries()) {
          if (resolved.has(key)) {
            const existing = resolved.get(key);
            if (Array.isArray(existing) && Array.isArray(value)) {
              resolved.set(key, [...existing, ...value]);
            } else {
              resolved.set(key, value);
            }
          } else {
            resolved.set(key, value);
          }
        }
      }
    }

    return resolved;
  }
}
