# GoHighLevel Clone - Vue 3 Component Architecture

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.vue
│   │   ├── Sidebar.vue
│   │   ├── TopBar.vue
│   │   └── LocationSelector.vue
│   ├── dashboard/
│   │   ├── DashboardGrid.vue
│   │   ├── WidgetCard.vue
│   │   ├── ChartWidget.vue
│   │   └── StatsWidget.vue
│   ├── contacts/
│   │   ├── ContactsList.vue
│   │   ├── ContactDetail.vue
│   │   ├── ContactForm.vue
│   │   ├── SmartFilters.vue
│   │   └── BulkActions.vue
│   ├── conversations/
│   │   ├── ConversationList.vue
│   │   ├── MessageThread.vue
│   │   ├── MessageComposer.vue
│   │   └── ChannelTabs.vue
│   ├── opportunities/
│   │   ├── PipelineBoard.vue
│   │   ├── OpportunityCard.vue
│   │   ├── StageColumn.vue
│   │   └── DealModal.vue
│   ├── calendar/
│   │   ├── CalendarView.vue
│   │   ├── AppointmentModal.vue
│   │   ├── AvailabilityEditor.vue
│   │   └── BookingWidget.vue
│   ├── workflows/
│   │   ├── WorkflowBuilder.vue
│   │   ├── TriggerNode.vue
│   │   ├── ActionNode.vue
│   │   ├── ConnectionLine.vue
│   │   └── NodePalette.vue
│   ├── email-builder/
│   │   ├── EmailEditor.vue
│   │   ├── BlockPalette.vue
│   │   ├── DragDropCanvas.vue
│   │   └── TemplateGallery.vue
│   ├── forms-funnels/
│   │   ├── FormBuilder.vue
│   │   ├── FieldTypes/
│   │   │   ├── TextField.vue
│   │   │   ├── SelectField.vue
│   │   │   ├── DateField.vue
│   │   │   └── FileField.vue
│   │   ├── PageBuilder.vue
│   │   └── ElementPalette.vue
│   └── settings/
│       ├── SettingsLayout.vue
│       ├── SettingsSidebar.vue
│       └── IntegrationCards.vue
├── composables/
│   ├── useAuth.ts
│   ├── useContacts.ts
│   ├── useConversations.ts
│   ├── useCalendar.ts
│   ├── useDragDrop.ts
│   ├── useWorkflow.ts
│   ├── useNotifications.ts
│   └── usePermissions.ts
├── stores/
│   ├── auth.ts
│   ├── contacts.ts
│   ├── conversations.ts
│   ├── opportunities.ts
│   ├── calendar.ts
│   ├── workflows.ts
│   ├── settings.ts
│   └── ui.ts
└── types/
    ├── contact.ts
    ├── conversation.ts
    ├── opportunity.ts
    ├── calendar.ts
    ├── workflow.ts
    └── common.ts
```

## Naming Conventions

### Components
- PascalCase for component names (e.g., `ContactsList.vue`)
- Descriptive, self-documenting names
- Group related components in feature folders

### Composables
- camelCase with `use` prefix (e.g., `useContacts.ts`)
- Single responsibility principle
- Reusable across components

### Stores
- camelCase for store names (e.g., `contacts.ts`)
- Feature-based organization
- Use Pinia conventions

### Types
- PascalCase for interfaces/types
- Organized by domain
- Shared types in common.ts

## Component Specifications

### 1. Layout Components

#### AppLayout.vue
**Purpose**: Main application wrapper with responsive layout

**Props**:
```typescript
interface AppLayoutProps {
  sidebarCollapsed?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'sidebar-toggle': []
}>()
```

**Composables**:
- `useAuth()` - Authentication state
- `usePermissions()` - Role-based access

**Store Connections**:
- `useAuthStore()` - User authentication
- `useUIStore()` - Layout preferences

**Template Structure**:
```vue
<template>
  <div class="app-layout">
    <Sidebar :collapsed="sidebarCollapsed" @toggle="emit('sidebar-toggle')" />
    <div class="main-content">
      <TopBar />
      <RouterView />
    </div>
  </div>
