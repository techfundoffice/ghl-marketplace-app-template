# GoHighLevel Clone - Quick Reference Guide

## Component Quick Reference

### Layout Components

| Component | File Path | Purpose | Key Props |
|-----------|-----------|---------|-----------|
| AppLayout | `components/layout/AppLayout.vue` | Main app wrapper | `sidebarCollapsed` |
| Sidebar | `components/layout/Sidebar.vue` | Navigation sidebar | `collapsed`, `items` |
| TopBar | `components/layout/TopBar.vue` | Top navigation bar | `showLocationSelector`, `showNotifications` |
| LocationSelector | `components/layout/LocationSelector.vue` | Location switcher | `modelValue`, `locations` |

### Dashboard Components

| Component | File Path | Purpose | Key Props |
|-----------|-----------|---------|-----------|
| DashboardGrid | `components/dashboard/DashboardGrid.vue` | Widget grid layout | `layout`, `editable` |
| WidgetCard | `components/dashboard/WidgetCard.vue` | Widget container | `title`, `loading`, `error` |
| ChartWidget | `components/dashboard/ChartWidget.vue` | Chart visualization | `type`, `data`, `options` |
| StatsWidget | `components/dashboard/StatsWidget.vue` | Statistics display | `title`, `value`, `change` |

### Contacts Components

| Component | File Path | Purpose | Key Props |
|-----------|-----------|---------|-----------|
| ContactsList | `components/contacts/ContactsList.vue` | Contacts table | `pageSize`, `defaultFilters` |
| ContactDetail | `components/contacts/ContactDetail.vue` | Contact details | `contactId`, `editable` |
| ContactForm | `components/contacts/ContactForm.vue` | Create/edit form | `contact`, `mode` |
| SmartFilters | `components/contacts/SmartFilters.vue` | Advanced filters | `modelValue`, `fields` |
| BulkActions | `components/contacts/BulkActions.vue` | Bulk operations | `selectedContacts`, `actions` |

### Conversations Components

| Component | File Path | Purpose | Key Props |
|-----------|-----------|---------|-----------|
| ConversationList | `components/conversations/ConversationList.vue` | Conversation list | `filter`, `searchQuery` |
| MessageThread | `components/conversations/MessageThread.vue` | Message display | `conversationId`, `autoScroll` |
| MessageComposer | `components/conversations/MessageComposer.vue` | Message editor | `conversationId`, `enableAttachments` |
| ChannelTabs | `components/conversations/ChannelTabs.vue` | Channel switcher | `modelValue`, `channels` |

### Opportunities Components

| Component | File Path | Purpose | Key Props |
|-----------|-----------|---------|-----------|
| PipelineBoard | `components/opportunities/PipelineBoard.vue` | Kanban board | `pipelineId`, `editable` |
| OpportunityCard | `components/opportunities/OpportunityCard.vue` | Opportunity card | `opportunity`, `draggable` |
| StageColumn | `components/opportunities/StageColumn.vue` | Pipeline stage | `stage`, `opportunities` |
| DealModal | `components/opportunities/DealModal.vue` | Deal form modal | `opportunity`, `mode`, `visible` |

### Calendar Components

| Component | File Path | Purpose | Key Props |
|-----------|-----------|---------|-----------|
| CalendarView | `components/calendar/CalendarView.vue` | Calendar display | `view`, `defaultDate`, `editable` |
| AppointmentModal | `components/calendar/AppointmentModal.vue` | Appointment form | `appointment`, `mode`, `visible` |
| AvailabilityEditor | `components/calendar/AvailabilityEditor.vue` | Availability setup | `userId`, `timezone` |
| BookingWidget | `components/calendar/BookingWidget.vue` | Public booking | `calendarId`, `theme` |

### Workflows Components

| Component | File Path | Purpose | Key Props |
|-----------|-----------|---------|-----------|
| WorkflowBuilder | `components/workflows/WorkflowBuilder.vue` | Workflow editor | `workflowId`, `readonly` |
| TriggerNode | `components/workflows/TriggerNode.vue` | Trigger node | `node`, `selected` |
| ActionNode | `components/workflows/ActionNode.vue` | Action node | `node`, `selected` |
| ConnectionLine | `components/workflows/ConnectionLine.vue` | Node connection | `connection`, `selected` |
| NodePalette | `components/workflows/NodePalette.vue` | Node palette | `categories`, `searchable` |

### Email Builder Components

| Component | File Path | Purpose | Key Props |
|-----------|-----------|---------|-----------|
| EmailEditor | `components/email-builder/EmailEditor.vue` | Email editor | `templateId`, `mode` |
| BlockPalette | `components/email-builder/BlockPalette.vue` | Block palette | `blocks`, `categories` |
| DragDropCanvas | `components/email-builder/DragDropCanvas.vue` | Drop canvas | `blocks`, `editable` |
| TemplateGallery | `components/email-builder/TemplateGallery.vue` | Template browser | `templates`, `filterable` |

### Forms/Funnels Components

