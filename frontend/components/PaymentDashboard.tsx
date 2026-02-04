'use client'

import { useState, useEffect } from 'react'
import { DollarSign, AlertCircle, TrendingUp, Calendar, CreditCard, Bell } from 'lucide-react'
import { PaymentStats } from '@/types'

interface PaymentDashboardProps {
  onCreatePayment: () => void
  onViewReminders: () => void
}

export default function PaymentDashboard({ onCreatePayment, onViewReminders }: PaymentDashboardProps) {
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  useEffect(() => {
    fetchPaymentStats()
  }, [])

  const fetchPaymentStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/payments/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Payment Management
        </h3>
        <div className="flex space-x-4">
          <button
            onClick={onViewReminders}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            <Bell className="w-4 h-4 mr-2" />
            Reminders
          </button>
          <button
            onClick={onCreatePayment}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Payment Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Paid */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-md p-3">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Paid</dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  ฿{stats?.total_paid.toLocaleString() || '0'}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Total Unpaid */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900 rounded-md p-3">
              <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Unpaid</dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  ฿{stats?.total_unpaid.toLocaleString() || '0'}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 dark:bg-red-900 rounded-md p-3">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Overdue</dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  ฿{stats?.overdue_amount.toLocaleString() || '0'}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* This Month Paid */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-md p-3">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">This Month</dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  ฿{stats?.this_month_paid.toLocaleString() || '0'}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Status</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Paid</span>
              </div>
              <span className="font-medium">{stats?.paid_invoices || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Unpaid</span>
              </div>
              <span className="font-medium">{stats?.unpaid_invoices || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Overdue</span>
              </div>
              <span className="font-medium">{stats?.overdue_invoices || 0}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Insights</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats?.total_paid && stats?.total_paid + stats?.total_unpaid > 0 
                  ? Math.round((stats.total_paid / (stats.total_paid + stats.total_unpaid)) * 100) 
                  : 0}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Collection Rate
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Total collected
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats?.overdue_invoices || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Overdue Invoices
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Need attention
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