</template>
```

---

#### Sidebar.vue
**Purpose**: Navigation sidebar with collapsible menu

**Props**:
```typescript
interface SidebarProps {
  collapsed?: boolean
  items?: NavigationItem[]
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'toggle': []
  'navigate': [path: string]
}>()
```

**Composables**:
- `useRouter()` - Navigation
- `usePermissions()` - Menu filtering

**Store Connections**:
- `useAuthStore()` - User role
- `useUIStore()` - Sidebar state

---

#### TopBar.vue
**Purpose**: Top navigation with location selector and user menu

**Props**:
```typescript
interface TopBarProps {
  showLocationSelector?: boolean
  showNotifications?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'location-change': [locationId: string]
  'notification-click': [notification: Notification]
}>()
```

**Composables**:
- `useAuth()` - User info
- `useNotifications()` - Real-time notifications

**Store Connections**:
- `useAuthStore()` - User data
- `useSettingsStore()` - Current location

---

#### LocationSelector.vue
**Purpose**: Dropdown to switch between business locations

**Props**:
```typescript
interface LocationSelectorProps {
  modelValue: string
  locations: Location[]
  disabled?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
```

**Composables**:
- `useSettings()` - Location management

**Store Connections**:
- `useSettingsStore()` - Locations list

---

### 2. Dashboard Components

#### DashboardGrid.vue
**Purpose**: Responsive grid layout for dashboard widgets

**Props**:
```typescript
interface DashboardGridProps {
  layout?: GridLayout[]
  editable?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'layout-change': [layout: GridLayout[]]
  'widget-add': [widgetType: string]
  'widget-remove': [widgetId: string]
}>()
```

**Composables**:
- `useDragDrop()` - Grid rearrangement
- `usePermissions()` - Edit permissions

**Store Connections**:
- `useUIStore()` - Dashboard configuration

---

#### WidgetCard.vue
**Purpose**: Base container for dashboard widgets

**Props**:
```typescript
interface WidgetCardProps {
  title: string
  loading?: boolean
  error?: string
  actions?: WidgetAction[]
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'refresh': []
  'settings': []
  'remove': []
}>()
```

**Composables**:
- None (presentational component)

**Store Connections**:
- None

---

#### ChartWidget.vue
**Purpose**: Chart visualization widget (Line, Bar, Pie)

**Props**:
```typescript
interface ChartWidgetProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut'
  data: ChartData
  options?: ChartOptions
  title: string
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'data-point-click': [point: ChartDataPoint]
}>()
```

**Composables**:
- `useChart()` - Chart.js integration

**Store Connections**:
- Feature-specific stores for data

---

#### StatsWidget.vue
**Purpose**: Display key metrics and statistics

**Props**:
```typescript
interface StatsWidgetProps {
  title: string
  value: number | string
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon?: string
  loading?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'click': []
}>()
```

**Composables**:
- None (presentational component)

**Store Connections**:
- None

---

### 3. Contacts Components

#### ContactsList.vue
**Purpose**: Paginated, filterable contacts table

**Props**:
```typescript
interface ContactsListProps {
  pageSize?: number
  defaultFilters?: ContactFilters
  selectable?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'contact-select': [contact: Contact]
  'contacts-selected': [contacts: Contact[]]
  'filter-change': [filters: ContactFilters]
}>()
```

**Composables**:
- `useContacts()` - Data fetching
- `usePagination()` - Table pagination

**Store Connections**:
- `useContactsStore()` - Contacts data

---

#### ContactDetail.vue
**Purpose**: Detailed view of a single contact

**Props**:
```typescript
interface ContactDetailProps {
  contactId: string
  editable?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'edit': [contact: Contact]
  'delete': [contactId: string]
  'close': []
}>()
```

**Composables**:
- `useContacts()` - Contact operations
- `usePermissions()` - Edit permissions

**Store Connections**:
- `useContactsStore()` - Contact data
- `useConversationsStore()` - Related conversations

---

#### ContactForm.vue
**Purpose**: Create/edit contact form

**Props**:
```typescript
interface ContactFormProps {
  contact?: Contact
  mode: 'create' | 'edit'
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'submit': [contact: Contact]
  'cancel': []
}>()
```

**Composables**:
- `useFormValidation()` - Form validation
- `useContacts()` - Save operations

**Store Connections**:
- `useContactsStore()` - Contact creation/update

---

#### SmartFilters.vue
**Purpose**: Advanced filtering UI for contacts

**Props**:
```typescript
interface SmartFiltersProps {
  modelValue: ContactFilters
  fields: FilterField[]
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'update:modelValue': [filters: ContactFilters]
  'apply': [filters: ContactFilters]
  'reset': []
}>()
```

**Composables**:
- `useFilters()` - Filter management

**Store Connections**:
- `useContactsStore()` - Saved filters

---

#### BulkActions.vue
**Purpose**: Bulk operations on selected contacts

**Props**:
```typescript
interface BulkActionsProps {
  selectedContacts: Contact[]
  actions: BulkAction[]
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'action-execute': [action: string, contacts: Contact[]]
}>()
```

**Composables**:
- `useContacts()` - Bulk operations
- `useNotifications()` - Success/error messages

**Store Connections**:
- `useContactsStore()` - Batch updates

---

### 4. Conversations Components

#### ConversationList.vue
**Purpose**: List of conversations with search and filters

**Props**:
```typescript
interface ConversationListProps {
  filter?: 'all' | 'unread' | 'assigned' | 'unassigned'
  searchQuery?: string
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'conversation-select': [conversation: Conversation]
  'filter-change': [filter: string]
}>()
```

**Composables**:
- `useConversations()` - Real-time conversations
- `useWebSocket()` - Live updates

**Store Connections**:
- `useConversationsStore()` - Conversations data

---

#### MessageThread.vue
**Purpose**: Display message thread for a conversation

**Props**:
```typescript
interface MessageThreadProps {
  conversationId: string
  autoScroll?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'message-send': [message: Message]
  'load-more': []
}>()
```

**Composables**:
- `useConversations()` - Message fetching
- `useWebSocket()` - Real-time messages
- `useInfiniteScroll()` - Load more messages

**Store Connections**:
- `useConversationsStore()` - Messages data

---

#### MessageComposer.vue
**Purpose**: Rich text editor for composing messages

**Props**:
```typescript
interface MessageComposerProps {
  conversationId: string
  placeholder?: string
  enableAttachments?: boolean
  enableTemplates?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'send': [message: MessagePayload]
  'typing': []
}>()
```

**Composables**:
- `useTextEditor()` - Rich text editing
- `useFileUpload()` - Attachment handling

**Store Connections**:
- `useConversationsStore()` - Send message

---

#### ChannelTabs.vue
**Purpose**: Switch between communication channels (SMS, Email, WhatsApp)

**Props**:
```typescript
interface ChannelTabsProps {
  modelValue: Channel
  channels: Channel[]
  unreadCounts?: Record<string, number>
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'update:modelValue': [channel: Channel]
}>()
```

**Composables**:
- `useConversations()` - Channel filtering

**Store Connections**:
- `useConversationsStore()` - Unread counts

---

### 5. Opportunities Components

#### PipelineBoard.vue
**Purpose**: Kanban-style pipeline board

**Props**:
```typescript
interface PipelineBoardProps {
  pipelineId: string
  editable?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'opportunity-move': [opportunityId: string, stageId: string]
  'opportunity-create': [stageId: string]
  'stage-add': []
}>()
```

**Composables**:
- `useDragDrop()` - Drag and drop
- `useOpportunities()` - Pipeline data

**Store Connections**:
- `useOpportunitiesStore()` - Opportunities and stages

---

#### OpportunityCard.vue
**Purpose**: Card representing an opportunity in the pipeline

**Props**:
```typescript
interface OpportunityCardProps {
  opportunity: Opportunity
  draggable?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'click': [opportunity: Opportunity]
  'edit': [opportunity: Opportunity]
  'delete': [opportunityId: string]
}>()
```

**Composables**:
- None (presentational component)

**Store Connections**:
- None

---

#### StageColumn.vue
**Purpose**: Pipeline stage column containing opportunity cards

**Props**:
```typescript
interface StageColumnProps {
  stage: PipelineStage
  opportunities: Opportunity[]
  droppable?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'opportunity-drop': [opportunityId: string]
  'add-opportunity': []
}>()
```

**Composables**:
- `useDragDrop()` - Drop zone

**Store Connections**:
- None (receives data from parent)

---

#### DealModal.vue
**Purpose**: Modal for creating/editing opportunities

**Props**:
```typescript
interface DealModalProps {
  opportunity?: Opportunity
  mode: 'create' | 'edit'
  visible: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'submit': [opportunity: Opportunity]
  'close': []
}>()
```

**Composables**:
- `useFormValidation()` - Form validation
- `useOpportunities()` - CRUD operations

**Store Connections**:
- `useOpportunitiesStore()` - Save opportunity
- `useContactsStore()` - Contact lookup

---

### 6. Calendar Components

#### CalendarView.vue
**Purpose**: Full calendar view with appointments

**Props**:
```typescript
interface CalendarViewProps {
  view?: 'month' | 'week' | 'day' | 'agenda'
  defaultDate?: Date
  editable?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'appointment-click': [appointment: Appointment]
  'slot-click': [date: Date, time?: string]
  'date-change': [date: Date]
}>()
```

**Composables**:
- `useCalendar()` - Calendar data
- `useDragDrop()` - Appointment rescheduling

**Store Connections**:
- `useCalendarStore()` - Appointments data

---

#### AppointmentModal.vue
**Purpose**: Create/edit appointment modal

**Props**:
```typescript
interface AppointmentModalProps {
  appointment?: Appointment
  mode: 'create' | 'edit'
  visible: boolean
  defaultDate?: Date
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'submit': [appointment: Appointment]
  'delete': [appointmentId: string]
}>()
```

**Composables**:
- `useFormValidation()` - Validation
- `useCalendar()` - Appointment operations

**Store Connections**:
- `useCalendarStore()` - Save appointment
- `useContactsStore()` - Contact search

---

#### AvailabilityEditor.vue
**Purpose**: Edit staff availability and working hours

**Props**:
```typescript
interface AvailabilityEditorProps {
  userId: string
  timezone?: string
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'save': [availability: Availability]
}>()
```

**Composables**:
- `useCalendar()` - Availability management

**Store Connections**:
- `useCalendarStore()` - Availability rules
- `useSettingsStore()` - User settings

---

#### BookingWidget.vue
**Purpose**: Public-facing appointment booking widget

**Props**:
```typescript
interface BookingWidgetProps {
  calendarId: string
  theme?: 'light' | 'dark'
  showTimezone?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'booking-complete': [booking: Booking]
}>()
```

**Composables**:
- `usePublicCalendar()` - Public API
- `useFormValidation()` - Form validation

**Store Connections**:
- None (public widget, uses API directly)

---

### 7. Workflows Components

#### WorkflowBuilder.vue
**Purpose**: Visual workflow builder with node-based editor

**Props**:
```typescript
interface WorkflowBuilderProps {
  workflowId?: string
  readonly?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'save': [workflow: Workflow]
  'node-add': [nodeType: string, position: Position]
  'connection-create': [from: string, to: string]
}>()
```

**Composables**:
- `useWorkflow()` - Workflow engine
- `useDragDrop()` - Node positioning
- `useCanvas()` - Canvas interactions

**Store Connections**:
- `useWorkflowsStore()` - Workflow data

---

#### TriggerNode.vue
**Purpose**: Workflow trigger node (entry point)

**Props**:
```typescript
interface TriggerNodeProps {
  node: WorkflowNode
  selected?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'configure': [node: WorkflowNode]
  'delete': [nodeId: string]
  'connect': [nodeId: string, anchor: string]
}>()
```

**Composables**:
- None (presentational component)

**Store Connections**:
- None

---

#### ActionNode.vue
**Purpose**: Workflow action node (steps)

**Props**:
```typescript
interface ActionNodeProps {
  node: WorkflowNode
  selected?: boolean
  error?: string
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'configure': [node: WorkflowNode]
  'delete': [nodeId: string]
  'connect': [nodeId: string, anchor: string]
}>()
```

**Composables**:
- None (presentational component)

**Store Connections**:
- None

---

#### ConnectionLine.vue
**Purpose**: Visual connection between workflow nodes

**Props**:
```typescript
interface ConnectionLineProps {
  connection: Connection
  selected?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'delete': [connectionId: string]
  'click': [connection: Connection]
}>()
```

**Composables**:
- None (presentational component)

**Store Connections**:
- None

---

#### NodePalette.vue
**Purpose**: Draggable palette of workflow nodes

**Props**:
```typescript
interface NodePaletteProps {
  categories: NodeCategory[]
  searchable?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'node-drag-start': [nodeType: string]
}>()
```

**Composables**:
- `useDragDrop()` - Drag from palette

**Store Connections**:
- `useWorkflowsStore()` - Available node types

---

### 8. Email Builder Components

#### EmailEditor.vue
**Purpose**: Drag-and-drop email template builder

**Props**:
```typescript
interface EmailEditorProps {
  templateId?: string
  mode: 'create' | 'edit'
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'save': [template: EmailTemplate]
  'preview': [html: string]
  'send-test': [email: string]
}>()
```

**Composables**:
- `useDragDrop()` - Block placement
- `useEmailBuilder()` - Template operations

**Store Connections**:
- `useEmailStore()` - Template storage

---

#### BlockPalette.vue
**Purpose**: Palette of email content blocks

**Props**:
```typescript
interface BlockPaletteProps {
  blocks: EmailBlock[]
  categories?: string[]
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'block-drag-start': [blockType: string]
}>()
```

**Composables**:
- `useDragDrop()` - Drag blocks

**Store Connections**:
- None

---

#### DragDropCanvas.vue
**Purpose**: Drop zone canvas for email blocks

**Props**:
```typescript
interface DragDropCanvasProps {
  blocks: PlacedBlock[]
  editable?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'block-drop': [block: EmailBlock, position: number]
  'block-move': [blockId: string, newPosition: number]
  'block-edit': [blockId: string]
  'block-delete': [blockId: string]
}>()
```

**Composables**:
- `useDragDrop()` - Drop handling
- `useEmailBuilder()` - Block management

**Store Connections**:
- None (parent manages state)

---

#### TemplateGallery.vue
**Purpose**: Browse and select email templates

**Props**:
```typescript
interface TemplateGalleryProps {
  templates: EmailTemplate[]
  filterable?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'template-select': [template: EmailTemplate]
  'template-preview': [templateId: string]
}>()
```

**Composables**:
- `useSearch()` - Template search

**Store Connections**:
- `useEmailStore()` - Templates

---

### 9. Forms/Funnels Components

#### FormBuilder.vue
**Purpose**: Visual form builder

**Props**:
```typescript
interface FormBuilderProps {
  formId?: string
  mode: 'create' | 'edit'
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'save': [form: Form]
  'field-add': [fieldType: string]
  'preview': []
}>()
```

**Composables**:
- `useDragDrop()` - Field placement
- `useFormBuilder()` - Form operations

**Store Connections**:
- `useFormsStore()` - Form storage

---

#### FieldTypes/TextField.vue
**Purpose**: Text input field component

**Props**:
```typescript
interface TextFieldProps {
  field: FormField
  modelValue?: string
  readonly?: boolean
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'configure': [field: FormField]
}>()
```

**Composables**:
- `useFormValidation()` - Validation

**Store Connections**:
- None

---

#### PageBuilder.vue
**Purpose**: Multi-page funnel builder

**Props**:
```typescript
interface PageBuilderProps {
  funnelId?: string
  mode: 'create' | 'edit'
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'save': [funnel: Funnel]
  'page-add': []
  'page-delete': [pageId: string]
  'preview': [pageId?: string]
}>()
```

**Composables**:
- `useDragDrop()` - Element placement
- `usePageBuilder()` - Page operations

**Store Connections**:
- `useFunnelsStore()` - Funnel storage

---

#### ElementPalette.vue
**Purpose**: Palette of page elements (text, image, video, etc.)

**Props**:
```typescript
interface ElementPaletteProps {
  elements: PageElement[]
  categories?: string[]
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'element-drag-start': [elementType: string]
}>()
```

**Composables**:
- `useDragDrop()` - Drag elements

**Store Connections**:
- None

---

### 10. Settings Components

#### SettingsLayout.vue
**Purpose**: Settings page layout with sidebar navigation

**Props**:
```typescript
interface SettingsLayoutProps {
  defaultSection?: string
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'section-change': [section: string]
}>()
```

**Composables**:
- `useRouter()` - Section navigation
- `usePermissions()` - Settings access

**Store Connections**:
- `useSettingsStore()` - Settings data

---

#### SettingsSidebar.vue
**Purpose**: Settings navigation sidebar

**Props**:
```typescript
interface SettingsSidebarProps {
  sections: SettingsSection[]
  activeSection: string
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'navigate': [section: string]
}>()
```

**Composables**:
- None (presentational component)

**Store Connections**:
- None

---

#### IntegrationCards.vue
**Purpose**: Display available integrations

**Props**:
```typescript
interface IntegrationCardsProps {
  integrations: Integration[]
  installed?: string[]
}
```

**Emits**:
```typescript
const emit = defineEmits<{
  'install': [integrationId: string]
  'configure': [integrationId: string]
  'uninstall': [integrationId: string]
}>()
```

**Composables**:
- `useIntegrations()` - Integration management

**Store Connections**:
- `useSettingsStore()` - Integrations

---

## Type Definitions

### Common Types (types/common.ts)
```typescript
export interface Location {
  id: string
  name: string
  timezone: string
  address?: string
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
}

