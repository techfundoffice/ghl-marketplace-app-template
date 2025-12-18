<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWorkflowsStore } from '@/stores/workflows'
import { useWorkflow } from '@/composables/useWorkflow'
import { useDragDrop } from '@/composables/useDragDrop'
import { useCanvas } from '@/composables/useCanvas'
import type { Workflow, WorkflowNode, Connection, Position } from '@/types/workflow'
import TriggerNode from './TriggerNode.vue'
import ActionNode from './ActionNode.vue'
import ConnectionLine from './ConnectionLine.vue'
import NodePalette from './NodePalette.vue'

interface WorkflowBuilderProps {
  workflowId?: string
  readonly?: boolean
}

const props = withDefaults(defineProps<WorkflowBuilderProps>(), {
  readonly: false
})

const emit = defineEmits<{
  'save': [workflow: Workflow]
  'node-add': [nodeType: string, position: Position]
  'connection-create': [from: string, to: string]
}>()

const workflowsStore = useWorkflowsStore()
const { createWorkflow, updateWorkflow, validateWorkflow } = useWorkflow()
const { draggedItem, onDragStart, onDragEnd, onDrop } = useDragDrop()
const { canvasRef, zoom, pan, resetView, toCanvasCoords } = useCanvas()

const workflow = ref<Workflow | null>(null)
const selectedNode = ref<WorkflowNode | null>(null)
const selectedConnection = ref<Connection | null>(null)
const isConnecting = ref(false)
const connectionStart = ref<{ nodeId: string; anchor: string } | null>(null)
const showNodeConfig = ref(false)
const validationErrors = ref<string[]>([])

const nodes = computed(() => workflow.value?.nodes || [])
const connections = computed(() => workflow.value?.connections || [])
const canSave = computed(() => validationErrors.value.length === 0)

const loadWorkflow = async () => {
  if (props.workflowId) {
    workflow.value = await workflowsStore.getWorkflow(props.workflowId)
  } else {
    workflow.value = {
      id: '',
      name: 'New Workflow',
      trigger: {
        id: 'trigger-1',
        type: 'contact_created',
        position: { x: 100, y: 100 },
        config: {}
      },
      nodes: [],
      connections: [],
      active: false
    }
  }
}

const handleCanvasDrop = (event: DragEvent) => {
  if (!draggedItem.value || props.readonly) return

  const position = toCanvasCoords(event.clientX, event.clientY)
  const nodeType = draggedItem.value.type

  const newNode: WorkflowNode = {
    id: `node-${Date.now()}`,
    type: nodeType,
    position,
    config: {}
  }

  workflow.value?.nodes.push(newNode)
  emit('node-add', nodeType, position)
  onDragEnd()
}

const handleNodeSelect = (node: WorkflowNode) => {
  if (props.readonly) return
  selectedNode.value = node
  selectedConnection.value = null
  showNodeConfig.value = true
}

const handleNodeDelete = (nodeId: string) => {
  if (props.readonly || !workflow.value) return

  workflow.value.nodes = workflow.value.nodes.filter(n => n.id !== nodeId)
  workflow.value.connections = workflow.value.connections.filter(
    c => c.from !== nodeId && c.to !== nodeId
  )
}

const handleNodeMove = (nodeId: string, position: Position) => {
  if (props.readonly || !workflow.value) return

  const node = workflow.value.nodes.find(n => n.id === nodeId)
  if (node) {
    node.position = position
  }
}

const handleConnectionStart = (nodeId: string, anchor: string) => {
  if (props.readonly) return

  isConnecting.value = true
  connectionStart.value = { nodeId, anchor }
}

const handleConnectionEnd = (nodeId: string, anchor: string) => {
  if (!isConnecting.value || !connectionStart.value || !workflow.value) return

  const newConnection: Connection = {
    id: `conn-${Date.now()}`,
    from: connectionStart.value.nodeId,
    to: nodeId,
    fromAnchor: connectionStart.value.anchor,
    toAnchor: anchor
  }

  workflow.value.connections.push(newConnection)
  emit('connection-create', newConnection.from, newConnection.to)

  isConnecting.value = false
  connectionStart.value = null
}

const handleConnectionDelete = (connectionId: string) => {
  if (props.readonly || !workflow.value) return

  workflow.value.connections = workflow.value.connections.filter(
    c => c.id !== connectionId
  )
}

const handleConnectionSelect = (connection: Connection) => {
  if (props.readonly) return
  selectedConnection.value = connection
  selectedNode.value = null
}

const handleNodeConfigure = (node: WorkflowNode) => {
  selectedNode.value = node
  showNodeConfig.value = true
}

const handleNodeConfigSave = (config: Record<string, any>) => {
  if (selectedNode.value) {
    selectedNode.value.config = config
    showNodeConfig.value = false
    validateCurrentWorkflow()
  }
}

const validateCurrentWorkflow = () => {
  if (!workflow.value) return

  const errors = validateWorkflow(workflow.value)
  validationErrors.value = errors
}

const handleSave = async () => {
  if (!workflow.value || !canSave.value) return

  try {
    if (workflow.value.id) {
      await updateWorkflow(workflow.value.id, workflow.value)
    } else {
      await createWorkflow(workflow.value)
    }
    emit('save', workflow.value)
  } catch (error) {
    console.error('Failed to save workflow:', error)
  }
}

