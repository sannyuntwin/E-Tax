import { Invoice } from './index'

export interface PaymentReminder {
  id: number
  invoice_id: number
  reminder_type: 'due_date' | 'overdue' | 'custom'
  days_before: number
  is_sent: boolean
  scheduled_date: string
  sent_date?: string
  email_sent: boolean
  sms_sent: boolean
  message: string
  created_at: string
  updated_at: string
  invoice?: Invoice
}

export interface Payment {
  id: number
  invoice_id: number
  amount: number
  payment_date: string
  payment_method?: string
  reference_number?: string
  notes?: string
  created_at: string
  updated_at: string
  invoice?: Invoice
}

export interface PaymentStats {
  total_paid: number
  total_unpaid: number
  overdue_amount: number
  this_month_paid: number
  paid_invoices: number
  unpaid_invoices: number
  overdue_invoices: number
}

export interface EnhancedSearchFilters {
  search?: string
  customer_id?: string
  status?: string
  payment_status?: string
  min_amount?: string
  max_amount?: string
  start_date?: string
  end_date?: string
  due_date_start?: string
  due_date_end?: string
}
