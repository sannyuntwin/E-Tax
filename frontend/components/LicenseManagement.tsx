'use client'

import { useState, useEffect } from 'react'
import { Key, CheckCircle, AlertCircle, Clock, Users, FileText, Zap, Crown, RefreshCw, Plus, Trash2 } from 'lucide-react'

interface LicenseKey {
  id: number
  company_id: number
  license_key: string
  license_type: string
  status: string
  issued_at: string
  expires_at?: string
  max_users: number
  max_invoices: number
  max_api_keys: number
  features: string[]
  usage_stats: any
  last_validated?: string
  validation_count: number
  server_url: string
  metadata: any
}

interface LicenseValidationRequest {
  license_key: string
  action: string
  feature?: string
}

interface LicenseValidationResponse {
  valid: boolean
  license_type: string
  expires_at: string
  features: string[]
  max_users: number
  max_invoices: number
  max_api_keys: number
  message: string
}

import { getMachineId, getCachedLicense, storeLicense } from '../utils/license'

export default function LicenseManagement() {
  const [licenses, setLicenses] = useState<LicenseKey[]>([])
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLicenseKey, setNewLicenseKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [machineId, setMachineId] = useState('')

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081'

  useEffect(() => {
    setMachineId(getMachineId())
    fetchLicenses()
  }, [])

  const fetchLicenses = async () => {
    try {
      // First check local cache for immediate display
      const cached = getCachedLicense()
      if (cached) {
        setLicenses([cached as unknown as LicenseKey])
      }

      const response = await fetch(`${API_BASE}/api/v1/license/info`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.status === 'unactivated' || data.license_type === 'none') {
          setLicenses([])
        } else {
          setLicenses([data]) // API returns single license info
          // Sync cache
          storeLicense(data)
        }
      }
    } catch (error) {
      console.error('Error fetching licenses:', error)
      setError('Failed to fetch licenses')
    } finally {
      setLoading(false)
    }
  }

  const validateLicense = async (licenseKey: string) => {
    setValidating(licenseKey)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/v1/license/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          license_key: licenseKey,
          action: 'login'
        })
      })

      if (response.ok) {
        const data: LicenseValidationResponse = await response.json()
        setSuccess(data.message)
        await fetchLicenses() // Refresh license list
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'License validation failed')
      }
    } catch (error) {
      console.error('Error validating license:', error)
      setError('Failed to validate license')
    } finally {
      setValidating(null)
    }
  }

  const addLicense = async () => {
    if (!newLicenseKey.trim()) {
      setError('Please enter a license key')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/license/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          license_key: newLicenseKey.trim(),
          action: 'activate'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.valid || data.status === 'active') {
          setSuccess('License added successfully')
          setNewLicenseKey('')
          setShowAddForm(false)

          // Sync cache immediately if valid
          storeLicense(data)
          await fetchLicenses()
        } else {
          setError(data.message || 'Invalid license key')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to add license')
      }
    } catch (error) {
      console.error('Error adding license:', error)
      setError('Failed to add license')
    }
  }

  const checkFeatureAccess = async (feature: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/license/check/${feature}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(`Feature "${feature}" access: ${data.feature_access ? 'Granted' : 'Denied'}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to check feature access')
      }
    } catch (error) {
      console.error('Error checking feature access:', error)
      setError('Failed to check feature access')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'expired':
        return <Clock className="w-5 h-5 text-red-500" />
      case 'suspended':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getLicenseTypeIcon = (type: string) => {
    switch (type) {
      case 'enterprise':
        return <Crown className="w-5 h-5 text-purple-500" />
      case 'professional':
        return <Zap className="w-5 h-5 text-blue-500" />
      case 'basic':
        return <Users className="w-5 h-5 text-green-500" />
      case 'trial':
        return <FileText className="w-5 h-5 text-gray-500" />
      default:
        return <Key className="w-5 h-5 text-gray-500" />
    }
  }

  const features = [
    'basic_invoicing',
    'advanced_invoicing',
    'recurring_invoices',
    'white_label',
    'api_access',
    'multi_user',
    'advanced_reporting',
    'pos_integration',
    'marketplace_sync',
    'unlimited_invoices'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">License Management</h2>
          <p className="text-gray-600">Manage your license keys and feature access</p>
          <p className="text-xs text-gray-500 mt-1">Machine ID: <code className="bg-gray-100 px-1 rounded">{machineId}</code></p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add License
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Add License Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Add New License</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Key
              </label>
              <input
                type="text"
                value={newLicenseKey}
                onChange={(e) => setNewLicenseKey(e.target.value)}
                placeholder="Enter your license key"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addLicense}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add License
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewLicenseKey('')
                  setError(null)
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* License List */}
      <div className="space-y-4">
        {licenses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Licenses Found</h3>
            <p className="text-gray-600 mb-4">Add a license key to get started</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Your First License
            </button>
          </div>
        ) : (
          licenses.map((license) => (
            <div key={license.id || license.license_key} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getLicenseTypeIcon(license.license_type)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {license.license_type.charAt(0).toUpperCase() + license.license_type.slice(1)} License
                    </h3>
                    <p className="text-sm text-gray-600">{license.license_key}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(license.status)}
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {license.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Max Users</p>
                  <p className="text-lg font-semibold">{license.max_users}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Max Invoices</p>
                  <p className="text-lg font-semibold">
                    {license.max_invoices === -1 ? 'Unlimited' : license.max_invoices}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Max API Keys</p>
                  <p className="text-lg font-semibold">{license.max_api_keys}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Features</p>
                <div className="flex flex-wrap gap-2">
                  {(license.features || []).map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {feature.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {license.expires_at && (
                    <p>
                      Expires: {new Date(license.expires_at).toLocaleDateString()}
                      {' '}
                      <span className={`font-medium ${new Date(license.expires_at).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
                          ? 'text-red-600'
                          : 'text-blue-600'
                        }`}>
                        ({Math.ceil((new Date(license.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left)
                      </span>
                    </p>
                  )}
                  <p>Last validated: {license.last_validated ?
                    new Date(license.last_validated).toLocaleDateString() :
                    'Never'
                  }</p>
                </div>
                <button
                  onClick={() => validateLicense(license.license_key)}
                  disabled={validating === license.license_key}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {validating === license.license_key ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Validate
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Feature Access Check */}
      {licenses.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Check Feature Access</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {features.map((feature) => (
              <button
                key={feature}
                onClick={() => checkFeatureAccess(feature)}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {feature.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
