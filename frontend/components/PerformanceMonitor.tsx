'use client'

import { useState, useEffect } from 'react'
import { Activity, Zap, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface PerformanceMetrics {
  renderCount: number
  slowRenders: number
  lastRenderTime: number
  averageRenderTime: number
  memoryUsage?: number
  apiResponseTime?: number
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics
}

export default function PerformanceMonitor({ metrics }: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    // Show performance monitor in development
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true)
    }
  }, [])

  const getPerformanceStatus = () => {
    if (metrics.slowRenders === 0) {
      return { status: 'excellent', color: 'green', icon: CheckCircle, text: 'Excellent' }
    } else if (metrics.slowRenders < 5) {
      return { status: 'good', color: 'blue', icon: Activity, text: 'Good' }
    } else if (metrics.slowRenders < 10) {
      return { status: 'warning', color: 'yellow', icon: AlertTriangle, text: 'Warning' }
    } else {
      return { status: 'poor', color: 'red', icon: Zap, text: 'Poor' }
    }
  }

  const status = getPerformanceStatus()

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <status.icon className={`w-4 h-4 text-${status.color}-500 mr-2`} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Performance: {status.text}
          </span>
        </button>

        {expanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 min-w-64">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Renders:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {metrics.renderCount}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Slow Renders:</span>
                <span className={`text-sm font-medium ${
                  metrics.slowRenders > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {metrics.slowRenders}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Render:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {metrics.averageRenderTime.toFixed(2)}ms
                </span>
              </div>

              {metrics.memoryUsage && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Memory:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
                  </span>
                </div>
              )}

              {metrics.apiResponseTime && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">API Time:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {metrics.apiResponseTime}ms
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Render:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(metrics.lastRenderTime).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Performance tips:
              </div>
              <ul className="mt-1 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {metrics.slowRenders > 0 && (
                  <li>• Optimize component re-renders with React.memo</li>
                )}
                {metrics.averageRenderTime > 16 && (
                  <li>• Consider virtualization for large lists</li>
                )}
                {metrics.memoryUsage && metrics.memoryUsage > 50 * 1024 * 1024 && (
                  <li>• Check for memory leaks in components</li>
                )}
                <li>• Use React DevTools Profiler for detailed analysis</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
