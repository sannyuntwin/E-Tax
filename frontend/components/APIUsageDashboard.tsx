"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface APIUsage {
  endpoint: string;
  method: string;
  requests: number;
  avg_response_time: number;
  error_rate: number;
  last_accessed: string;
}

interface UsageQuota {
  endpoint: string;
  limit: number;
  used: number;
  remaining: number;
  reset_date: string;
}

const APIUsageDashboard: React.FC = () => {
  const [usage, setUsage] = useState<APIUsage[]>([]);
  const [quotas, setQuotas] = useState<UsageQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchUsage();
    fetchQuotas();
  }, [selectedPeriod]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchUsage();
        fetchQuotas();
      }, 60000); // Refresh every minute
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/api-usage?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch API usage');

      const data = await response.json();
      setUsage(data.usage || []);
    } catch (error) {
      toast.error('Error fetching API usage');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotas = async () => {
    try {
      const response = await fetch('/api/usage-quotas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch usage quotas');

      const data = await response.json();
      setQuotas(data.quotas || []);
    } catch (error) {
      toast.error('Error fetching usage quotas');
      console.error(error);
    }
  };

  const getMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      'GET': 'bg-green-100 text-green-800',
      'POST': 'bg-blue-100 text-blue-800',
      'PUT': 'bg-yellow-100 text-yellow-800',
      'DELETE': 'bg-red-100 text-red-800',
      'PATCH': 'bg-purple-100 text-purple-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  const getErrorRateColor = (rate: number) => {
    if (rate === 0) return 'text-green-600';
    if (rate < 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 100) return 'text-green-600';
    if (time < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQuotaUsageColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const totalRequests = usage.reduce((sum, item) => sum + item.requests, 0);
  const avgResponseTime = usage.length > 0 
    ? usage.reduce((sum, item) => sum + item.avg_response_time, 0) / usage.length 
    : 0;
  const avgErrorRate = usage.length > 0 
    ? usage.reduce((sum, item) => sum + item.error_rate, 0) / usage.length 
    : 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">API Usage Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoRefresh" className="text-sm font-medium text-gray-700">
              Auto-refresh
            </label>
          </div>
          
          <button
            onClick={() => {
              fetchUsage();
              fetchQuotas();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Usage Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Total Requests</div>
          <div className="text-2xl font-bold text-gray-900">{totalRequests.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Selected period</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Avg Response Time</div>
          <div className={`text-2xl font-bold ${getResponseTimeColor(avgResponseTime)}`}>
            {avgResponseTime.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-500 mt-1">Across all endpoints</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Error Rate</div>
          <div className={`text-2xl font-bold ${getErrorRateColor(avgErrorRate)}`}>
            {avgErrorRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Average error rate</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Active Endpoints</div>
          <div className="text-2xl font-bold text-purple-600">{usage.length}</div>
          <div className="text-xs text-gray-500 mt-1">API endpoints tracked</div>
        </div>
      </div>

      {/* Usage Quotas */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Quotas</h2>
        
        {quotas.length > 0 ? (
          <div className="space-y-4">
            {quotas.map((quota, index) => {
              const usagePercentage = (quota.used / quota.limit) * 100;
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{quota.endpoint}</h3>
                      <p className="text-sm text-gray-600">
                        Resets: {new Date(quota.reset_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {quota.used.toLocaleString()} / {quota.limit.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {quota.remaining.toLocaleString()} remaining
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getQuotaUsageColor(usagePercentage)}`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">{usagePercentage.toFixed(1)}% used</span>
                    <span className={`text-sm font-medium ${
                      usagePercentage > 80 ? 'text-red-600' : 
                      usagePercentage > 50 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {usagePercentage > 80 ? '⚠️ Near limit' : 
                       usagePercentage > 50 ? '🟡 Moderate usage' : '✅ Healthy'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No usage quotas configured</h3>
            <p className="mt-1 text-sm text-gray-500">
              Contact your administrator to set up API usage limits
            </p>
          </div>
        )}
      </div>

      {/* API Usage Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Endpoint Usage</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Accessed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usage.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.endpoint}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMethodColor(item.method)}`}>
                        {item.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.requests.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${getResponseTimeColor(item.avg_response_time)}`}>
                        {item.avg_response_time.toFixed(0)}ms
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${getErrorRateColor(item.error_rate)}`}>
                        {item.error_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.last_accessed).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {usage.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No API usage data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No API calls have been made in the selected period
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Insights</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Response Time Analysis</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">Fast (&lt;100ms)</span>
                <span className="text-sm font-bold text-green-600">
                  {usage.filter(item => item.avg_response_time < 100).length} endpoints
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-yellow-800">Moderate (100-500ms)</span>
                <span className="text-sm font-bold text-yellow-600">
                  {usage.filter(item => item.avg_response_time >= 100 && item.avg_response_time < 500).length} endpoints
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-red-800">Slow (&gt;500ms)</span>
                <span className="text-sm font-bold text-red-600">
                  {usage.filter(item => item.avg_response_time >= 500).length} endpoints
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Error Rate Analysis</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">No Errors (0%)</span>
                <span className="text-sm font-bold text-green-600">
                  {usage.filter(item => item.error_rate === 0).length} endpoints
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-yellow-800">Low Errors (&lt;5%)</span>
                <span className="text-sm font-bold text-yellow-600">
                  {usage.filter(item => item.error_rate > 0 && item.error_rate < 5).length} endpoints
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-red-800">High Errors (&gt;5%)</span>
                <span className="text-sm font-bold text-red-600">
                  {usage.filter(item => item.error_rate >= 5).length} endpoints
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-800 font-medium">Recommendations:</span>
          </div>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
            <li>Monitor endpoints with high error rates for potential issues</li>
            <li>Optimize slow endpoints to improve overall performance</li>
            <li>Set up alerts for when quotas approach their limits</li>
            <li>Review usage patterns to identify optimization opportunities</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default APIUsageDashboard;
