"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/utils/api';

interface SecuritySettings {
  id?: number;
  password_min_length: number;
  require_strong_password: boolean;
  session_timeout: number;
  max_login_attempts: number;
  lockout_duration: number;
  require_two_factor: boolean;
  ip_whitelist: string;
  created_at?: string;
  updated_at?: string;
}

const AdminSecuritySettings: React.FC = () => {
  const [settings, setSettings] = useState<SecuritySettings>({
    password_min_length: 8,
    require_strong_password: true,
    session_timeout: 86400,
    max_login_attempts: 5,
    lockout_duration: 900,
    require_two_factor: false,
    ip_whitelist: '[]',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ipList, setIpList] = useState<string[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    try {
      const parsed = JSON.parse(settings.ip_whitelist);
      setIpList(Array.isArray(parsed) ? parsed : []);
    } catch {
      setIpList([]);
    }
  }, [settings.ip_whitelist]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/security/settings');

      if (!response.ok) throw new Error('Failed to fetch security settings');

      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      toast.error('Error fetching security settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const updatedSettings = {
        ...settings,
        ip_whitelist: JSON.stringify(ipList),
      };

      const response = await apiClient.put('/api/admin/security/settings', updatedSettings);

      if (!response.ok) throw new Error('Failed to update security settings');

      toast.success('Security settings updated successfully');
      fetchSettings();
    } catch (error) {
      toast.error('Error updating security settings');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SecuritySettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const addIpToList = () => {
    const ip = prompt('Enter IP address or CIDR range:');
    if (ip && ip.trim()) {
      setIpList(prev => [...prev, ip.trim()]);
    }
  };

  const removeIpFromList = (index: number) => {
    setIpList(prev => prev.filter((_, i) => i !== index));
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
        <button
          onClick={fetchSettings}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Password Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Password Policy</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Password Length
              </label>
              <input
                type="number"
                min="4"
                max="128"
                value={settings.password_min_length}
                onChange={(e) => handleInputChange('password_min_length', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum number of characters required
              </p>
            </div>

            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="require_strong_password"
                checked={settings.require_strong_password}
                onChange={(e) => handleInputChange('require_strong_password', e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="require_strong_password" className="text-sm font-medium text-gray-700">
                Require Strong Password
              </label>
            </div>
          </div>

          {settings.require_strong_password && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Strong passwords must contain: uppercase letters, lowercase letters, numbers, and special characters
              </p>
            </div>
          )}
        </div>

        {/* Session Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Session Management</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout
            </label>
            <select
              value={settings.session_timeout}
              onChange={(e) => handleInputChange('session_timeout', parseInt(e.target.value))}
              className="w-full md:w-64 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1800}>30 minutes</option>
              <option value={3600}>1 hour</option>
              <option value={7200}>2 hours</option>
              <option value={14400}>4 hours</option>
              <option value={28800}>8 hours</option>
              <option value={86400}>24 hours</option>
              <option value={604800}>1 week</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Users will be automatically logged out after this period of inactivity
            </p>
          </div>
        </div>

        {/* Login Protection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Login Protection</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Login Attempts
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.max_login_attempts}
                onChange={(e) => handleInputChange('max_login_attempts', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of failed attempts before account lockout
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lockout Duration
              </label>
              <select
                value={settings.lockout_duration}
                onChange={(e) => handleInputChange('lockout_duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={300}>5 minutes</option>
                <option value={900}>15 minutes</option>
                <option value={1800}>30 minutes</option>
                <option value={3600}>1 hour</option>
                <option value={7200}>2 hours</option>
                <option value={86400}>24 hours</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                How long to lock the account after too many failed attempts
              </p>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Two-Factor Authentication</h2>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="require_two_factor"
              checked={settings.require_two_factor}
              onChange={(e) => handleInputChange('require_two_factor', e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="require_two_factor" className="text-sm font-medium text-gray-700">
              Require Two-Factor Authentication
            </label>
          </div>
          
          {settings.require_two_factor && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ This will require all users to set up 2FA. Make sure you have proper support documentation.
              </p>
            </div>
          )}
        </div>

        {/* IP Whitelist */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">IP Whitelist</h2>
          
          <div className="space-y-3">
            {ipList.map((ip, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-mono text-sm">{ip}</span>
                <button
                  type="button"
                  onClick={() => removeIpFromList(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addIpToList}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-gray-600 hover:text-gray-800"
            >
              + Add IP Address
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-3">
            Only users from these IP addresses will be allowed to access the admin panel. Leave empty to allow all IPs.
          </p>
        </div>

        {/* Current Settings Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Current Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Password Length</div>
              <div className="font-semibold">{settings.password_min_length} characters</div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Session Timeout</div>
              <div className="font-semibold">{formatDuration(settings.session_timeout)}</div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Max Login Attempts</div>
              <div className="font-semibold">{settings.max_login_attempts} attempts</div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Lockout Duration</div>
              <div className="font-semibold">{formatDuration(settings.lockout_duration)}</div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Strong Password</div>
              <div className="font-semibold">{settings.require_strong_password ? 'Required' : 'Not required'}</div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">2FA Required</div>
              <div className="font-semibold">{settings.require_two_factor ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSecuritySettings;
