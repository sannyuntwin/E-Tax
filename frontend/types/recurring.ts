import { Company, Customer, Invoice, InvoiceItem } from './index'

export interface RecurringInvoice {
  id: number
  name: string
  description?: string
  company_id: number
  customer_id: number
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  interval_value: number
  start_date: string
  end_date?: string
  next_invoice_date: string
  is_active: boolean
  last_generated?: string
  total_generated: number
  template_data: string
  created_at: string
  updated_at: string
  company?: Company
  customer?: Customer
  invoices?: Invoice[]
}

export interface RecurringInvoiceStats {
  active_count: number
  inactive_count: number
  this_month_count: number
  total_value: number
  next_due_count: number
}

export interface RecurringInvoiceForm {
  name: string
  description?: string
  company_id: number
  customer_id: number
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  interval_value: number
  start_date: string
  end_date?: string
  items: InvoiceItem[]
  notes?: string
}
