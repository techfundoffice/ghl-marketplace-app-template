import { ref } from 'vue'
import { useContactsStore } from '@/stores/contacts'
import type { Contact, ContactFilters } from '@/types/contact'
import api from '@/services/api'

export function useContacts() {
  const contactsStore = useContactsStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch contacts with optional filters
   */
  const fetchContacts = async (filters?: ContactFilters) => {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/contacts', {
        params: {
          ...filters,
          page: contactsStore.pagination.page,
          pageSize: contactsStore.pagination.pageSize
        }
      })

      contactsStore.setContacts(response.data.contacts)
      contactsStore.setPagination({
        ...contactsStore.pagination,
        total: response.data.total
      })

      return response.data.contacts
    } catch (e) {
      error.value = 'Failed to fetch contacts'
      console.error('Error fetching contacts:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Get a single contact by ID
   */
  const getContact = async (id: string): Promise<Contact> => {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(`/contacts/${id}`)
      return response.data
    } catch (e) {
      error.value = 'Failed to fetch contact'
      console.error('Error fetching contact:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new contact
   */
  const createContact = async (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> => {
    loading.value = true
    error.value = null

    try {
      const response = await api.post('/contacts', contact)
      const newContact = response.data

      contactsStore.addContact(newContact)
      return newContact
    } catch (e) {
      error.value = 'Failed to create contact'
      console.error('Error creating contact:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing contact
   */
  const updateContact = async (id: string, updates: Partial<Contact>): Promise<Contact> => {
    loading.value = true
    error.value = null

    try {
      const response = await api.patch(`/contacts/${id}`, updates)
      const updatedContact = response.data

      contactsStore.updateContact(id, updatedContact)
      return updatedContact
    } catch (e) {
      error.value = 'Failed to update contact'
      console.error('Error updating contact:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a contact
   */
  const deleteContact = async (id: string): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      await api.delete(`/contacts/${id}`)
      contactsStore.removeContact(id)
    } catch (e) {
      error.value = 'Failed to delete contact'
      console.error('Error deleting contact:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Bulk operations on contacts
   */
  const bulkUpdate = async (contactIds: string[], updates: Partial<Contact>): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      await api.post('/contacts/bulk-update', {
        contactIds,
        updates
      })

      // Refresh contacts after bulk update
      await fetchContacts(contactsStore.filters)
    } catch (e) {
      error.value = 'Failed to perform bulk update'
      console.error('Error in bulk update:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Add tags to contacts
   */
  const addTags = async (contactIds: string[], tags: string[]): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      await api.post('/contacts/add-tags', {
        contactIds,
        tags
      })

      await fetchContacts(contactsStore.filters)
    } catch (e) {
      error.value = 'Failed to add tags'
      console.error('Error adding tags:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Remove tags from contacts
   */
  const removeTags = async (contactIds: string[], tags: string[]): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      await api.post('/contacts/remove-tags', {
        contactIds,
        tags
      })

      await fetchContacts(contactsStore.filters)
    } catch (e) {
      error.value = 'Failed to remove tags'
      console.error('Error removing tags:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Search contacts
   */
  const searchContacts = async (query: string): Promise<Contact[]> => {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/contacts/search', {
        params: { q: query }
      })

      return response.data.contacts
    } catch (e) {
      error.value = 'Failed to search contacts'
      console.error('Error searching contacts:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Export contacts to CSV
   */
  const exportContacts = async (filters?: ContactFilters): Promise<Blob> => {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/contacts/export', {
        params: filters,
        responseType: 'blob'
      })

      return response.data
    } catch (e) {
      error.value = 'Failed to export contacts'
      console.error('Error exporting contacts:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Import contacts from CSV
   */
  const importContacts = async (file: File): Promise<{ success: number; failed: number }> => {
    loading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/contacts/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      await fetchContacts(contactsStore.filters)
      return response.data
    } catch (e) {
      error.value = 'Failed to import contacts'
      console.error('Error importing contacts:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchContacts,
    getContact,
    createContact,
    updateContact,
    deleteContact,
    bulkUpdate,
    addTags,
    removeTags,
    searchContacts,
    exportContacts,
    importContacts
  }
}
