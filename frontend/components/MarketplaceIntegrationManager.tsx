"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/utils/api';

interface MarketplaceIntegration {
  id: number;
  platform: string;
  store_url: string;
  api_key: string;
  api_secret: string;
  webhook_url: string;
  is_active: boolean;
  sync_status: string;
  config: string;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

interface IntegrationFormData {
  platform: string;
  store_url: string;
  api_key: string;
  api_secret: string;
  webhook_url: string;
}

const MarketplaceIntegrationManager: React.FC = () => {
  const [integrations, setIntegrations] = useState<MarketplaceIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<MarketplaceIntegration | null>(null);
  const [testingIntegration, setTestingIntegration] = useState<number | null>(null);
  const [formData, setFormData] = useState<IntegrationFormData>({
    platform: 'shopify',
    store_url: '',
    api_key: '',
    api_secret: '',
    webhook_url: '',
  });
  const [showApiKeys, setShowApiKeys] = useState<{ [key: number]: boolean }>({});

  const platforms = [
    { value: 'shopify', label: 'Shopify', icon: '🛒' },
    { value: 'woocommerce', label: 'WooCommerce', icon: '🌺' },
    { value: 'magento', label: 'Magento', icon: '🧱' },
    { value: 'bigcommerce', label: 'BigCommerce', icon: '🏪' },
    { value: 'prestashop', label: 'PrestaShop', icon: '🛍️' },
    { value: 'opencart', label: 'OpenCart', icon: '🚗' },
  ];

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/marketplace-integrations');

      if (!response.ok) throw new Error('Failed to fetch marketplace integrations');

      const data = await response.json();
      setIntegrations(data || []);
    } catch (error) {
      toast.error('Error fetching marketplace integrations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingIntegration 
        ? `/api/marketplace-integrations/${editingIntegration.id}`
        : '/api/marketplace-integrations';
      
      const method = editingIntegration ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save marketplace integration');

      toast.success(editingIntegration ? 'Integration updated successfully' : 'Integration created successfully');
      setIsModalOpen(false);
      setEditingIntegration(null);
      resetForm();
      fetchIntegrations();
    } catch (error) {
      toast.error('Error saving marketplace integration');
      console.error(error);
    }
  };

  const handleTest = async (integrationId: number) => {
    try {
      setTestingIntegration(integrationId);
      const response = await fetch(`/api/marketplace-integrations/${integrationId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to test integration');

      const data = await response.json();
      toast.success('Integration test successful');
      fetchIntegrations();
    } catch (error) {
      toast.error('Integration test failed');
      console.error(error);
    } finally {
      setTestingIntegration(null);
    }
  };

  const handleDisable = async (integrationId: number) => {
    try {
      const response = await fetch(`/api/marketplace-integrations/${integrationId}/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to disable integration');

      toast.success('Integration disabled successfully');
      fetchIntegrations();
    } catch (error) {
      toast.error('Error disabling integration');
      console.error(error);
    }
  };

  const openEditModal = (integration: MarketplaceIntegration) => {
    setEditingIntegration(integration);
    setFormData({
      platform: integration.platform,
      store_url: integration.store_url,
      api_key: integration.api_key,
      api_secret: integration.api_secret,
      webhook_url: integration.webhook_url,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      platform: 'shopify',
      store_url: '',
      api_key: '',
      api_secret: '',
      webhook_url: '',
    });
  };

  const toggleApiKeyVisibility = (integrationId: number) => {
    setShowApiKeys(prev => ({ ...prev, [integrationId]: !prev[integrationId] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getPlatformIcon = (platform: string) => {
    const platformData = platforms.find(p => p.value === platform);
    return platformData?.icon || '🌐';
  };

  const getPlatformLabel = (platform: string) => {
    const platformData = platforms.find(p => p.value === platform);
    return platformData?.label || platform;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'success': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'disabled': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Marketplace Integrations</h1>
        <div className="flex space-x-3">
          <button
            onClick={fetchIntegrations}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingIntegration(null);
              setIsModalOpen(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Integration
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Total Integrations</div>
          <div className="text-2xl font-bold text-gray-900">{integrations.length}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {integrations.filter(i => i.is_active).length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Syncing</div>
          <div className="text-2xl font-bold text-blue-600">
            {integrations.filter(i => i.sync_status === 'success').length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Platforms</div>
          <div className="text-2xl font-bold text-purple-600">
            {new Set(integrations.map(i => i.platform)).size}
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
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Webhook
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Sync
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {integrations.map((integration) => (
                  <tr key={integration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getPlatformIcon(integration.platform)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getPlatformLabel(integration.platform)}
                          </div>
                          <div className="text-sm text-gray-500">{integration.platform}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <a href={integration.store_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {integration.store_url}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {integration.webhook_url ? (
                        <a href={integration.webhook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          {integration.webhook_url}
                        </a>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(integration.sync_status)}`}>
                          {integration.sync_status}
                        </span>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          integration.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {integration.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {integration.last_sync ? (
                        <div>
                          <div>{new Date(integration.last_sync).toLocaleDateString()}</div>
                          <div className="text-xs">{new Date(integration.last_sync).toLocaleTimeString()}</div>
                        </div>
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(integration)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleTest(integration.id)}
                          disabled={testingIntegration === integration.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {testingIntegration === integration.id ? 'Testing...' : 'Test'}
                        </button>
                        {integration.is_active && (
                          <button
                            onClick={() => handleDisable(integration.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Disable
                          </button>
                        )}
                        <button
                          onClick={() => toggleApiKeyVisibility(integration.id)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Keys
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* API Keys Display */}
            {integrations.map((integration) => (
              showApiKeys[integration.id] && (
                <tr key={`keys-${integration.id}`}>
                  <td colSpan={6} className="px-6 py-4 bg-gray-50">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">API Credentials</span>
                        <button
                          onClick={() => toggleApiKeyVisibility(integration.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700">API Key:</span>
                            <button
                              onClick={() => copyToClipboard(integration.api_key)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="font-mono text-xs text-gray-600 bg-white p-2 rounded border break-all">
                            {integration.api_key}
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700">API Secret:</span>
                            <button
                              onClick={() => copyToClipboard(integration.api_secret)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="font-mono text-xs text-gray-600 bg-white p-2 rounded border break-all">
                            {integration.api_secret}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            ))}

            {integrations.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No marketplace integrations found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by connecting your first marketplace
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Integration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingIntegration ? 'Edit Integration' : 'Add New Integration'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {platforms.map((platform) => (
                      <option key={platform.value} value={platform.value}>
                        {platform.icon} {platform.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store URL
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.store_url}
                    onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
                    placeholder="https://your-store.myshopify.com"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Secret
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.api_secret}
                      onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    placeholder="https://your-app.com/webhook"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL to receive real-time updates from the marketplace
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingIntegration ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceIntegrationManager;
