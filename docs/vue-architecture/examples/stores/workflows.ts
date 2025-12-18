import { defineStore } from 'pinia'
import type { Workflow, WorkflowNode, Connection, NodeType } from '@/types/workflow'

interface WorkflowsState {
  workflows: Workflow[]
  activeWorkflow: Workflow | null
  availableNodeTypes: NodeType[]
  loading: boolean
  error: string | null
  executionHistory: Array<{
    workflowId: string
    executedAt: Date
    status: 'success' | 'failed'
    logs: string[]
  }>
}

export const useWorkflowsStore = defineStore('workflows', {
  state: (): WorkflowsState => ({
    workflows: [],
    activeWorkflow: null,
    availableNodeTypes: [
      // Triggers
      {
        id: 'contact_created',
        category: 'trigger',
        label: 'Contact Created',
        icon: 'user-plus',
        description: 'Triggers when a new contact is created',
        config: {}
      },
      {
        id: 'form_submitted',
        category: 'trigger',
        label: 'Form Submitted',
        icon: 'file-text',
        description: 'Triggers when a form is submitted',
        config: { formId: '' }
      },
      {
        id: 'email_received',
        category: 'trigger',
        label: 'Email Received',
        icon: 'mail',
        description: 'Triggers when an email is received',
        config: {}
      },
      // Actions
      {
        id: 'send_email',
        category: 'action',
        label: 'Send Email',
        icon: 'send',
        description: 'Send an email to a contact',
        config: { templateId: '', to: '', subject: '', body: '' }
      },
      {
        id: 'send_sms',
        category: 'action',
        label: 'Send SMS',
        icon: 'message-square',
        description: 'Send an SMS message',
        config: { to: '', message: '' }
      },
      {
        id: 'create_task',
        category: 'action',
        label: 'Create Task',
        icon: 'check-square',
        description: 'Create a task for a user',
        config: { title: '', assignee: '', dueDate: '' }
      },
      {
        id: 'update_contact',
        category: 'action',
        label: 'Update Contact',
        icon: 'user',
        description: 'Update contact fields',
        config: { fields: {} }
      },
      {
        id: 'wait',
        category: 'action',
        label: 'Wait',
        icon: 'clock',
        description: 'Wait for a specified duration',
        config: { duration: 0, unit: 'minutes' }
      },
      // Logic
      {
        id: 'condition',
        category: 'logic',
        label: 'Condition',
        icon: 'git-branch',
        description: 'Branch based on conditions',
        config: { conditions: [], operator: 'AND' }
      },
      {
        id: 'split',
        category: 'logic',
        label: 'Split',
        icon: 'split',
        description: 'Split into multiple paths',
        config: { paths: 2 }
      },
      {
        id: 'loop',
        category: 'logic',
        label: 'Loop',
        icon: 'repeat',
        description: 'Repeat actions for each item',
        config: { array: '', maxIterations: 100 }
      }
    ],
    loading: false,
    error: null,
    executionHistory: []
  }),

  getters: {
    /**
     * Get total number of workflows
     */
    totalWorkflows: (state) => state.workflows.length,

    /**
     * Get active workflows count
     */
    activeWorkflowsCount: (state) => {
      return state.workflows.filter(w => w.active).length
    },

    /**
     * Get workflow by ID
     */
    getWorkflowById: (state) => {
      return (id: string) => state.workflows.find(w => w.id === id)
    },

    /**
     * Get node types by category
     */
    getNodeTypesByCategory: (state) => {
      return (category: string) => {
        return state.availableNodeTypes.filter(nt => nt.category === category)
      }
    },

    /**
     * Get trigger node types
     */
    triggerNodeTypes: (state) => {
      return state.availableNodeTypes.filter(nt => nt.category === 'trigger')
    },

    /**
     * Get action node types
     */
    actionNodeTypes: (state) => {
      return state.availableNodeTypes.filter(nt => nt.category === 'action')
    },

    /**
     * Get logic node types
     */
    logicNodeTypes: (state) => {
      return state.availableNodeTypes.filter(nt => nt.category === 'logic')
    },

    /**
     * Check if workflow has unsaved changes
     */
    hasUnsavedChanges: (state) => {
      if (!state.activeWorkflow) return false
      const saved = state.workflows.find(w => w.id === state.activeWorkflow?.id)
      return JSON.stringify(saved) !== JSON.stringify(state.activeWorkflow)
    }
  },

  actions: {
    /**
     * Set workflows list
     */
    setWorkflows(workflows: Workflow[]) {
      this.workflows = workflows
    },

    /**
     * Set active workflow
     */
    setActiveWorkflow(workflow: Workflow | null) {
      this.activeWorkflow = workflow
    },

    /**
     * Get a workflow by ID
     */
    async getWorkflow(id: string): Promise<Workflow | undefined> {
      return this.workflows.find(w => w.id === id)
    },

    /**
     * Create a new workflow
     */
    createWorkflow(workflow: Workflow) {
      this.workflows.push(workflow)
      return workflow
    },

    /**
     * Update an existing workflow
     */
    updateWorkflow(id: string, updates: Partial<Workflow>) {
      const index = this.workflows.findIndex(w => w.id === id)
      if (index !== -1) {
        this.workflows[index] = {
          ...this.workflows[index],
          ...updates
        }
      }
    },

    /**
     * Delete a workflow
     */
    deleteWorkflow(id: string) {
      const index = this.workflows.findIndex(w => w.id === id)
      if (index !== -1) {
        this.workflows.splice(index, 1)
        if (this.activeWorkflow?.id === id) {
          this.activeWorkflow = null
        }
      }
    },

    /**
     * Toggle workflow active state
     */
    toggleWorkflowActive(id: string) {
      const workflow = this.workflows.find(w => w.id === id)
      if (workflow) {
        workflow.active = !workflow.active
      }
    },

    /**
     * Add node to active workflow
     */
    addNode(node: WorkflowNode) {
      if (this.activeWorkflow) {
        this.activeWorkflow.nodes.push(node)
      }
    },

    /**
     * Update node in active workflow
     */
    updateNode(nodeId: string, updates: Partial<WorkflowNode>) {
      if (!this.activeWorkflow) return

      const index = this.activeWorkflow.nodes.findIndex(n => n.id === nodeId)
      if (index !== -1) {
        this.activeWorkflow.nodes[index] = {
          ...this.activeWorkflow.nodes[index],
          ...updates
        }
      }
    },

    /**
     * Delete node from active workflow
     */
    deleteNode(nodeId: string) {
      if (!this.activeWorkflow) return

      // Remove node
      this.activeWorkflow.nodes = this.activeWorkflow.nodes.filter(
        n => n.id !== nodeId
      )

      // Remove connections to/from this node
      this.activeWorkflow.connections = this.activeWorkflow.connections.filter(
        c => c.from !== nodeId && c.to !== nodeId
      )
    },

    /**
     * Add connection to active workflow
     */
    addConnection(connection: Connection) {
      if (this.activeWorkflow) {
        this.activeWorkflow.connections.push(connection)
      }
    },

    /**
     * Delete connection from active workflow
     */
    deleteConnection(connectionId: string) {
      if (!this.activeWorkflow) return

      this.activeWorkflow.connections = this.activeWorkflow.connections.filter(
        c => c.id !== connectionId
      )
    },

    /**
     * Update trigger node
     */
    updateTrigger(updates: Partial<WorkflowNode>) {
      if (this.activeWorkflow?.trigger) {
        this.activeWorkflow.trigger = {
          ...this.activeWorkflow.trigger,
          ...updates
        }
      }
    },

    /**
     * Duplicate workflow
     */
    duplicateWorkflow(id: string) {
      const workflow = this.workflows.find(w => w.id === id)
      if (workflow) {
        const duplicate: Workflow = {
          ...JSON.parse(JSON.stringify(workflow)),
          id: Date.now().toString(),
          name: `${workflow.name} (Copy)`,
          active: false
        }
        this.workflows.push(duplicate)
        return duplicate
      }
    },

    /**
     * Validate workflow
     */
    validateWorkflow(workflow: Workflow): string[] {
      const errors: string[] = []

      // Check if workflow has a name
      if (!workflow.name || workflow.name.trim() === '') {
        errors.push('Workflow must have a name')
      }

      // Check if trigger is configured
      if (!workflow.trigger.config || Object.keys(workflow.trigger.config).length === 0) {
        errors.push('Trigger must be configured')
      }

      // Check if workflow has at least one action
      if (workflow.nodes.length === 0) {
        errors.push('Workflow must have at least one action')
      }

      // Check for orphaned nodes (nodes with no incoming connections)
      const connectedNodes = new Set(workflow.connections.map(c => c.to))
      workflow.nodes.forEach(node => {
        if (!connectedNodes.has(node.id)) {
          errors.push(`Node "${node.type}" is not connected`)
        }
      })

      // Check for nodes with invalid configuration
      workflow.nodes.forEach(node => {
        const nodeType = this.availableNodeTypes.find(nt => nt.id === node.type)
        if (!nodeType) {
          errors.push(`Unknown node type: ${node.type}`)
        }
      })

      return errors
    },

    /**
     * Add execution to history
     */
    addExecutionHistory(execution: {
      workflowId: string
      executedAt: Date
      status: 'success' | 'failed'
      logs: string[]
    }) {
      this.executionHistory.push(execution)

      // Keep only last 100 executions
      if (this.executionHistory.length > 100) {
        this.executionHistory.shift()
      }
    },

    /**
     * Get execution history for workflow
     */
    getExecutionHistory(workflowId: string) {
      return this.executionHistory
        .filter(e => e.workflowId === workflowId)
        .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
    },

    /**
     * Set loading state
     */
    setLoading(loading: boolean) {
      this.loading = loading
    },

    /**
     * Set error state
     */
    setError(error: string | null) {
      this.error = error
    },

    /**
     * Reset store to initial state
     */
    $reset() {
      this.workflows = []
      this.activeWorkflow = null
      this.loading = false
      this.error = null
      this.executionHistory = []
    }
  },

  // Persist state to localStorage
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'workflows',
        storage: localStorage,
        paths: ['workflows', 'executionHistory']
      }
    ]
  }
})
