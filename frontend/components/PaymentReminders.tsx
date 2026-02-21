'use client'

import { useState, useEffect } from 'react'
import { Bell, Plus, Edit, Trash2, Send, Search, X, Calendar, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface PaymentReminder {
  id: number
  invoice_id: number
  customer_id: number
  reminder_date: string
  message: string
  status: 'pending' | 'sent' | 'completed'
  sent_date?: string
  created_at: string
  updated_at: string
}

interface PaymentReminderFormData {
  invoice_id: number
  customer_id: number
  reminder_date: string
  message: string
}

export default function PaymentReminders() {
  const [reminders, setReminders] = useState<PaymentReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingReminder, setEditingReminder] = useState<PaymentReminder | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [formData, setFormData] = useState<PaymentReminderFormData>({
    invoice_id: 0,
    customer_id: 0,
    reminder_date: new Date().toISOString().split('T')[0],
    message: ''
  })

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  const token = localStorage.getItem('access_token')

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/payment-reminders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setReminders(data)
      }
    } catch (error) {
      console.error('Error fetching payment reminders:', error)
      toast.error('Failed to fetch payment reminders')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingReminder 
        ? `${API_BASE}/api/payment-reminders/${editingReminder.id}`
        : `${API_BASE}/api/payment-reminders`
      
      const method = editingReminder ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedReminder = await response.json()
        
        if (editingReminder) {
          setReminders(reminders.map(rem => rem.id === updatedReminder.id ? updatedReminder : rem))
          toast.success('Payment reminder updated successfully!')
        } else {
          setReminders([...reminders, updatedReminder])
          toast.success('Payment reminder created successfully!')
        }
        
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Operation failed')
      }
    } catch (error) {
      console.error('Error saving payment reminder:', error)
      toast.error('Failed to save payment reminder')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (reminder: PaymentReminder) => {
    setEditingReminder(reminder)
    setFormData({
      invoice_id: reminder.invoice_id,
      customer_id: reminder.customer_id,
      reminder_date: reminder.reminder_date.split('T')[0],
      message: reminder.message
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment reminder?')) return

    try {
      const response = await fetch(`${API_BASE}/api/payment-reminders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setReminders(reminders.filter(rem => rem.id !== id))
        toast.success('Payment reminder deleted successfully!')
      } else {
        toast.error('Failed to delete payment reminder')
      }
    } catch (error) {
      console.error('Error deleting payment reminder:', error)
      toast.error('Failed to delete payment reminder')
    }
  }

  const handleSend = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/payment-reminders/${id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setReminders(reminders.map(rem => 
          rem.id === id ? { ...rem, status: 'sent', sent_date: new Date().toISOString() } : rem
        ))
        toast.success('Payment reminder sent successfully!')
      } else {
        toast.error('Failed to send payment reminder')
      }
    } catch (error) {
      console.error('Error sending payment reminder:', error)
      toast.error('Failed to send payment reminder')
    }
  }

  const resetForm = () => {
    setFormData({
      invoice_id: 0,
      customer_id: 0,
      reminder_date: new Date().toISOString().split('T')[0],
      message: ''
    })
    setEditingReminder(null)
    setShowForm(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'sent': return <Send className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return null
    }
  }

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = !searchTerm || 
      reminder.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || reminder.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading && reminders.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Payment Reminders</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Reminder
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reminders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Reminders List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reminder Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredReminders.map((reminder) => (
              <tr key={reminder.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  #{reminder.invoice_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  #{reminder.customer_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    {new Date(reminder.reminder_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate" title={reminder.message}>
                    {reminder.message}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reminder.status)}`}>
                    {getStatusIcon(reminder.status)}
                    <span className="ml-1">{reminder.status}</span>
                  </span>
                  {reminder.sent_date && (
                    <div className="text-xs text-gray-500 mt-1">
                      Sent: {new Date(reminder.sent_date).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(reminder)}
                      className="text-green-600 hover:text-green-900"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleSend(reminder.id)}
                      disabled={reminder.status === 'sent' || reminder.status === 'completed'}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Send Reminder"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredReminders.length === 0 && (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payment reminders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Get started by adding a new payment reminder'}
            </p>
          </div>
        )}
      </div>

      {/* Reminder Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingReminder ? 'Edit Payment Reminder' : 'Add New Reminder'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice ID *</label>
                  <input
                    type="number"
                    required
                    value={formData.invoice_id}
                    onChange={(e) => setFormData({ ...formData, invoice_id: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer ID *</label>
                  <input
                    type="number"
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reminder Date *</label>
                <input
                  type="date"
                  required
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Message *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Enter the reminder message..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Template Suggestions</h4>
                <div className="space-y-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, message: 'Dear Customer, this is a friendly reminder that your payment is due. Please make the payment at your earliest convenience.' })}
                    className="w-full text-left px-3 py-2 bg-white rounded border border-blue-200 hover:bg-blue-100"
                  >
                    Standard Payment Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, message: 'URGENT: Your payment is now overdue. Please settle this immediately to avoid late fees.' })}
                    className="w-full text-left px-3 py-2 bg-white rounded border border-blue-200 hover:bg-blue-100"
                  >
                    Urgent Overdue Notice
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, message: 'Just a friendly reminder that we have not yet received your payment. Please let us know if you have already made the payment.' })}
                    className="w-full text-left px-3 py-2 bg-white rounded border border-blue-200 hover:bg-blue-100"
                  >
                    Follow-up Reminder
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingReminder ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