export type UserRole = 'admin' | 'user' | 'agent'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number'
  options?: { label: string; value: any }[]
}
```

### Contact Types (types/contact.ts)
```typescript
export interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  tags: string[]
  customFields: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ContactFilters {
  search?: string
  tags?: string[]
  dateRange?: { from: Date; to: Date }
  customFields?: Record<string, any>
}

export interface BulkAction {
  id: string
  label: string
  icon: string
  requiresConfirmation: boolean
}
```

### Conversation Types (types/conversation.ts)
```typescript
export type Channel = 'sms' | 'email' | 'whatsapp' | 'facebook' | 'instagram'

export interface Conversation {
  id: string
  contactId: string
  channel: Channel
  status: 'open' | 'closed'
  assignedTo?: string
  unreadCount: number
  lastMessage?: Message
  createdAt: Date
}

export interface Message {
  id: string
  conversationId: string
  content: string
  attachments?: Attachment[]
  direction: 'inbound' | 'outbound'
  status: 'sent' | 'delivered' | 'read' | 'failed'
  sentAt: Date
}

export interface Attachment {
  id: string
  url: string
  type: 'image' | 'video' | 'document'
  size: number
  name: string
}
```

### Opportunity Types (types/opportunity.ts)
```typescript
export interface Opportunity {
  id: string
  name: string
  contactId: string
  pipelineId: string
  stageId: string
  value: number
  expectedCloseDate?: Date
  probability?: number
  notes?: string
  createdAt: Date
}