| Component | File Path | Purpose | Key Props |
|-----------|-----------|---------|-----------|
| FormBuilder | `components/forms-funnels/FormBuilder.vue` | Form editor | `formId`, `mode` |
| TextField | `components/forms-funnels/FieldTypes/TextField.vue` | Text field | `field`, `modelValue` |
| PageBuilder | `components/forms-funnels/PageBuilder.vue` | Page editor | `funnelId`, `mode` |
| ElementPalette | `components/forms-funnels/ElementPalette.vue` | Element palette | `elements`, `categories` |

### Settings Components

| Component | File Path | Purpose | Key Props |
|-----------|-----------|---------|-----------|
| SettingsLayout | `components/settings/SettingsLayout.vue` | Settings wrapper | `defaultSection` |
| SettingsSidebar | `components/settings/SettingsSidebar.vue` | Settings nav | `sections`, `activeSection` |
| IntegrationCards | `components/settings/IntegrationCards.vue` | Integration list | `integrations`, `installed` |

---

## Composables Reference

### useAuth()
```typescript
const {
  login,           // (email, password) => Promise<void>
  logout,          // () => Promise<void>
  isAuthenticated, // ComputedRef<boolean>
  currentUser      // ComputedRef<User | null>
} = useAuth()
```

### useContacts()
```typescript
const {
  loading,         // Ref<boolean>
  error,           // Ref<string | null>
  fetchContacts,   // (filters?) => Promise<Contact[]>
  getContact,      // (id) => Promise<Contact>
  createContact,   // (contact) => Promise<Contact>
  updateContact,   // (id, updates) => Promise<Contact>
  deleteContact,   // (id) => Promise<void>
  bulkUpdate,      // (ids, updates) => Promise<void>
  addTags,         // (ids, tags) => Promise<void>
  searchContacts,  // (query) => Promise<Contact[]>
  exportContacts,  // (filters?) => Promise<Blob>
  importContacts   // (file) => Promise<ImportResult>
} = useContacts()
```

### useDragDrop()
```typescript
const {
  draggedItem,     // Ref<any>
  isDragging,      // Ref<boolean>
  onDragStart,     // (item, event?) => void
  onDragEnd,       // (event?) => void
  onDragOver,      // (target, event?) => void
  onDrop,          // (target, event?) => void
  isItemDragging,  // (item) => boolean
  reset            // () => void
} = useDragDrop(options?)
```

### useWorkflow()
```typescript
const {
  createWorkflow,  // (workflow) => Promise<Workflow>
  updateWorkflow,  // (id, updates) => Promise<Workflow>
  deleteWorkflow,  // (id) => Promise<void>
  validateWorkflow // (workflow) => string[]
} = useWorkflow()
```

### usePermissions()
```typescript
const {
  hasPermission,   // (permission) => boolean
  hasRole,         // (role) => boolean
  canEdit,         // (resource) => boolean
  canDelete        // (resource) => boolean
} = usePermissions()
```

### useNotifications()
```typescript
const {
  notifications,   // ComputedRef<Notification[]>
  unreadCount,     // ComputedRef<number>
  showNotification,// (notification) => void
  markAsRead,      // (id) => void
  markAllAsRead,   // () => void
  clearAll         // () => void
} = useNotifications()
```

### usePagination()
```typescript
const {
  currentPage,     // Ref<number>
  pageSize,        // Ref<number>
  totalPages,      // ComputedRef<number>
  goToPage,        // (page) => void
  nextPage,        // () => void
  prevPage,        // () => void
  setPageSize      // (size) => void
} = usePagination(options)
```

---

## Store Reference

### useAuthStore()
```typescript
const authStore = useAuthStore()

// State
authStore.user          // User | null
authStore.token         // string | null
authStore.isAuthenticated // boolean

// Actions
authStore.login(email, password)
authStore.logout()
authStore.refreshToken()
```

### useContactsStore()
```typescript
const contactsStore = useContactsStore()

// State
contactsStore.contacts         // Contact[]
contactsStore.selectedContacts // Contact[]
contactsStore.filters          // ContactFilters
contactsStore.pagination       // PaginationParams

// Getters
contactsStore.totalContacts
contactsStore.hasSelection
contactsStore.getContactById(id)

// Actions
contactsStore.setContacts(contacts)
contactsStore.addContact(contact)
contactsStore.updateContact(id, updates)
contactsStore.removeContact(id)
contactsStore.selectContact(contact)
contactsStore.clearSelection()
contactsStore.setFilters(filters)
```

### useConversationsStore()
```typescript
const conversationsStore = useConversationsStore()

// State
conversationsStore.conversations      // Conversation[]
conversationsStore.activeConversation // Conversation | null
conversationsStore.messages           // Record<string, Message[]>
conversationsStore.unreadCount        // number

// Actions
conversationsStore.fetchConversations(filter?)
conversationsStore.sendMessage(conversationId, message)
conversationsStore.markAsRead(conversationId)
```

