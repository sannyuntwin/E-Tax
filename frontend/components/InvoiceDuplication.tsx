'use client'

import { useState, useEffect } from 'react'
import { Copy, Calendar, User, DollarSign } from 'lucide-react'
import { Invoice, Company, Customer } from '@/types'

interface InvoiceDuplicationProps {
  invoice: Invoice
  companies: Company[]
  customers: Customer[]
  onDuplicate: (duplicationData: InvoiceDuplicationData) => void
  onCancel: () => void
}

interface InvoiceDuplicationData {
  invoice_no?: string
  issue_date: string
  due_date?: string
  company_id: number
  customer_id: number
  copy_items: boolean
  copy_notes: boolean
  adjust_dates: boolean
  days_offset: number
}

export default function InvoiceDuplication({ 
  invoice, 
  companies, 
  customers, 
  onDuplicate, 
  onCancel 
}: InvoiceDuplicationProps) {
  const [formData, setFormData] = useState<InvoiceDuplicationData>({
    invoice_no: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: invoice.due_date || '',
    company_id: invoice.company_id,
    customer_id: invoice.customer_id,
    copy_items: true,
    copy_notes: true,
    adjust_dates: false,
    days_offset: 0
  })

  useEffect(() => {
    // Calculate new due date if adjusting dates
    if (formData.adjust_dates && invoice.due_date) {
      const originalDueDate = new Date(invoice.due_date)
      const newDueDate = new Date(originalDueDate.getTime() + formData.days_offset * 24 * 60 * 60 * 1000)
      setFormData(prev => ({
        ...prev,
        due_date: newDueDate.toISOString().split('T')[0]
      }))
    } else if (!formData.adjust_dates && invoice.due_date) {
      setFormData(prev => ({
        ...prev,
        due_date: invoice.due_date
      }))
    }
  }, [formData.adjust_dates, formData.days_offset, invoice.due_date])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onDuplicate(formData)
  }

  const generateInvoiceNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `INV${year}${month}${day}-${random}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Copy className="w-5 h-5 mr-2" />
            Duplicate Invoice: {invoice.invoice_no}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Original Invoice Summary */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Original Invoice</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Invoice:</span>
                <span className="ml-2 font-medium">{invoice.invoice_no}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Customer:</span>
                <span className="ml-2 font-medium">{invoice.customer?.name}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total:</span>
                <span className="ml-2 font-medium">฿{invoice.total_amount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Items:</span>
                <span className="ml-2 font-medium">{invoice.items?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Duplication Options */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoice_no || generateInvoiceNumber()}
                  onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                  placeholder="Leave blank to auto-generate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company
                </label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                  required
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                  required
                >
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date || ''}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                />
              </div>
            </div>

            {/* Copy Options */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">What to Copy</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.copy_items}
                    onChange={(e) => setFormData({ ...formData, copy_items: e.target.checked })}
                    className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Copy all invoice items ({invoice.items?.length || 0} items)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.copy_notes}
                    onChange={(e) => setFormData({ ...formData, copy_notes: e.target.checked })}
                    className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Copy notes and descriptions
                  </span>
                </label>
              </div>
            </div>

            {/* Date Adjustment */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.adjust_dates}
                  onChange={(e) => setFormData({ ...formData, adjust_dates: e.target.checked })}
                  className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Adjust dates by offset
                </span>
              </label>
              
              {formData.adjust_dates && (
                <div className="mt-3 flex items-center space-x-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Offset days:</label>
                  <input
                    type="number"
                    value={formData.days_offset}
                    onChange={(e) => setFormData({ ...formData, days_offset: Number(e.target.value) })}
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                    min="-365"
                    max="365"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.days_offset > 0 ? 'days forward' : formData.days_offset < 0 ? 'days backward' : 'no change'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Duplicate Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