const getNodeComponent = (nodeType: string) => {
  if (nodeType.includes('trigger')) {
    return TriggerNode
  }
  return ActionNode
}

watch(
  () => workflow.value,
  () => {
    if (workflow.value) {
      validateCurrentWorkflow()
    }
  },
  { deep: true }
)

onMounted(() => {
  loadWorkflow()
})
</script>

<template>
  <div class="workflow-builder">
    <div class="toolbar">
      <div class="toolbar-left">
        <input
          v-model="workflow.name"
          class="workflow-name"
          :readonly="readonly"
          placeholder="Workflow Name"
        />
        <div v-if="validationErrors.length > 0" class="validation-errors">
          <span class="error-badge">{{ validationErrors.length }} errors</span>
        </div>
      </div>

      <div class="toolbar-right">
        <button class="btn-secondary" @click="resetView">
          Reset View
        </button>
        <button
          class="btn-primary"
          :disabled="!canSave || readonly"
          @click="handleSave"
        >
          Save Workflow
        </button>
      </div>
    </div>

    <div class="workspace">
      <NodePalette
        v-if="!readonly"
        :categories="[
          {
            name: 'Triggers',
            nodes: [
              { type: 'contact_created', label: 'Contact Created', icon: 'user-plus' },
              { type: 'form_submitted', label: 'Form Submitted', icon: 'file-text' },
              { type: 'email_received', label: 'Email Received', icon: 'mail' }
            ]
          },
          {
            name: 'Actions',
            nodes: [
              { type: 'send_email', label: 'Send Email', icon: 'send' },
              { type: 'send_sms', label: 'Send SMS', icon: 'message-square' },
              { type: 'create_task', label: 'Create Task', icon: 'check-square' },
              { type: 'update_contact', label: 'Update Contact', icon: 'user' },
              { type: 'wait', label: 'Wait', icon: 'clock' }
            ]
          },
          {
            name: 'Logic',
            nodes: [
              { type: 'condition', label: 'Condition', icon: 'git-branch' },
              { type: 'split', label: 'Split', icon: 'split' },
              { type: 'loop', label: 'Loop', icon: 'repeat' }
            ]
          }
        ]"
        @node-drag-start="onDragStart"
      />

      <div
        ref="canvasRef"
        class="canvas"
        :style="{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`
        }"
        @drop="handleCanvasDrop"
        @dragover.prevent
      >
        <svg class="connections-layer">
          <ConnectionLine
            v-for="connection in connections"
            :key="connection.id"
            :connection="connection"
            :selected="selectedConnection?.id === connection.id"
            @click="handleConnectionSelect(connection)"
            @delete="handleConnectionDelete(connection.id)"
          />
        </svg>

        <div class="nodes-layer">
          <component
            :is="TriggerNode"
            :node="workflow?.trigger"
            :selected="selectedNode?.id === workflow?.trigger.id"
            @configure="handleNodeConfigure(workflow.trigger)"
            @connect="handleConnectionStart"
          />

          <component
            v-for="node in nodes"
            :key="node.id"
            :is="getNodeComponent(node.type)"
            :node="node"
            :selected="selectedNode?.id === node.id"
            @configure="handleNodeConfigure(node)"
            @delete="handleNodeDelete(node.id)"
            @connect="handleConnectionStart"
            @move="handleNodeMove"
          />
        </div>

        <div v-if="isConnecting" class="connecting-overlay">
          <div class="connecting-message">
            Click on a node to complete the connection
          </div>
        </div>
      </div>
    </div>

    <teleport to="body">
      <div v-if="showNodeConfig" class="node-config-modal">
        <div class="modal-overlay" @click="showNodeConfig = false" />
        <div class="modal-content">
          <div class="modal-header">
            <h3>Configure {{ selectedNode?.type }}</h3>
            <button class="close-btn" @click="showNodeConfig = false">×</button>
          </div>
          <div class="modal-body">
            <!-- Dynamic node configuration form based on node type -->
            <div class="config-form">
              <pre>{{ selectedNode?.config }}</pre>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showNodeConfig = false">
              Cancel
            </button>
            <button class="btn-primary" @click="handleNodeConfigSave(selectedNode?.config || {})">
              Save
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.workflow-builder {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.workflow-name {
  font-size: 18px;
  font-weight: 600;
  border: none;
  background: transparent;
  padding: 8px;
  color: var(--text-primary);
}

.workflow-name:focus {
  outline: none;
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.validation-errors {
  display: flex;
  align-items: center;
}

.error-badge {
  background: var(--error-color);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.canvas {
  flex: 1;
  position: relative;
  background-color: var(--bg-canvas);
  background-image:
    linear-gradient(var(--grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: 20px 20px;
  overflow: auto;
  transform-origin: 0 0;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.connections-layer > * {
  pointer-events: all;
}

.nodes-layer {
  position: relative;
  width: 100%;
  height: 100%;
}

.connecting-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.connecting-message {
  background: var(--bg-secondary);
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.node-config-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 32px;
  height: 32px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-color-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary:hover {
  background: var(--bg-hover);
}
</style>