### useWorkflowsStore()
```typescript
const workflowsStore = useWorkflowsStore()

// State
workflowsStore.workflows         // Workflow[]
workflowsStore.activeWorkflow    // Workflow | null
workflowsStore.availableNodeTypes // NodeType[]

// Getters
workflowsStore.getWorkflowById(id)
workflowsStore.triggerNodeTypes
workflowsStore.actionNodeTypes

// Actions
workflowsStore.createWorkflow(workflow)
workflowsStore.updateWorkflow(id, updates)
workflowsStore.deleteWorkflow(id)
workflowsStore.addNode(node)
workflowsStore.addConnection(connection)
```

---

## Common Patterns

### Fetching Data on Mount
```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useContacts } from '@/composables/useContacts'

const { fetchContacts, loading } = useContacts()

onMounted(async () => {
  await fetchContacts()
})
</script>
```

### Form Handling with v-model
```vue
<script setup lang="ts">
import { ref } from 'vue'

interface FormData {
  name: string
  email: string
}

const formData = ref<FormData>({
  name: '',
  email: ''
})

const handleSubmit = () => {
  console.log('Form data:', formData.value)
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="formData.name" type="text" />
    <input v-model="formData.email" type="email" />
    <button type="submit">Submit</button>
  </form>
</template>
```

### Watching for Changes
```vue
<script setup lang="ts">
import { ref, watch } from 'vue'

const searchQuery = ref('')

watch(searchQuery, (newValue) => {
  console.log('Search query changed:', newValue)
  // Perform search
})
</script>
```

### Conditional Rendering
```vue
<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else>
    <ContactsList :contacts="contacts" />
  </div>
</template>
```

### List Rendering
```vue
<template>
  <ul>
    <li v-for="contact in contacts" :key="contact.id">
      {{ contact.firstName }} {{ contact.lastName }}
    </li>
  </ul>
</template>
```

### Event Handling
```vue
<template>
  <button @click="handleClick">Click Me</button>
  <input @input="handleInput" />
  <form @submit.prevent="handleSubmit">
</template>

<script setup lang="ts">
const handleClick = () => {
  console.log('Button clicked')
}

const handleInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  console.log('Input value:', value)
}

const handleSubmit = () => {
  console.log('Form submitted')
}
</script>
```

### Computed Properties
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

const fullName = computed(() => `${firstName.value} ${lastName.value}`)
</script>

<template>
  <div>{{ fullName }}</div>
</template>
```

### Parent-Child Communication
```vue
<!-- Parent -->
<script setup lang="ts">
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

const handleEvent = (data: any) => {
  console.log('Event from child:', data)
}
</script>

<template>
  <ChildComponent
    :prop-value="someValue"
    @custom-event="handleEvent"
  />
</template>

<!-- Child -->
<script setup lang="ts">
interface Props {
  propValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'custom-event': [data: any]
}>()

const triggerEvent = () => {
  emit('custom-event', { message: 'Hello from child' })
}
</script>
```

---

## Common TypeScript Patterns

### Component Props with Defaults
```typescript
interface ComponentProps {
  title: string
  count?: number
  enabled?: boolean
}

const props = withDefaults(defineProps<ComponentProps>(), {
  count: 0,
  enabled: true
})
```

### Generic Components
```typescript
interface ListProps<T> {
  items: T[]
  keyField: keyof T
}

const props = defineProps<ListProps<any>>()
```

### Type Guards
```typescript
function isContact(obj: any): obj is Contact {
  return obj && typeof obj.firstName === 'string'
}
```

---

## Routing Patterns

### Programmatic Navigation
```typescript
import { useRouter } from 'vue-router'

const router = useRouter()

// Navigate to route
router.push({ name: 'contact-detail', params: { id: '123' } })

// With query params
router.push({ name: 'contacts', query: { filter: 'active' } })

// Go back
router.back()
```

### Route Guards
```typescript
// In component
import { onBeforeRouteLeave } from 'vue-router'

onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges.value) {
    return confirm('You have unsaved changes. Leave anyway?')
  }
})
```

---

## API Call Patterns

### Basic GET Request
```typescript
const { data, error } = await api.get('/contacts')
```

### POST with Data
```typescript
const { data } = await api.post('/contacts', {
  firstName: 'John',
  lastName: 'Doe'
})
```

### Error Handling
```typescript
try {
  const { data } = await api.get('/contacts')
  contacts.value = data
} catch (error) {
  console.error('Failed to fetch contacts:', error)
  errorMessage.value = 'Failed to load contacts'
}
```

---

## Testing Patterns

### Component Test
```typescript
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ContactsList from '@/components/contacts/ContactsList.vue'

describe('ContactsList', () => {
  it('renders contacts', () => {
    const wrapper = mount(ContactsList, {
      props: {
        contacts: [{ id: '1', firstName: 'John', lastName: 'Doe' }]
      }
    })

    expect(wrapper.text()).toContain('John Doe')
  })
})
```

### Composable Test
```typescript
import { describe, it, expect } from 'vitest'
import { useContacts } from '@/composables/useContacts'

describe('useContacts', () => {
  it('fetches contacts', async () => {
    const { fetchContacts, contacts } = useContacts()
    await fetchContacts()
    expect(contacts.value).toBeDefined()
  })
})
```

---

This quick reference provides the most commonly used patterns and APIs for the GoHighLevel clone Vue.js application.
