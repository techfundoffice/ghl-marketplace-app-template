/**
 * Workflow type definitions
 */

export interface Workflow {
  id: string
  name: string
  description?: string
  trigger: WorkflowNode
  nodes: WorkflowNode[]
  connections: Connection[]
  active: boolean
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
  tags?: string[]
}

export interface WorkflowNode {
  id: string
  type: string
  position: Position
  config: Record<string, any>
  label?: string
  description?: string
}

export interface Connection {
  id: string
  from: string
  to: string
  fromAnchor: string
  toAnchor: string
  condition?: ConnectionCondition
}

export interface Position {
  x: number
  y: number
}

export interface NodeType {
  id: string
  category: 'trigger' | 'action' | 'logic'
  label: string
  icon: string
  description: string
  config: Record<string, any>
  inputs?: NodePort[]
  outputs?: NodePort[]
}

export interface NodePort {
  id: string
  label: string
  type: 'input' | 'output'
  dataType?: string
  required?: boolean
}

export interface ConnectionCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

export interface NodeCategory {
  name: string
  nodes: Array<{
    type: string
    label: string
    icon: string
  }>
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'success' | 'failed' | 'cancelled'
  startedAt: Date
  completedAt?: Date
  logs: ExecutionLog[]
  context: Record<string, any>
}

export interface ExecutionLog {
  nodeId: string
  timestamp: Date
  level: 'info' | 'warning' | 'error'
  message: string
  data?: any
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  thumbnail?: string
  workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>
}

export interface WorkflowStats {
  totalExecutions: number
  successRate: number
  averageDuration: number
  lastExecution?: Date
}
