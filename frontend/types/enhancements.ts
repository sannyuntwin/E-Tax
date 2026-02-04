export interface Product {
  id: number
  name: string
  description?: string
  unit_price: number
  vat_rate: number
  category?: string
  sku?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InvoiceTemplate {
  id: number
  name: string
  description?: string
  company_id: number
  customer_id: number
  items: string
  notes?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_revenue: number
  unpaid_amount: number
  this_month_revenue: number
  total_invoices: number
  paid_invoices: number
  unpaid_invoices: number
  overdue_invoices: number
  draft_invoices: number
}

export interface SearchFilters {
  customer_id?: string
  status?: string
  start_date?: string
  end_date?: string
  search?: string
}
