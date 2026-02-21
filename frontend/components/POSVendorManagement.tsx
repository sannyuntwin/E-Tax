"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface POSVendor {
  id: number;
  vendor_name: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  commission_rate: number;
  max_invoices: number;
  features: string;
  api_access: boolean;
  api_key: string;
  api_secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface POSVendorFormData {
  vendor_name: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  commission_rate: number;
  max_invoices: number;
  features: string;
  api_access: boolean;
}

const POSVendorManagement: React.FC = () => {
  const [vendors, setVendors] = useState<POSVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<POSVendor | null>(null);
  const [formData, setFormData] = useState<POSVendorFormData>({
    vendor_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    commission_rate: 0,
    max_invoices: 100,
    features: '',
    api_access: false,
  });
  const [showApiKeys, setShowApiKeys] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pos-vendors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch POS vendors');

      const data = await response.json();
      setVendors(data || []);
    } catch (error) {
      toast.error('Error fetching POS vendors');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingVendor 
        ? `/api/pos-vendors/${editingVendor.id}`
        : '/api/pos-vendors';
      
      const method = editingVendor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save POS vendor');

      toast.success(editingVendor ? 'POS vendor updated successfully' : 'POS vendor created successfully');
      setIsModalOpen(false);
      setEditingVendor(null);
      resetForm();
      fetchVendors();
    } catch (error) {
      toast.error('Error saving POS vendor');
      console.error(error);
    }
  };

  const handleActivate = async (vendorId: number) => {
    try {
      const response = await fetch(`/api/pos-vendors/${vendorId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to activate POS vendor');

      toast.success('POS vendor activated successfully');
      fetchVendors();
    } catch (error) {
      toast.error('Error activating POS vendor');
      console.error(error);
    }
  };

  const handleDeactivate = async (vendorId: number) => {
    try {
      const response = await fetch(`/api/pos-vendors/${vendorId}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to deactivate POS vendor');

      toast.success('POS vendor deactivated successfully');
      fetchVendors();
    } catch (error) {
      toast.error('Error deactivating POS vendor');
      console.error(error);
    }
  };

  const handleGenerateApiKeys = async (vendorId: number) => {
    try {
      const response = await fetch(`/api/pos-vendors/${vendorId}/generate-api-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to generate API keys');

      const data = await response.json();
      toast.success('New API keys generated successfully');
      fetchVendors();
      
      // Show the new keys
      alert(`New API Key: ${data.api_key}\nNew API Secret: ${data.api_secret}\n\nPlease save these securely.`);
    } catch (error) {
      toast.error('Error generating API keys');
      console.error(error);
    }
  };

  const openEditModal = (vendor: POSVendor) => {
    setEditingVendor(vendor);
    setFormData({
      vendor_name: vendor.vendor_name,
      contact_email: vendor.contact_email,
      contact_phone: vendor.contact_phone,
      website: vendor.website,
      commission_rate: vendor.commission_rate,
      max_invoices: vendor.max_invoices,
      features: vendor.features,
      api_access: vendor.api_access,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      vendor_name: '',
      contact_email: '',
      contact_phone: '',
      website: '',
      commission_rate: 0,
      max_invoices: 100,
      features: '',
      api_access: false,
    });
  };

  const toggleApiKeyVisibility = (vendorId: number) => {
    setShowApiKeys(prev => ({ ...prev, [vendorId]: !prev[vendorId] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">POS Vendor Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={fetchVendors}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingVendor(null);
              setIsModalOpen(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Vendor
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Total Vendors</div>
          <div className="text-2xl font-bold text-gray-900">{vendors.length}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {vendors.filter(v => v.is_active).length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">API Access</div>
          <div className="text-2xl font-bold text-blue-600">
            {vendors.filter(v => v.api_access).length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-600">Avg Commission</div>
          <div className="text-2xl font-bold text-purple-600">
            {vendors.length > 0 
              ? (vendors.reduce((sum, v) => sum + v.commission_rate, 0) / vendors.length).toFixed(1)
              : '0'}%
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
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Limits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vendor.vendor_name}</div>
                        <div className="text-sm text-gray-500">
                          {vendor.website && (
                            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              {vendor.website}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <a href={`mailto:${vendor.contact_email}`} className="text-blue-600 hover:text-blue-800">
                          {vendor.contact_email}
                        </a>
                      </div>
                      <div className="text-gray-500">{vendor.contact_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-semibold">{vendor.commission_rate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Max: {vendor.max_invoices}</div>
                      <div className="text-xs text-gray-500">invoices/month</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          vendor.api_access ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {vendor.api_access ? 'Enabled' : 'Disabled'}
                        </span>
                        {vendor.api_access && (
                          <button
                            onClick={() => toggleApiKeyVisibility(vendor.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Show API Keys"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {showApiKeys[vendor.id] && vendor.api_access && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">API Key:</span>
                            <button
                              onClick={() => copyToClipboard(vendor.api_key)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="font-mono text-gray-600 break-all">{vendor.api_key}</div>
                          <div className="flex justify-between items-center mt-2 mb-1">
                            <span className="font-medium">API Secret:</span>
                            <button
                              onClick={() => copyToClipboard(vendor.api_secret)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="font-mono text-gray-600 break-all">{vendor.api_secret}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {vendor.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(vendor)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        {vendor.is_active ? (
                          <button
                            onClick={() => handleDeactivate(vendor.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(vendor.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Activate
                          </button>
                        )}
                        {vendor.api_access && (
                          <button
                            onClick={() => handleGenerateApiKeys(vendor.id)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Regenerate Keys
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {vendors.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No POS vendors found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding a new POS vendor
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingVendor ? 'Edit POS Vendor' : 'Create New POS Vendor'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      required
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Invoices per Month
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.max_invoices}
                      onChange={(e) => setFormData({ ...formData, max_invoices: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Features
                  </label>
                  <textarea
                    rows={3}
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="Describe the features and capabilities of this POS vendor..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="api_access"
                    checked={formData.api_access}
                    onChange={(e) => setFormData({ ...formData, api_access: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="api_access" className="text-sm font-medium text-gray-700">
                    Enable API Access
                  </label>
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
                  {editingVendor ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSVendorManagement;
