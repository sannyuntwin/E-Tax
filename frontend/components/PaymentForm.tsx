'use client'

import { useState, useEffect } from 'react'
import { X, Plus, DollarSign, Calendar, CreditCard } from 'lucide-react'
import { Payment, Invoice, Customer } from '@/types'

interface PaymentFormProps {
  invoices: Invoice[]
  customers: Customer[]
  payment?: Payment
  onSubmit: (payment: Partial<Payment>) => void
  onCancel: () => void
}

export default function PaymentForm({ invoices, customers, payment, onSubmit, onCancel }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    invoice_id: payment?.invoice_id || invoices[0]?.id || 0,
    amount: payment?.amount || 0,
    payment_date: payment?.payment_date || new Date().toISOString().split('T')[0],
    payment_method: payment?.payment_method || 'bank_transfer',
    reference_number: payment?.reference_number || '',
    notes: payment?.notes || ''
  })

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'promptpay', label: 'PromptPay' },
    { value: 'check', label: 'Check' },
    { value: 'other', label: 'Other' }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const selectedInvoice = invoices.find(inv => inv.id === formData.invoice_id)
  const remainingAmount = selectedInvoice ? selectedInvoice.total_amount - (selectedInvoice.paid_amount || 0) : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {payment ? 'Edit Payment' : 'Record Payment'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Invoice Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Invoice
              </label>
              <select
                value={formData.invoice_id}
                onChange={(e) => setFormData({ ...formData, invoice_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                required
              >
                <option value="">Select Invoice</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoice_no} - {invoice.customer?.name} - ฿{invoice.total_amount.toLocaleString()}
                  </option>
                ))}
              </select>
              {selectedInvoice && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <div>Invoice Total: ฿{selectedInvoice.total_amount.toLocaleString()}</div>
                  <div>Already Paid: ฿{(selectedInvoice.paid_amount || 0).toLocaleString()}</div>
                  <div className="font-medium">Remaining: ฿{remainingAmount.toLocaleString()}</div>
                </div>
              )}
            </div>

            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ฿
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingAmount}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                  placeholder="0.00"
                  required
                />
              </div>
              {remainingAmount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum amount: ฿{remainingAmount.toLocaleString()}
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Method
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                required
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference Number (Optional)
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                placeholder="Transaction ID, Check number, etc."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                rows={3}
                placeholder="Payment notes or description"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-6">
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
              {payment ? 'Update Payment' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
