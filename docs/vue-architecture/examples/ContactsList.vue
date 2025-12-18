<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useContactsStore } from '@/stores/contacts'
import { useContacts } from '@/composables/useContacts'
import { usePagination } from '@/composables/usePagination'
import type { Contact, ContactFilters } from '@/types/contact'
import ContactDetail from './ContactDetail.vue'
import SmartFilters from './SmartFilters.vue'
import BulkActions from './BulkActions.vue'

interface ContactsListProps {
  pageSize?: number
  defaultFilters?: ContactFilters
  selectable?: boolean
}

const props = withDefaults(defineProps<ContactsListProps>(), {
  pageSize: 25,
  selectable: true
})

const emit = defineEmits<{
  'contact-select': [contact: Contact]
  'contacts-selected': [contacts: Contact[]]
  'filter-change': [filters: ContactFilters]
}>()

const contactsStore = useContactsStore()
const { fetchContacts, updateContact, deleteContact } = useContacts()
const { currentPage, totalPages, goToPage, nextPage, prevPage } = usePagination()

const loading = ref(false)
const selectedContacts = ref<Contact[]>([])
const showDetail = ref(false)
const selectedContact = ref<Contact | null>(null)
const filters = ref<ContactFilters>(props.defaultFilters || {})

const contacts = computed(() => contactsStore.contacts)
const hasSelection = computed(() => selectedContacts.value.length > 0)
const allSelected = computed(() =>
  contacts.value.length > 0 &&
  selectedContacts.value.length === contacts.value.length
)

const loadContacts = async () => {
  loading.value = true
  try {
    await fetchContacts(filters.value)
  } catch (error) {
    console.error('Failed to load contacts:', error)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = (newFilters: ContactFilters) => {
  filters.value = newFilters
  emit('filter-change', newFilters)
  loadContacts()
}

const handleContactClick = (contact: Contact) => {
  selectedContact.value = contact
  showDetail.value = true
  emit('contact-select', contact)
}

const handleContactSelect = (contact: Contact) => {
  const index = selectedContacts.value.findIndex(c => c.id === contact.id)
  if (index > -1) {
    selectedContacts.value.splice(index, 1)
  } else {
    selectedContacts.value.push(contact)
  }
  emit('contacts-selected', selectedContacts.value)
}

const handleSelectAll = () => {
  if (allSelected.value) {
    selectedContacts.value = []
  } else {
    selectedContacts.value = [...contacts.value]
  }
  emit('contacts-selected', selectedContacts.value)
}

const handleBulkAction = async (action: string, contacts: Contact[]) => {
  loading.value = true
  try {
    // Execute bulk action
    console.log(`Executing ${action} on ${contacts.length} contacts`)
    await loadContacts()
    selectedContacts.value = []
  } catch (error) {
    console.error('Bulk action failed:', error)
  } finally {
    loading.value = false
  }
}

watch(() => props.defaultFilters, (newFilters) => {
  if (newFilters) {
    filters.value = newFilters
    loadContacts()
  }
})

onMounted(() => {
  loadContacts()
})
</script>

<template>
  <div class="contacts-list">
    <div class="header">
      <h2>Contacts</h2>
      <div class="actions">
        <button class="btn-primary" @click="$emit('contact-create')">
          Add Contact
        </button>
      </div>
    </div>

    <SmartFilters
      v-model="filters"
      @apply="handleFilterChange"
      @reset="() => handleFilterChange({})"
    />

    <BulkActions
      v-if="hasSelection"
      :selected-contacts="selectedContacts"
      :actions="[
        { id: 'tag', label: 'Add Tag', icon: 'tag', requiresConfirmation: false },
        { id: 'delete', label: 'Delete', icon: 'trash', requiresConfirmation: true },
        { id: 'export', label: 'Export', icon: 'download', requiresConfirmation: false }
      ]"
      @action-execute="handleBulkAction"
    />

    <div class="table-container">
      <table class="contacts-table">
        <thead>
          <tr>
            <th v-if="selectable" class="checkbox-col">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="handleSelectAll"
              />
            </th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Tags</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && contacts.length === 0">
            <td :colspan="selectable ? 7 : 6" class="loading">
              Loading contacts...
            </td>
          </tr>
          <tr v-else-if="contacts.length === 0">
            <td :colspan="selectable ? 7 : 6" class="empty">
              No contacts found
            </td>
          </tr>
          <tr
            v-for="contact in contacts"
            :key="contact.id"
            class="contact-row"
            @click="handleContactClick(contact)"
          >
            <td v-if="selectable" class="checkbox-col" @click.stop>
              <input
                type="checkbox"
                :checked="selectedContacts.includes(contact)"
                @change="handleContactSelect(contact)"
              />
            </td>
            <td class="name-col">
              {{ contact.firstName }} {{ contact.lastName }}
            </td>
            <td>{{ contact.email || '-' }}</td>
            <td>{{ contact.phone || '-' }}</td>
            <td>
              <div class="tags">
                <span
                  v-for="tag in contact.tags"
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
            </td>
            <td>{{ new Date(contact.createdAt).toLocaleDateString() }}</td>
            <td class="actions-col" @click.stop>
              <button class="btn-icon" @click="handleContactClick(contact)">
                Edit
              </button>
              <button class="btn-icon" @click="deleteContact(contact.id)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button :disabled="currentPage === 1" @click="prevPage">
        Previous
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" @click="nextPage">
        Next
      </button>
    </div>

    <ContactDetail
      v-if="showDetail && selectedContact"
      :contact-id="selectedContact.id"
      :editable="true"
      @close="showDetail = false"
    />
  </div>
</template>

<style scoped>
.contacts-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.table-container {
  flex: 1;
  overflow-y: auto;
  margin: 16px 0;
}

.contacts-table {
  width: 100%;
  border-collapse: collapse;
}

.contacts-table th {
  background: var(--bg-tertiary);
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-color);
}

.contact-row {
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--border-color);
}

.contact-row:hover {
  background-color: var(--bg-hover);
}

.contact-row td {
  padding: 16px;
}

.checkbox-col {
  width: 40px;
}

.name-col {
  font-weight: 500;
  color: var(--text-primary);
}

.tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  background: var(--tag-bg);
  color: var(--tag-text);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.actions-col {
  display: flex;
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
}

.loading,
.empty {
  text-align: center;
  padding: 48px;
  color: var(--text-secondary);
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

.btn-primary:hover {
  background: var(--primary-color-hover);
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
}

.btn-icon:hover {
  color: var(--primary-color);
}
</style>
