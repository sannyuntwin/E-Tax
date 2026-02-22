"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/utils/api';

interface SystemStats {
  users: {
    total: number;
    active: number;
  };
  companies: {
    total: number;
  };
  invoices: {
    total: number;
    draft: number;
    sent: number;
  };
  activity: {
    recent_logins: number;
  };
}

const AdminSystemStats: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/system/stats');

      if (!response.ok) throw new Error('Failed to fetch system statistics');

      const data = await response.json();
      setStats(data.stats);
      setLastUpdated(new Date());
    } catch (error) {
      toast.error('Error fetching system statistics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = () => {
    if (!stats) return 'unknown';
    
    const activeUserRatio = stats.users.active / stats.users.total;
    const recentActivityRatio = stats.activity.recent_logins / Math.max(stats.users.total, 1);
    
    if (activeUserRatio > 0.7 && recentActivityRatio > 0.3) return 'excellent';
    if (activeUserRatio > 0.5 && recentActivityRatio > 0.2) return 'good';
    if (activeUserRatio > 0.3) return 'fair';
    return 'poor';
  };

  const getHealthColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'excellent': 'bg-green-100 text-green-800',
      'good': 'bg-blue-100 text-blue-800',
      'fair': 'bg-yellow-100 text-yellow-800',
      'poor': 'bg-red-100 text-red-800',
      'unknown': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.unknown;
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return '🟢';
      case 'good':
        return '🔵';
      case 'fair':
        return '🟡';
      case 'poor':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getPercentage = (part: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  };

  const healthStatus = getHealthStatus();

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">System Statistics</h1>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(healthStatus)}`}>
            {getHealthIcon(healthStatus)} System Health: {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
          </span>
          <button
            onClick={fetchStats}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div className="text-sm text-gray-500 mb-4">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats?.users.total || 0)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatNumber(stats?.users.active || 0)} active ({getPercentage(stats?.users.active || 0, stats?.users.total || 0)}%)
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Companies</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats?.companies.total || 0)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Registered businesses
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats?.invoices.total || 0)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatNumber(stats?.invoices.sent || 0)} sent, {formatNumber(stats?.invoices.draft || 0)} draft
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Activity</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats?.activity.recent_logins || 0)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Logins in last 7 days
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">User Statistics</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Active Users</span>
                <span className="font-medium">{formatNumber(stats?.users.active || 0)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${getPercentage(stats?.users.active || 0, stats?.users.total || 0)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Inactive Users</span>
                <span className="font-medium">{formatNumber((stats?.users.total || 0) - (stats?.users.active || 0))}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full" 
                  style={{ width: `${getPercentage((stats?.users.total || 0) - (stats?.users.active || 0), stats?.users.total || 0)}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Users:</span>
                  <span className="font-medium ml-2">{formatNumber(stats?.users.total || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Activity Rate:</span>
                  <span className="font-medium ml-2">
                    {getPercentage(stats?.users.active || 0, stats?.users.total || 0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Invoice Statistics</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Sent Invoices</span>
                <span className="font-medium">{formatNumber(stats?.invoices.sent || 0)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${getPercentage(stats?.invoices.sent || 0, stats?.invoices.total || 0)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Draft Invoices</span>
                <span className="font-medium">{formatNumber(stats?.invoices.draft || 0)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full" 
                  style={{ width: `${getPercentage(stats?.invoices.draft || 0, stats?.invoices.total || 0)}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Invoices:</span>
                  <span className="font-medium ml-2">{formatNumber(stats?.invoices.total || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Completion Rate:</span>
                  <span className="font-medium ml-2">
                    {getPercentage(stats?.invoices.sent || 0, stats?.invoices.total || 0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Company Statistics</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {formatNumber(stats?.companies.total || 0)}
                </div>
                <div className="text-sm text-gray-600">Total Companies</div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Users per Company:</span>
                  <span className="font-medium">
                    {stats?.companies.total ? (stats.users.total / stats.companies.total).toFixed(1) : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Invoices per Company:</span>
                  <span className="font-medium">
                    {stats?.companies.total ? (stats.invoices.total / stats.companies.total).toFixed(1) : '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Activity Statistics</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {formatNumber(stats?.activity.recent_logins || 0)}
                </div>
                <div className="text-sm text-gray-600">Logins (Last 7 Days)</div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Average:</span>
                  <span className="font-medium">
                    {((stats?.activity.recent_logins || 0) / 7).toFixed(1)} logins/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User Engagement:</span>
                  <span className="font-medium">
                    {stats?.users.total ? getPercentage(stats?.activity.recent_logins || 0, stats.users.total) : 0}% active this week
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">System Health Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl mb-2">{getHealthIcon(healthStatus)}</div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(healthStatus)}`}>
              Overall Health: {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {getPercentage(stats?.users.active || 0, stats?.users.total || 0)}%
            </div>
            <div className="text-sm text-gray-600">User Activity Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {getPercentage(stats?.invoices.sent || 0, stats?.invoices.total || 0)}%
            </div>
            <div className="text-sm text-gray-600">Invoice Completion Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemStats;
