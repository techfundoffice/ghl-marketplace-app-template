/**
 * Contact type definitions
 */

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  company?: string
  position?: string
  tags: string[]
  customFields: Record<string, any>
  source?: string
  assignedTo?: string
  status: ContactStatus
  createdAt: Date
  updatedAt: Date
}

export type ContactStatus = 'active' | 'inactive' | 'unsubscribed' | 'bounced'

export interface ContactFilters {
  search?: string
  tags?: string[]
  status?: ContactStatus[]
  dateRange?: {
    from: Date
    to: Date
  }
  customFields?: Record<string, any>
  assignedTo?: string[]
  source?: string[]
}

export interface BulkAction {
  id: string
  label: string
  icon: string
  requiresConfirmation: boolean
  handler?: (contacts: Contact[]) => Promise<void>
}

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'multiselect'
  options?: Array<{ label: string; value: any }>
  placeholder?: string
}

export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

export interface ContactCreateInput {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  company?: string
  position?: string
  tags?: string[]
  customFields?: Record<string, any>
  source?: string
  assignedTo?: string
}

export interface ContactUpdateInput {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  company?: string
  position?: string
  tags?: string[]
  customFields?: Record<string, any>
  source?: string
  assignedTo?: string
  status?: ContactStatus
}

export interface ContactImportResult {
  success: number
  failed: number
  errors: Array<{
    row: number
    message: string
  }>
}

export interface ContactExportOptions {
  format: 'csv' | 'xlsx' | 'json'
  fields?: string[]
  filters?: ContactFilters
}
