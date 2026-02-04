'use client'

import { useState } from 'react'
import { Search, Filter, X, Calendar, DollarSign, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { EnhancedSearchFilters, Customer } from '@/types'

interface EnhancedSearchAndFilterProps {
  filters: EnhancedSearchFilters
  onFiltersChange: (filters: EnhancedSearchFilters) => void
  customers: Customer[]
}

export default function EnhancedSearchAndFilter({ filters, onFiltersChange, customers }: EnhancedSearchAndFilterProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const handleFilterChange = (key: keyof EnhancedSearchFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.values(filters).some(value => value && value !== '')

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Search Bar */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
              placeholder="Search by invoice number, customer, or product name..."
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              hasActiveFilters 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-white text-primary-600 px-2 py-1 rounded text-xs font-medium">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Customer Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer
              </label>
              <select
                value={filters.customer_id || ''}
                onChange={(e) => handleFilterChange('customer_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
              >
                <option value="">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Invoice Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Status
              </label>
              <select
                value={filters.payment_status || ''}
                onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
              >
                <option value="">All Payment Status</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Amount Range */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    ฿
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={filters.min_amount || ''}
                    onChange={(e) => handleFilterChange('min_amount', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    ฿
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={filters.max_amount || ''}
                    onChange={(e) => handleFilterChange('max_amount', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                    placeholder="999999.99"
                  />
                </div>
              </div>
            </div>

            {/* Issue Date Range */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Issue Date From
                </label>
                <input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Issue Date To
                </label>
                <input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                />
              </div>
            </div>

            {/* Due Date Range */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date From
                </label>
                <input
                  type="date"
                  value={filters.due_date_start || ''}
                  onChange={(e) => handleFilterChange('due_date_start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date To
                </label>
                <input
                  type="date"
                  value={filters.due_date_end || ''}
                  onChange={(e) => handleFilterChange('due_date_end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => onFiltersChange({ payment_status: 'overdue' })}
              className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 text-sm"
            >
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Overdue Only
            </button>
            <button
              onClick={() => onFiltersChange({ payment_status: 'unpaid' })}
              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 text-sm"
            >
              <Clock className="w-4 h-4 inline mr-1" />
              Unpaid Only
            </button>
            <button
              onClick={() => onFiltersChange({ payment_status: 'paid' })}
              className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-sm"
            >
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Paid Only
            </button>
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0]
                const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                onFiltersChange({ due_date_start: today, due_date_end: nextWeek })
              }}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm"
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Due This Week
            </button>
            <button
              onClick={() => {
                const thisMonth = new Date().toISOString().slice(0, 7)
                onFiltersChange({ start_date: thisMonth + '-01', end_date: thisMonth + '-31' })
              }}
              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 text-sm"
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              This Month
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
