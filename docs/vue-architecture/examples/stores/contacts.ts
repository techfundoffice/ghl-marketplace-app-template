import { defineStore } from 'pinia'
import type { Contact, ContactFilters, PaginationParams } from '@/types/contact'

interface ContactsState {
  contacts: Contact[]
  selectedContacts: Contact[]
  filters: ContactFilters
  pagination: PaginationParams
  loading: boolean
  error: string | null
  savedFilters: Array<{ id: string; name: string; filters: ContactFilters }>
}

export const useContactsStore = defineStore('contacts', {
  state: (): ContactsState => ({
    contacts: [],
    selectedContacts: [],
    filters: {},
    pagination: {
      page: 1,
      pageSize: 25,
      total: 0
    },
    loading: false,
    error: null,
    savedFilters: []
  }),

  getters: {
    /**
     * Get total number of contacts
     */
    totalContacts: (state) => state.pagination.total,

    /**
     * Get total number of pages
     */
    totalPages: (state) => {
      return Math.ceil(state.pagination.total / state.pagination.pageSize)
    },

    /**
     * Check if there are selected contacts
     */
    hasSelection: (state) => state.selectedContacts.length > 0,

    /**
     * Get count of selected contacts
     */
    selectionCount: (state) => state.selectedContacts.length,

    /**
     * Get contact by ID
     */
    getContactById: (state) => {
      return (id: string) => state.contacts.find(c => c.id === id)
    },

    /**
     * Get contacts by tag
     */
    getContactsByTag: (state) => {
      return (tag: string) => state.contacts.filter(c => c.tags.includes(tag))
    },

    /**
     * Get all unique tags from contacts
     */
    allTags: (state) => {
      const tags = new Set<string>()
      state.contacts.forEach(contact => {
        contact.tags.forEach(tag => tags.add(tag))
      })
      return Array.from(tags).sort()
    },

    /**
     * Check if filters are active
     */
    hasActiveFilters: (state) => {
      return Object.keys(state.filters).length > 0
    }
  },

  actions: {
    /**
     * Set contacts list
     */
    setContacts(contacts: Contact[]) {
      this.contacts = contacts
    },

    /**
     * Add a new contact
     */
    addContact(contact: Contact) {
      this.contacts.unshift(contact)
      this.pagination.total++
    },

    /**
     * Update an existing contact
     */
    updateContact(id: string, updates: Partial<Contact>) {
      const index = this.contacts.findIndex(c => c.id === id)
      if (index !== -1) {
        this.contacts[index] = {
          ...this.contacts[index],
          ...updates,
          updatedAt: new Date()
        }
      }
    },

    /**
     * Remove a contact
     */
    removeContact(id: string) {
      const index = this.contacts.findIndex(c => c.id === id)
      if (index !== -1) {
        this.contacts.splice(index, 1)
        this.pagination.total--

        // Remove from selection if selected
        const selectionIndex = this.selectedContacts.findIndex(c => c.id === id)
        if (selectionIndex !== -1) {
          this.selectedContacts.splice(selectionIndex, 1)
        }
      }
    },

    /**
     * Select a contact
     */
    selectContact(contact: Contact) {
      if (!this.selectedContacts.find(c => c.id === contact.id)) {
        this.selectedContacts.push(contact)
      }
    },

    /**
     * Deselect a contact
     */
    deselectContact(contactId: string) {
      const index = this.selectedContacts.findIndex(c => c.id === contactId)
      if (index !== -1) {
        this.selectedContacts.splice(index, 1)
      }
    },

    /**
     * Toggle contact selection
     */
    toggleContactSelection(contact: Contact) {
      const index = this.selectedContacts.findIndex(c => c.id === contact.id)
      if (index !== -1) {
        this.selectedContacts.splice(index, 1)
      } else {
        this.selectedContacts.push(contact)
      }
    },

    /**
     * Select all contacts
     */
    selectAllContacts() {
      this.selectedContacts = [...this.contacts]
    },

    /**
     * Clear contact selection
     */
    clearSelection() {
      this.selectedContacts = []
    },

    /**
     * Set filters
     */
    setFilters(filters: ContactFilters) {
      this.filters = filters
      this.pagination.page = 1 // Reset to first page when filters change
    },

    /**
     * Clear filters
     */
    clearFilters() {
      this.filters = {}
      this.pagination.page = 1
    },

    /**
     * Set pagination
     */
    setPagination(pagination: Partial<PaginationParams>) {
      this.pagination = {
        ...this.pagination,
        ...pagination
      }
    },

    /**
     * Go to next page
     */
    nextPage() {
      if (this.pagination.page < this.totalPages) {
        this.pagination.page++
      }
    },

    /**
     * Go to previous page
     */
    prevPage() {
      if (this.pagination.page > 1) {
        this.pagination.page--
      }
    },

    /**
     * Go to specific page
     */
    goToPage(page: number) {
      if (page >= 1 && page <= this.totalPages) {
        this.pagination.page = page
      }
    },

    /**
     * Save current filters with a name
     */
    saveFilters(name: string) {
      const id = Date.now().toString()
      this.savedFilters.push({
        id,
        name,
        filters: { ...this.filters }
      })
    },

    /**
     * Load saved filters
     */
    loadSavedFilters(id: string) {
      const saved = this.savedFilters.find(f => f.id === id)
      if (saved) {
        this.setFilters(saved.filters)
      }
    },

    /**
     * Delete saved filters
     */
    deleteSavedFilters(id: string) {
      const index = this.savedFilters.findIndex(f => f.id === id)
      if (index !== -1) {
        this.savedFilters.splice(index, 1)
      }
    },

    /**
     * Add tags to multiple contacts
     */
    addTagsToContacts(contactIds: string[], tags: string[]) {
      contactIds.forEach(id => {
        const contact = this.contacts.find(c => c.id === id)
        if (contact) {
          const uniqueTags = new Set([...contact.tags, ...tags])
          contact.tags = Array.from(uniqueTags)
          contact.updatedAt = new Date()
        }
      })
    },

    /**
     * Remove tags from multiple contacts
     */
    removeTagsFromContacts(contactIds: string[], tags: string[]) {
      contactIds.forEach(id => {
        const contact = this.contacts.find(c => c.id === id)
        if (contact) {
          contact.tags = contact.tags.filter(tag => !tags.includes(tag))
          contact.updatedAt = new Date()
        }
      })
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
      this.contacts = []
      this.selectedContacts = []
      this.filters = {}
      this.pagination = {
        page: 1,
        pageSize: 25,
        total: 0
      }
      this.loading = false
      this.error = null
    }
  },

  // Persist state to localStorage
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'contacts',
        storage: localStorage,
        paths: ['savedFilters', 'pagination.pageSize']
      }
    ]
  }
})
