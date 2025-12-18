import { ref, Ref } from 'vue'

export interface DragDropOptions {
  onDragStart?: (item: any) => void
  onDragEnd?: (item: any) => void
  onDrop?: (item: any, target: any) => void
}

export function useDragDrop(options: DragDropOptions = {}) {
  const draggedItem = ref<any>(null)
  const dragOverTarget = ref<any>(null)
  const isDragging = ref(false)

  /**
   * Handle drag start event
   */
  const onDragStart = (item: any, event?: DragEvent) => {
    draggedItem.value = item
    isDragging.value = true

    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('application/json', JSON.stringify(item))
    }

    options.onDragStart?.(item)
  }

  /**
   * Handle drag end event
   */
  const onDragEnd = (event?: DragEvent) => {
    const item = draggedItem.value
    draggedItem.value = null
    dragOverTarget.value = null
    isDragging.value = false

    options.onDragEnd?.(item)
  }

  /**
   * Handle drag over event (for drop zones)
   */
  const onDragOver = (target: any, event?: DragEvent) => {
    event?.preventDefault()
    dragOverTarget.value = target

    if (event?.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }

  /**
   * Handle drag leave event
   */
  const onDragLeave = () => {
    dragOverTarget.value = null
  }

  /**
   * Handle drop event
   */
  const onDrop = (target: any, event?: DragEvent) => {
    event?.preventDefault()

    let item = draggedItem.value

    // Try to get data from event if not set
    if (!item && event?.dataTransfer) {
      try {
        const data = event.dataTransfer.getData('application/json')
        if (data) {
          item = JSON.parse(data)
        }
      } catch (e) {
        console.error('Failed to parse drag data:', e)
      }
    }

    if (item) {
      options.onDrop?.(item, target)
    }

    draggedItem.value = null
    dragOverTarget.value = null
    isDragging.value = false
  }

  /**
   * Check if an item is currently being dragged
   */
  const isItemDragging = (item: any): boolean => {
    return isDragging.value && draggedItem.value === item
  }

  /**
   * Check if a target is the current drag over target
   */
  const isTargetActive = (target: any): boolean => {
    return dragOverTarget.value === target
  }

  /**
   * Reset drag state
   */
  const reset = () => {
    draggedItem.value = null
    dragOverTarget.value = null
    isDragging.value = false
  }

  return {
    draggedItem,
    dragOverTarget,
    isDragging,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    isItemDragging,
    isTargetActive,
    reset
  }
}

/**
 * Composable for sortable lists
 */
export function useSortable<T>(
  items: Ref<T[]>,
  options: {
    onReorder?: (items: T[]) => void
    getKey?: (item: T) => string | number
  } = {}
) {
  const { draggedItem, onDragStart, onDragEnd, onDragOver, onDrop } = useDragDrop()
  const draggedIndex = ref<number | null>(null)
  const dropIndex = ref<number | null>(null)

  const handleDragStart = (item: T, index: number, event?: DragEvent) => {
    draggedIndex.value = index
    onDragStart(item, event)
  }

  const handleDragOver = (index: number, event?: DragEvent) => {
    event?.preventDefault()
    dropIndex.value = index
  }

  const handleDrop = (index: number, event?: DragEvent) => {
    event?.preventDefault()

    if (draggedIndex.value === null || draggedIndex.value === index) {
      reset()
      return
    }

    const newItems = [...items.value]
    const [movedItem] = newItems.splice(draggedIndex.value, 1)
    newItems.splice(index, 0, movedItem)

    items.value = newItems
    options.onReorder?.(newItems)

    reset()
  }

  const handleDragEnd = () => {
    reset()
    onDragEnd()
  }

  const reset = () => {
    draggedIndex.value = null
    dropIndex.value = null
  }

  const isDraggingItem = (index: number): boolean => {
    return draggedIndex.value === index
  }

  const isDropTarget = (index: number): boolean => {
    return dropIndex.value === index
  }

  return {
    draggedItem,
    draggedIndex,
    dropIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    isDraggingItem,
    isDropTarget,
    reset
  }
}

/**
 * Composable for draggable items between containers
 */
export function useDraggableContainers<T>(
  containers: Ref<Record<string, T[]>>,
  options: {
    onMove?: (item: T, fromContainer: string, toContainer: string) => void
  } = {}
) {
  const { draggedItem, onDragStart, onDragEnd, onDrop } = useDragDrop()
  const sourceContainer = ref<string | null>(null)

  const handleDragStart = (item: T, containerId: string, event?: DragEvent) => {
    sourceContainer.value = containerId
    onDragStart(item, event)
  }

  const handleDrop = (targetContainerId: string, event?: DragEvent) => {
    if (!draggedItem.value || !sourceContainer.value) {
      return
    }

    // Don't do anything if dropped in the same container
    if (sourceContainer.value === targetContainerId) {
      reset()
      return
    }

    // Remove from source container
    const sourceItems = containers.value[sourceContainer.value]
    const itemIndex = sourceItems.findIndex(i => i === draggedItem.value)

    if (itemIndex !== -1) {
      const [item] = sourceItems.splice(itemIndex, 1)

      // Add to target container
      if (!containers.value[targetContainerId]) {
        containers.value[targetContainerId] = []
      }
      containers.value[targetContainerId].push(item)

      options.onMove?.(item, sourceContainer.value, targetContainerId)
    }

    onDrop(targetContainerId, event)
    reset()
  }

  const handleDragEnd = () => {
    reset()
    onDragEnd()
  }

  const reset = () => {
    sourceContainer.value = null
  }

  return {
    draggedItem,
    sourceContainer,
    handleDragStart,
    handleDrop,
    handleDragEnd,
    reset
  }
}
