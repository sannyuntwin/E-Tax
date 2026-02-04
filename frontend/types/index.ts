export interface Company {
  id: number
  tax_id: string
  company_name: string
  address: string
  phone: string
  email: string
  certificate_path: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: number
  name: string
  tax_id?: string
  email: string
  phone: string
  address: string
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: number
  invoice_id: number
  product_name: string
  description?: string
  quantity: number
  unit_price: number
  line_total: number
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: number
  invoice_no: string
  issue_date: string
  due_date?: string
  company_id: number
  customer_id: number
  subtotal: number
  vat_amount: number
  total_amount: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
  company?: Company
  customer?: Customer
  items?: InvoiceItem[]
}

// Re-export enhanced types
export * from './enhancements'
