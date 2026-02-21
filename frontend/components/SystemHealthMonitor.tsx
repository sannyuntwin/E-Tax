"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface SystemHealth {
  database: {
    status: string;
    message?: string;
    open_connections?: number;
    in_use?: number;
    idle?: number;
    wait_count?: number;
    wait_duration?: string;
    max_idle_closed?: number;
    max_lifetime_closed?: number;
  };
  server: {
    status: string;
    timestamp: string;
    uptime: string;
  };
}

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  value: string;
  details?: string;
  lastChecked: string;
}

const SystemHealthMonitor: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system/health', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch system health');

      const data = await response.json();
      setHealth(data.health);
      setLastUpdated(new Date());
    } catch (error) {
      toast.error('Error fetching system health');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '🟢';
      case 'warning':
        return '🟡';
      case 'error':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getHealthMetrics = (): HealthMetric[] => {
    if (!health) return [];

    const metrics: HealthMetric[] = [];

    // Database metrics
    metrics.push({
      name: 'Database Connection',
      status: health.database.status === 'healthy' ? 'healthy' : 'error',
      value: health.database.status,
      details: health.database.message,
      lastChecked: lastUpdated?.toLocaleString() || '',
    });

    if (health.database.open_connections !== undefined) {
      metrics.push({
        name: 'Database Connections',
        status: health.database.open_connections > 50 ? 'warning' : 'healthy',
        value: health.database.open_connections.toString(),
        details: `In use: ${health.database.in_use}, Idle: ${health.database.idle}`,
        lastChecked: lastUpdated?.toLocaleString() || '',
      });
    }

    // Server metrics
    metrics.push({
      name: 'Server Status',
      status: health.server.status === 'healthy' ? 'healthy' : 'error',
      value: health.server.status,
      details: `Uptime: ${health.server.uptime}`,
      lastChecked: lastUpdated?.toLocaleString() || '',
    });

    return metrics;
  };

  const getOverallHealth = () => {
    if (!health) return 'unknown';
    
    const metrics = getHealthMetrics();
    const hasError = metrics.some(m => m.status === 'error');
    const hasWarning = metrics.some(m => m.status === 'warning');
    
    if (hasError) return 'error';
    if (hasWarning) return 'warning';
    return 'healthy';
  };

  const overallHealth = getOverallHealth();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">System Health Monitor</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoRefresh" className="text-sm font-medium text-gray-700">
              Auto-refresh (30s)
            </label>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Now'}
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div className="text-sm text-gray-500 mb-4">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* Overall Health Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Overall System Health</h2>
            <p className="text-sm text-gray-600 mt-1">
              System-wide health status and performance metrics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-4 py-2 rounded-full text-lg font-medium ${getStatusColor(overallHealth)}`}>
              {getStatusIcon(overallHealth)} {overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {getHealthMetrics().map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{metric.name}</h3>
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(metric.status)}`}>
                {getStatusIcon(metric.status)} {metric.status}
              </span>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Status:</span>
                <span className="ml-2 font-medium">{metric.value}</span>
              </div>
              
              {metric.details && (
                <div>
                  <span className="text-sm text-gray-600">Details:</span>
                  <span className="ml-2 text-sm">{metric.details}</span>
                </div>
              )}
              
              <div>
                <span className="text-sm text-gray-600">Last checked:</span>
                <span className="ml-2 text-sm">{metric.lastChecked}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Database Information */}
      {health && health.database && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Open Connections</div>
              <div className="text-2xl font-bold text-gray-900">
                {health.database.open_connections || 'N/A'}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">In Use</div>
              <div className="text-2xl font-bold text-blue-600">
                {health.database.in_use || 'N/A'}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Idle</div>
              <div className="text-2xl font-bold text-green-600">
                {health.database.idle || 'N/A'}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Wait Count</div>
              <div className="text-2xl font-bold text-orange-600">
                {health.database.wait_count || 'N/A'}
              </div>
            </div>
          </div>

          {(health.database.wait_duration || health.database.max_idle_closed || health.database.max_lifetime_closed) && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Connection Pool Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {health.database.wait_duration && (
                  <div>
                    <span className="text-sm text-gray-600">Wait Duration:</span>
                    <span className="ml-2 font-medium">{health.database.wait_duration}</span>
                  </div>
                )}
                {health.database.max_idle_closed && (
                  <div>
                    <span className="text-sm text-gray-600">Max Idle Closed:</span>
                    <span className="ml-2 font-medium">{health.database.max_idle_closed}</span>
                  </div>
                )}
                {health.database.max_lifetime_closed && (
                  <div>
                    <span className="text-sm text-gray-600">Max Lifetime Closed:</span>
                    <span className="ml-2 font-medium">{health.database.max_lifetime_closed}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Server Information */}
      {health && health.server && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Server Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Server Status</div>
              <div className="text-lg font-bold text-gray-900">
                {health.server.status}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Uptime</div>
              <div className="text-lg font-bold text-green-600">
                {health.server.uptime}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <span className="text-sm text-gray-600">Last Check:</span>
            <span className="ml-2 text-sm">{health.server.timestamp}</span>
          </div>
        </div>
      )}

      {/* System Recommendations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Recommendations</h2>
        
        <div className="space-y-3">
          {overallHealth === 'healthy' ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800">All systems are operating normally</span>
              </div>
            </div>
          ) : overallHealth === 'warning' ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-800">Some system components need attention</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800">Critical system issues detected</span>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="space-y-2">
              <div className="font-medium text-blue-800">Recommendations:</div>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Monitor database connections regularly</li>
                <li>Set up alerts for critical system failures</li>
                <li>Review system performance metrics daily</li>
                <li>Keep system dependencies updated</li>
                <li>Implement regular backup schedules</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && !health && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthMonitor;
