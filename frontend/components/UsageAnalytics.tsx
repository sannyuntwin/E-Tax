'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Activity, Clock, Zap, Users, FileText, Calendar, Filter } from 'lucide-react'

interface APIUsage {
  id: number
  company_id: number
  user_id?: number
  api_key_id?: number
  endpoint: string
  method: string
  status_code: number
  response_time: number
  request_size: number
  response_size: number
  ip_address: string
  user_agent: string
  timestamp: string
}

interface UsageStats {
  total_requests: number
  successful_requests: number
  failed_requests: number
  avg_response_time: number
  total_data_transferred: number
  most_used_endpoints: Array<{ endpoint: string; count: number }>
  hourly_usage: Array<{ hour: string; requests: number }>
  daily_usage: Array<{ date: string; requests: number }>
  status_distribution: Array<{ status: string; count: number }>
}

interface UsageAnalyticsProps {
  timeRange: string
  onTimeRangeChange: (range: string) => void
}

export default function UsageAnalytics({ timeRange, onTimeRangeChange }: UsageAnalyticsProps) {
  const [usage, setUsage] = useState<APIUsage[]>([])
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [endpoint, setEndpoint] = useState('')
  const [method, setMethod] = useState('')

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  useEffect(() => {
    fetchUsageData()
  }, [timeRange, endpoint, method])

  const fetchUsageData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (timeRange !== 'all') {
        const now = new Date()
        let startDate = ''
        
        switch (timeRange) {
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
            break
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
            break
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
            break
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
            break
        }
        
        if (startDate) {
          params.append('start_date', startDate)
          params.append('end_date', now.toISOString())
        }
      }
      
      if (endpoint) {
        params.append('endpoint', endpoint)
      }
      
      if (method) {
        params.append('method', method)
      }

      const response = await fetch(`${API_BASE}/api/api-usage?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsage(data.data || [])
        
        // Calculate stats
        const totalRequests = data.data.length
        const successfulRequests = data.data.filter((u: APIUsage) => u.status_code < 400).length
        const failedRequests = totalRequests - successfulRequests
        const avgResponseTime = data.data.reduce((sum: number, u: APIUsage) => sum + u.response_time, 0) / totalRequests
        const totalDataTransferred = data.data.reduce((sum: number, u: APIUsage) => sum + u.request_size + u.response_size, 0)

        // Most used endpoints
        const endpointCounts = data.data.reduce((acc: any, u: APIUsage) => {
          acc[u.endpoint] = (acc[u.endpoint] || 0) + 1
          return acc
        }, {})
        const mostUsedEndpoints = Object.entries(endpointCounts)
          .map(([endpoint, count]) => ({ endpoint, count: Number(count) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        // Hourly usage (last 24 hours)
        const hourlyData = Array.from({ length: 24 }, (_, i) => {
          const hour = i.toString().padStart(2, '0')
          const count = data.data.filter((u: APIUsage) => {
            const date = new Date(u.timestamp)
            return date.getHours() === i
          }).length
          return { hour: `${hour}:00`, requests: count }
        })

        // Daily usage (last 30 days)
        const dailyData = Array.from({ length: 30 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (29 - i))
          const dateStr = date.toISOString().split('T')[0]
          const count = data.data.filter((u: APIUsage) => {
            return u.timestamp.startsWith(dateStr)
          }).length
          return { date: dateStr, requests: count }
        })

        // Status distribution
        const statusCounts = data.data.reduce((acc: any, u: APIUsage) => {
          const status = u.status_code < 400 ? 'Success' : u.status_code < 500 ? 'Client Error' : 'Server Error'
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {})
        const statusDistribution = Object.entries(statusCounts)
          .map(([status, count]) => ({ status, count: Number(count) }))

        setStats({
          total_requests: totalRequests,
          successful_requests: successfulRequests,
          failed_requests: failedRequests,
          avg_response_time: avgResponseTime,
          total_data_transferred: totalDataTransferred,
          most_used_endpoints: mostUsedEndpoints,
          hourly_usage: hourlyData,
          daily_usage: dailyData,
          status_distribution: statusDistribution,
        })
      }
    } catch (error) {
      console.error('Error fetching usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Usage Data Available</h3>
        <p className="text-gray-600">Start using the API to see usage analytics</p>
      </div>
    )
  }

  const successRate = ((stats.successful_requests / stats.total_requests) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          API Usage Analytics
        </h3>
        <div className="flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-md p-3">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Total Requests
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {formatNumber(stats.total_requests)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-md p-3">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Success Rate
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {successRate}%
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900 rounded-md p-3">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Avg Response Time
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {stats.avg_response_time.toFixed(0)}ms
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900 rounded-md p-3">
              <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Data Transferred
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {formatBytes(stats.total_data_transferred)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Usage Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Hourly Usage (Last 24 Hours)
        </h4>
        <div className="space-y-2">
          {stats.hourly_usage.map((hour, index) => (
            <div key={index} className="flex items-center">
              <div className="w-20 text-sm text-gray-600 dark:text-gray-400">
                {hour.hour}
              </div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((hour.requests / Math.max(...stats.hourly_usage.map(h => h.requests))) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-16 text-right text-sm font-medium text-gray-900 dark:text-white">
                {hour.requests}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Status Distribution
        </h4>
        <div className="space-y-2">
          {stats.status_distribution.map((status, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  status.status === 'Success' ? 'bg-green-500' :
                  status.status === 'Client Error' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {status.status}
                </span>
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {formatNumber(status.count)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most Used Endpoints */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Most Used Endpoints
        </h4>
        <div className="space-y-2">
          {stats.most_used_endpoints.map((endpoint, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-medium mr-3">
                  {index + 1}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {endpoint.endpoint}
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {formatNumber(endpoint.count)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  requests
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
