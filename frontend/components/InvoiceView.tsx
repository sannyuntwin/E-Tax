'use client'

import { X, Edit } from 'lucide-react'
import { Invoice } from '@/types'

interface InvoiceViewProps {
  invoice: Invoice
  onClose: () => void
  onEdit: () => void
}

export default function InvoiceView({ invoice, onClose, onEdit }: InvoiceViewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Invoice Details</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={onEdit}
              className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Invoice Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">TAX INVOICE</h1>
                <p className="text-lg text-gray-600 mt-2">{invoice.invoice_no}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Issue Date</h3>
                <p className="text-gray-900">{formatDate(invoice.issue_date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
                <p className="text-gray-900">{invoice.due_date ? formatDate(invoice.due_date) : 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Company and Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Seller</h3>
              <div className="space-y-2">
                <p className="font-medium">{invoice.company?.company_name || 'N/A'}</p>
                <p className="text-sm text-gray-600">Tax ID: {invoice.company?.tax_id || 'N/A'}</p>
                <p className="text-sm text-gray-600">{invoice.company?.address || 'N/A'}</p>
                <p className="text-sm text-gray-600">{invoice.company?.phone || 'N/A'}</p>
                <p className="text-sm text-gray-600">{invoice.company?.email || 'N/A'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Buyer</h3>
              <div className="space-y-2">
                <p className="font-medium">{invoice.customer?.name || 'N/A'}</p>
                {invoice.customer?.tax_id && (
                  <p className="text-sm text-gray-600">Tax ID: {invoice.customer.tax_id}</p>
                )}
                <p className="text-sm text-gray-600">{invoice.customer?.address || 'N/A'}</p>
                <p className="text-sm text-gray-600">{invoice.customer?.phone || 'N/A'}</p>
                <p className="text-sm text-gray-600">{invoice.customer?.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          {item.description && (
                            <p className="text-gray-500 text-xs mt-1">{item.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ฿{item.unit_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ฿{item.line_total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">฿{invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT (7%):</span>
                  <span className="font-medium">฿{invoice.vat_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>฿{invoice.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-600">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
