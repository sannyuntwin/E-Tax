'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Play, Pause, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react'
import { RecurringInvoice, RecurringInvoiceStats } from '@/types'

interface RecurringInvoicesDashboardProps {
  onCreateRecurring: () => void
}

export default function RecurringInvoicesDashboard({ onCreateRecurring }: RecurringInvoicesDashboardProps) {
  const [stats, setStats] = useState<RecurringInvoiceStats | null>(null)
  const [loading, setLoading] = useState(true)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/recurring-invoices/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching recurring invoice stats:', error)
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
          <RefreshCw className="w-5 h-5 mr-2" />
          Recurring Invoices
        </h3>
        <button
          onClick={onCreateRecurring}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Play className="w-4 h-4 mr-2" />
          Create Recurring
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Recurring Invoices */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-md p-3">
              <Play className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Active</dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {stats?.active_count || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-md p-3">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">This Month</dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {stats?.this_month_count || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Monthly Value */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900 rounded-md p-3">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Monthly Value</dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  ฿{stats?.total_value.toLocaleString() || '0'}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Next Due */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900 rounded-md p-3">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Next 7 Days</dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {stats?.next_due_count || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {stats?.active_count ? Math.round((stats.this_month_count / stats.active_count) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Generation Rate
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              This month vs active
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats?.active_count || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Active Recurring
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Automated billing
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ฿{stats?.total_value ? Math.round(stats.total_value / 12) : 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Avg Monthly Revenue
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              From recurring
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
