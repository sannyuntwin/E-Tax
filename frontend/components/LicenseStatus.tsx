'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Clock, Crown, Zap, Users, FileText, Key } from 'lucide-react'

interface LicenseInfo {
  license_key: string
  license_type: string
  status: string
  expires_at?: string
  max_users: number
  max_invoices: number
  max_api_keys: number
  features: string[]
  validation_count: number
  last_validated?: string
}

interface LicenseStatusProps {
  compact?: boolean
}

import { getCachedLicense } from '../utils/license'

export default function LicenseStatus({ compact = false }: LicenseStatusProps) {
  const [license, setLicense] = useState<LicenseInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8081'

  useEffect(() => {
    // Initial load from cache
    const cached = getCachedLicense()
    if (cached) {
      setLicense(cached as unknown as LicenseInfo)
      setLoading(false)
    }
    fetchLicenseInfo()
  }, [])

  const fetchLicenseInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/license/info`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLicense(data)
      }
    } catch (error) {
      console.error('Error fetching license info:', error)
    } finally {
      setLoading(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'expired':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'suspended':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getDaysUntilExpiry = (expiresAt?: string) => {
    if (!expiresAt) return null
    const expiryDate = new Date(expiresAt)
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
    )
  }

  if (!license || license.status === 'unactivated' || license.license_type === 'none') {
    return (
      <div className={`border rounded-lg p-4 ${compact ? 'inline-block' : 'w-full'}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-gray-400" />
          <div>
            <p className="font-medium text-gray-700">No License Active</p>
            {!compact && <p className="text-sm text-gray-500">Add a license to access all features</p>}
          </div>
        </div>
      </div>
    )
  }

  const daysUntilExpiry = getDaysUntilExpiry(license.expires_at)
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0

  if (compact) {
    return (
      <div className={`border rounded-lg p-3 inline-flex items-center gap-2 ${getStatusColor(license.status)}`}>
        {getLicenseTypeIcon(license.license_type)}
        <div>
          <p className="font-medium capitalize">{license.license_type}</p>
          <p className="text-xs">
            {license.status}
            {daysUntilExpiry !== null && (
              <span className="ml-1 opacity-75">
                ({daysUntilExpiry < 0 ? 'Expired' : `${daysUntilExpiry}d left`})
              </span>
            )}
          </p>
        </div>
        {getStatusIcon(license.status)}
      </div>
    )
  }

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(license.status)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getLicenseTypeIcon(license.license_type)}
          <div>
            <h3 className="font-semibold capitalize">
              {license.license_type} License
            </h3>
            <p className="text-sm opacity-75">{license.license_key}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(license.status)}
          <span className="font-medium capitalize">{license.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
        <div>
          <p className="text-xs opacity-75">Users</p>
          <p className="font-semibold">{license.max_users}</p>
        </div>
        <div>
          <p className="text-xs opacity-75">Invoices</p>
          <p className="font-semibold">
            {license.max_invoices === -1 ? 'Unlimited' : license.max_invoices}
          </p>
        </div>
        <div>
          <p className="text-xs opacity-75">API Keys</p>
          <p className="font-semibold">{license.max_api_keys}</p>
        </div>
        <div>
          <p className="text-xs opacity-75">Validations</p>
          <p className="font-semibold">{license.validation_count}</p>
        </div>
      </div>

      {license.expires_at && (
        <div className="mb-3">
          <p className="text-xs opacity-75 mb-1">License Status</p>
          {daysUntilExpiry !== null && (
            <div className={`text-sm font-medium ${daysUntilExpiry < 0 ? 'text-red-600' :
              isExpiringSoon ? 'text-yellow-600' :
                'text-green-600'
              }`}>
              {daysUntilExpiry < 0
                ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                : isExpiringSoon
                  ? `Expires in ${daysUntilExpiry} days`
                  : `Valid for ${daysUntilExpiry} days`
              }
            </div>
          )}
          <p className="text-xs opacity-75">
            Expires: {new Date(license.expires_at).toLocaleDateString()}
          </p>
        </div>
      )}

      <div>
        <p className="text-xs opacity-75 mb-2">Features</p>
        <div className="flex flex-wrap gap-1">
          {(license.features || []).slice(0, compact ? 3 : undefined).map((feature, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-white bg-opacity-50 text-xs rounded-full"
            >
              {feature.replace('_', ' ')}
            </span>
          ))}
          {!compact && (license.features || []).length > 3 && (
            <span className="px-2 py-1 bg-white bg-opacity-50 text-xs rounded-full">
              +{license.features.length - 3} more
            </span>
          )}
        </div>
      </div>

      {license.last_validated && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
          <p className="text-xs opacity-75">
            Last validated: {new Date(license.last_validated).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  )
}
