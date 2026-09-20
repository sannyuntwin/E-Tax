'use client'

import { useState } from 'react'
import { Key, X, CheckCircle, AlertCircle } from 'lucide-react'
import { getMachineId, storeLicense } from '../utils/license'

interface LicenseActivationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LicenseActivation({ isOpen, onClose, onSuccess }: LicenseActivationProps) {
  const [licenseKey, setLicenseKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!licenseKey.trim()) {
      setError('Please enter a license key')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const machineId = getMachineId()
      const response = await fetch(`${API_BASE}/api/v1/license/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          license_key: licenseKey.trim(),
          action: 'activate',
          machine_id: machineId,
          machine_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.valid) {
          // Store license data locally
          storeLicense({
            license_key: licenseKey.trim(),
            license_type: data.license_type,
            status: 'active',
            expires_at: data.expires_at,
            max_users: data.max_users,
            max_invoices: data.max_invoices,
            max_api_keys: data.max_api_keys,
            features: data.features,
            validation_count: 1,
            last_validated: new Date().toISOString()
          })

          setSuccess('License activated successfully!')
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 1500)
        } else {
          setError(data.message || 'Invalid license key')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to activate license')
      }
    } catch (error) {
      console.error('Error activating license:', error)
      setError('Failed to connect to license server')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Activate License</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Key
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="Enter your license key"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the license key you received from your purchase
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Activating...' : 'Activate License'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <p className="text-xs text-gray-600 text-center">
            Don't have a license?{' '}
            <button
              onClick={() => {
                // Navigate to upgrade page
                window.location.href = '/license-upgrade'
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Get one now
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