export interface PipelineStage {
  id: string
  name: string
  order: number
  color: string
}
```

### Calendar Types (types/calendar.ts)
```typescript
export interface Appointment {
  id: string
  title: string
  contactId?: string
  startTime: Date
  endTime: Date
  location?: string
  notes?: string
  attendees?: string[]
  calendarId: string
}

export interface Availability {
  userId: string
  timezone: string
  schedule: WeeklySchedule
  exceptions: DateException[]
}

export interface WeeklySchedule {
  [day: string]: TimeSlot[]
}

export interface TimeSlot {
  start: string // "09:00"
  end: string   // "17:00"
}
```

### Workflow Types (types/workflow.ts)
```typescript
export interface Workflow {
  id: string
  name: string
  description?: string
  trigger: WorkflowNode
  nodes: WorkflowNode[]
  connections: Connection[]
  active: boolean
}

export interface WorkflowNode {
  id: string
  type: string
  position: Position
  config: Record<string, any>
}

export interface Connection {
  id: string
  from: string
  to: string
  fromAnchor: string
  toAnchor: string
}

export interface Position {
  x: number
  y: number
}
```

---

## Composables Specifications

### useAuth.ts
```typescript
export function useAuth() {
  const authStore = useAuthStore()

  const login = async (email: string, password: string) => {
    // Implementation
  }

  const logout = async () => {
    // Implementation
  }

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const currentUser = computed(() => authStore.user)

  return {
    login,
    logout,
    isAuthenticated,
    currentUser
  }
}
```

### useContacts.ts
```typescript
export function useContacts() {
  const contactsStore = useContactsStore()

  const fetchContacts = async (filters?: ContactFilters) => {
    // Implementation
  }

  const createContact = async (contact: Contact) => {
    // Implementation
  }

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    // Implementation
  }

  const deleteContact = async (id: string) => {
    // Implementation
  }

  return {
    fetchContacts,
    createContact,
    updateContact,
    deleteContact
  }
}
```

### useDragDrop.ts
```typescript
export function useDragDrop() {
  const draggedItem = ref<any>(null)

  const onDragStart = (item: any) => {
    draggedItem.value = item
  }

  const onDragEnd = () => {
    draggedItem.value = null
  }

  const onDrop = (target: any) => {
    // Implementation
  }

  return {
    draggedItem,
    onDragStart,
    onDragEnd,
    onDrop
  }
}
```

### useWebSocket.ts
```typescript
export function useWebSocket(url: string) {
  const connected = ref(false)
  const socket = ref<WebSocket | null>(null)

  const connect = () => {
    // Implementation
  }

  const disconnect = () => {
    // Implementation
  }

  const send = (data: any) => {
    // Implementation
  }

  const on = (event: string, callback: Function) => {
    // Implementation
  }

  return {
    connected,
    connect,
    disconnect,
    send,
    on
  }
}
```

---

## Store Specifications

### auth.ts (Pinia Store)
```typescript
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    isAuthenticated: false
  }),

  actions: {
    async login(email: string, password: string) {
      // Implementation
    },

    async logout() {
      // Implementation
    },

    async refreshToken() {
      // Implementation
    }
  },

  getters: {
    userRole: (state) => state.user?.role,
    userName: (state) => state.user?.name
  }
})
```

### contacts.ts (Pinia Store)
```typescript
export const useContactsStore = defineStore('contacts', {
  state: () => ({
    contacts: [] as Contact[],
    selectedContacts: [] as Contact[],
    filters: {} as ContactFilters,
    pagination: {
      page: 1,
      pageSize: 25,
      total: 0
    }
  }),

  actions: {
    async fetchContacts() {
      // Implementation
    },

    async createContact(contact: Contact) {
      // Implementation
    },

    selectContact(contact: Contact) {
      // Implementation
    },

    clearSelection() {
      this.selectedContacts = []
    }
  }
})
```

### conversations.ts (Pinia Store)
```typescript
export const useConversationsStore = defineStore('conversations', {
  state: () => ({
    conversations: [] as Conversation[],
    activeConversation: null as Conversation | null,
    messages: {} as Record<string, Message[]>,
    unreadCount: 0
  }),

  actions: {
    async fetchConversations(filter?: string) {
      // Implementation
    },

    async sendMessage(conversationId: string, message: Message) {
      // Implementation
    },

    markAsRead(conversationId: string) {
      // Implementation
    }
  }
})
```

---

## Best Practices

1. **Separation of Concerns**
   - Components focus on presentation
   - Composables handle business logic
   - Stores manage state

2. **TypeScript First**
   - Strong typing for all props/emits
   - Interface definitions in types folder
   - Generic types for reusability

3. **Composable Pattern**
   - Reusable logic in composables
   - Single responsibility
   - Easy to test

4. **Store Organization**
   - Feature-based stores
   - Actions for async operations
   - Getters for derived state

5. **Component Communication**
   - Props down, events up
   - Stores for shared state
   - Provide/inject for deep passing

6. **Performance**
   - Lazy loading for routes
   - Virtual scrolling for long lists
   - Memoization for computed values
   - Debouncing for search inputs

7. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Focus management
   - Screen reader support

8. **Testing Strategy**
   - Unit tests for composables
   - Component tests with Vue Test Utils
   - E2E tests for critical flows
   - Store tests with Pinia Testing

---

This architecture provides a scalable, maintainable foundation for a GoHighLevel clone built with Vue 3, TypeScript, and modern best practices.
