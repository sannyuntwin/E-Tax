'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Play, Pause, Edit, Trash2, Calendar, DollarSign, Eye } from 'lucide-react'
import { RecurringInvoice, Company, Customer } from '@/types'

interface RecurringInvoicesListProps {
  recurringInvoices: RecurringInvoice[]
  onView: (invoice: RecurringInvoice) => void
  onEdit: (invoice: RecurringInvoice) => void
  onDelete: (id: number) => void
  onGenerate: (id: number) => void
  onPause: (id: number) => void
  onResume: (id: number) => void
}

export default function RecurringInvoicesList({
  recurringInvoices,
  onView,
  onEdit,
  onDelete,
  onGenerate,
  onPause,
  onResume
}: RecurringInvoicesListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getFrequencyDisplay = (frequency: string, interval: number) => {
    const display = {
      daily: interval === 1 ? 'Daily' : `Every ${interval} days`,
      weekly: interval === 1 ? 'Weekly' : `Every ${interval} weeks`,
      monthly: interval === 1 ? 'Monthly' : `Every ${interval} months`,
      quarterly: interval === 1 ? 'Quarterly' : `Every ${interval} quarters`,
      yearly: interval === 1 ? 'Yearly' : `Every ${interval} years`
    }
    return display[frequency as keyof typeof display] || frequency
  }

  const getStatusColor = (isActive: boolean, nextDate: string) => {
    if (!isActive) return 'bg-gray-100 text-gray-800'
    
    const today = new Date()
    const next = new Date(nextDate)
    const daysUntil = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil <= 0) return 'bg-red-100 text-red-800'
    if (daysUntil <= 7) return 'bg-orange-100 text-orange-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = (isActive: boolean, nextDate: string) => {
    if (!isActive) return 'Paused'
    
    const today = new Date()
    const next = new Date(nextDate)
    const daysUntil = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil <= 0) return 'Overdue'
    if (daysUntil <= 7) return `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
    return `Next in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
  }

  if (recurringInvoices.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium">No recurring invoices found</p>
          <p className="text-sm mt-2">Create your first recurring invoice to automate your billing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recurring Invoices</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Frequency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Next Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Generated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {recurringInvoices.map((recurringInvoice) => (
              <tr key={recurringInvoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {recurringInvoice.name}
                    </div>
                    {recurringInvoice.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {recurringInvoice.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {recurringInvoice.customer?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {getFrequencyDisplay(recurringInvoice.frequency, recurringInvoice.interval_value)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatDate(recurringInvoice.next_invoice_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(recurringInvoice.is_active, recurringInvoice.next_invoice_date)}`}>
                    {getStatusText(recurringInvoice.is_active, recurringInvoice.next_invoice_date)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {recurringInvoice.total_generated}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onView(recurringInvoice)}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onGenerate(recurringInvoice.id)}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      title="Generate Invoice"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    
                    {recurringInvoice.is_active ? (
                      <button
                        onClick={() => onPause(recurringInvoice.id)}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                        title="Pause"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onResume(recurringInvoice.id)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Resume"
                      >
                      </button>
                    )}
                    
                    <button
                      onClick={() => onEdit(recurringInvoice)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onDelete(recurringInvoice.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
