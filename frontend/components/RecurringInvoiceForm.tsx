'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Calendar, Play, Pause, RefreshCw } from 'lucide-react'
import { RecurringInvoice, Company, Customer, InvoiceItem } from '@/types'

interface RecurringInvoiceFormProps {
  companies: Company[]
  customers: Customer[]
  recurringInvoice?: RecurringInvoice
  onSubmit: (invoice: RecurringInvoiceForm) => void
  onCancel: () => void
}

interface RecurringInvoiceForm {
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

export default function RecurringInvoiceForm({ 
  companies, 
  customers, 
  recurringInvoice, 
  onSubmit, 
  onCancel 
}: RecurringInvoiceFormProps) {
  const [formData, setFormData] = useState<RecurringInvoiceForm>({
    name: recurringInvoice?.name || '',
    description: recurringInvoice?.description || '',
    company_id: recurringInvoice?.company_id || companies[0]?.id || 0,
    customer_id: recurringInvoice?.customer_id || customers[0]?.id || 0,
    frequency: recurringInvoice?.frequency || 'monthly',
    interval_value: recurringInvoice?.interval_value || 1,
    start_date: recurringInvoice?.start_date || new Date().toISOString().split('T')[0],
    end_date: recurringInvoice?.end_date || '',
    items: recurringInvoice ? (() => {
      try {
        const templateData = JSON.parse(recurringInvoice.template_data || '{}')
        return templateData.items || [createEmptyItem()]
      } catch {
        return [createEmptyItem()]
      }
    })() : [createEmptyItem()],
    notes: recurringInvoice ? (() => {
      try {
        const templateData = JSON.parse(recurringInvoice.template_data || '{}')
        return templateData.notes || ''
      } catch {
        return ''
      }
    })() : ''
  })

  function createEmptyItem(): InvoiceItem {
    return {
      id: 0,
      invoice_id: 0,
      product_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      line_total: 0,
      created_at: '',
      updated_at: ''
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems, [field]: value }
    
    // Recalculate line total if quantity or unit_price changed
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = Number(newItems[index].quantity) || 0
      const unitPrice = Number(newItems[index].unit_price) || 0
      newItems[index].line_total = quantity * unitPrice
    }
    
    setFormData({ ...formData, items: newItems })
  }

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, createEmptyItem()] })
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index)
      setFormData({ ...formData, items: newItems })
    }
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.line_total || 0), 0)
    const vatAmount = subtotal * 0.07 // 7% VAT
    const totalAmount = subtotal + vatAmount
    
    return { subtotal, vatAmount, totalAmount }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const { subtotal, vatAmount, totalAmount } = calculateTotals()

  const frequencyOptions = [
    { value: 'daily', label: 'Daily', description: 'Every day' },
    { value: 'weekly', label: 'Weekly', description: 'Every week' },
    { value: 'monthly', label: 'Monthly', description: 'Every month' },
    { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
    { value: 'yearly', label: 'Yearly', description: 'Every year' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {recurringInvoice ? 'Edit Recurring Invoice' : 'Create Recurring Invoice'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recurring Invoice Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                placeholder="e.g., Monthly Web Hosting"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                placeholder="Optional description"
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
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                required
              >
                {frequencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interval
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Every</span>
                <input
                  type="number"
                  min="1"
                  value={formData.interval_value}
                  onChange={(e) => setFormData({ ...formData, interval_value: Number(e.target.value) })}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                  required
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {frequencyOptions.find(f => f.value === formData.frequency)?.label.toLowerCase()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                placeholder="Leave empty for ongoing"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty for ongoing recurring invoices
              </p>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Invoice Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg dark:border-gray-600">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={item.product_name}
                      onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                      placeholder="Product name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                      min="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total
                    </label>
                    <input
                      type="text"
                      value={item.line_total.toFixed(2)}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-black dark:text-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:text-red-800 disabled:text-gray-400"
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
              rows={3}
              placeholder="Optional notes for each generated invoice"
            />
          </div>

          {/* Totals */}
          <div className="border-t dark:border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-right space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Subtotal:</span>
                  <span className="w-32 text-right text-gray-900 dark:text-white">฿{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">VAT (7%):</span>
                  <span className="w-32 text-right text-gray-900 dark:text-white">฿{vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="w-32 text-right text-gray-900 dark:text-white">฿{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
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
              {recurringInvoice ? 'Update Recurring Invoice' : 'Create Recurring Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
