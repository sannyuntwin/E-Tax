"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/utils/api';

interface LoginAttempt {
  id: number;
  username: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  reason: string;
  created_at: string;
}

const AdminLoginAttempts: React.FC = () => {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [pageSize] = useState(50);
  const [filters, setFilters] = useState({
    success: '',
  });

  useEffect(() => {
    fetchAttempts();
  }, [currentPage, filters]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(filters.success && { success: filters.success }),
      });

      const response = await apiClient.get(`/api/admin/login-attempts?${params}`);

      if (!response.ok) throw new Error('Failed to fetch login attempts');

      const data = await response.json();
      setAttempts(data.attempts || []);
      setTotalAttempts(data.total || 0);
    } catch (error) {
      toast.error('Error fetching login attempts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const getReasonColor = (reason: string) => {
    const colors: { [key: string]: string } = {
      'success': 'bg-green-100 text-green-800',
      'invalid_credentials': 'bg-red-100 text-red-800',
      'user_inactive': 'bg-yellow-100 text-yellow-800',
      'account_locked': 'bg-red-100 text-red-800',
      'invalid_password': 'bg-orange-100 text-orange-800',
    };
    return colors[reason] || 'bg-gray-100 text-gray-800';
  };

  const getReasonLabel = (reason: string) => {
    const labels: { [key: string]: string } = {
      'success': 'Success',
      'invalid_credentials': 'Invalid Credentials',
      'user_inactive': 'User Inactive',
      'account_locked': 'Account Locked',
      'invalid_password': 'Invalid Password',
    };
    return labels[reason] || reason;
  };

  const getUserAgentInfo = (userAgent: string) => {
    // Simple user agent parsing
    let browser = 'Unknown';
    let os = 'Unknown';
    
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    return { browser, os };
  };

  const totalPages = Math.ceil(totalAttempts / pageSize);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Login Attempts</h1>
        <button
          onClick={fetchAttempts}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.success}
              onChange={(e) => handleFilterChange('success', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Attempts</option>
              <option value="true">Successful</option>
              <option value="false">Failed</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ success: '' });
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Total Attempts</div>
          <div className="text-2xl font-bold text-gray-900">{totalAttempts}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Successful</div>
          <div className="text-2xl font-bold text-green-600">
            {attempts.filter(a => a.success).length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Failed</div>
          <div className="text-2xl font-bold text-red-600">
            {attempts.filter(a => !a.success).length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Success Rate</div>
          <div className="text-2xl font-bold text-blue-600">
            {attempts.length > 0 
              ? Math.round((attempts.filter(a => a.success).length / attempts.length) * 100)
              : 0}%
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
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
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Browser/OS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attempts.map((attempt) => {
                  const { browser, os } = getUserAgentInfo(attempt.user_agent);
                  return (
                    <tr key={attempt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{new Date(attempt.created_at).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(attempt.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{attempt.username}</span>
                          {attempt.success && (
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {!attempt.success && (
                            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{attempt.ip_address}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(attempt.ip_address)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copy IP"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          attempt.success 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {attempt.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getReasonColor(attempt.reason)}`}>
                          {getReasonLabel(attempt.reason)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-medium">{browser}</span>
                          <span className="text-xs text-gray-500">{os}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalAttempts)} of {totalAttempts} attempts
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {attempts.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No login attempts found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filters.success ? 'Try adjusting your filters' : 'No login attempts have been recorded yet'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      <div id="attempt-details-modal" className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Login Attempt Details</h2>
          <div id="attempt-details-content">
            {/* Details will be populated here */}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => document.getElementById('attempt-details-modal')?.classList.add('hidden')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginAttempts;
