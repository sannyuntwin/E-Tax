'use client'

import { useState, useEffect } from 'react'
import { Palette, Eye, EyeOff, Save, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'

interface WhiteLabelConfig {
  id?: number
  company_id?: number
  brand_name: string
  logo_url: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  font_family: string
  custom_css: string
  custom_domain: string
  is_enabled: boolean
  settings?: string
  created_at?: string
  updated_at?: string
}

interface WhiteLabelConfigProps {
  onSave: (config: Partial<WhiteLabelConfig>) => void
}

export default function WhiteLabelConfig({ onSave }: WhiteLabelConfigProps) {
  const [config, setConfig] = useState<WhiteLabelConfig>({
    brand_name: '',
    logo_url: '',
    primary_color: '#3b82f6',
    secondary_color: '#64748b',
    accent_color: '#10b981',
    background_color: '#f9fafb',
    font_family: 'Inter, sans-serif',
    custom_css: '',
    custom_domain: '',
    is_enabled: false,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  useEffect(() => {
    fetchWhiteLabelConfig()
  }, [])

  const fetchWhiteLabelConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/white-label`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        if (data.logo_url) {
          setLogoPreview(data.logo_url)
        }
      }
    } catch (error) {
      console.error('Error fetching white-label config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`${API_BASE}/api/white-label`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setMessage('White-label configuration saved successfully!')
        setMessageType('success')
        onSave(config)
      } else {
        setMessage('Failed to save configuration')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error saving white-label config:', error)
      setMessage('Failed to save configuration')
      setMessageType('error')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setLogoPreview(result)
        setConfig({ ...config, logo_url: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleColorChange = (colorType: string, value: string) => {
    setConfig({ ...config, [colorType]: value })
  }

  const resetToDefaults = () => {
    setConfig({
      brand_name: '',
      logo_url: '',
      primary_color: '#3b82f6',
      secondary_color: '#64748b',
      accent_color: '#10b981',
      background_color: '#f9fafb',
      font_family: 'Inter, sans-serif',
      custom_css: '',
      custom_domain: '',
      is_enabled: false,
    })
    setLogoPreview('')
  }

  const presetThemes = [
    {
      name: 'Professional Blue',
      primary_color: '#3b82f6',
      secondary_color: '#64748b',
      accent_color: '#10b981',
      background_color: '#f9fafb',
    },
    {
      name: 'Modern Purple',
      primary_color: '#8b5cf6',
      secondary_color: '#a78bfa',
      accent_color: '#ec4899',
      background_color: '#faf5ff',
    },
    {
      name: 'Elegant Teal',
      primary_color: '#14b8a6',
      secondary_color: '#5eead4',
      accent_color: '#f59e0b',
      background_color: '#f0fdfa',
    },
    {
      name: 'Bold Orange',
      primary_color: '#f97316',
      secondary_color: '#fb923c',
      accent_color: '#dc2626',
      background_color: '#fff7ed',
    },
  ]

  const applyPresetTheme = (theme: typeof presetThemes[0]) => {
    setConfig({
      ...config,
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color,
      accent_color: theme.accent_color,
      background_color: theme.background_color,
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          White-Label Configuration
        </h3>
        <div className="flex space-x-4">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              previewMode
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </button>
          <button
            onClick={resetToDefaults}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          messageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex items-center">
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* Preview Mode */}
      {previewMode ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo"
                className="h-16 mx-auto mb-4"
                style={{ maxHeight: '64px' }}
              />
            ) : (
              <div
                className="h-16 w-32 mx-auto mb-4 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: config.primary_color }}
              >
                {config.brand_name || 'Your Brand'}
              </div>
            )}
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: config.primary_color }}
            >
              {config.brand_name || 'Your Brand Name'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Professional Invoice Management System
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="p-6 rounded-lg"
              style={{ backgroundColor: config.background_color }}
            >
              <h3 className="font-semibold mb-2" style={{ color: config.primary_color }}>
                Total Invoices
              </h3>
              <p className="text-2xl font-bold" style={{ color: config.secondary_color }}>
                1,234
              </p>
            </div>
            <div
              className="p-6 rounded-lg"
              style={{ backgroundColor: config.background_color }}
            >
              <h3 className="font-semibold mb-2" style={{ color: config.primary_color }}>
                Total Revenue
              </h3>
              <p className="text-2xl font-bold" style={{ color: config.accent_color }}>
                ฿456,789
              </p>
            </div>
            <div
              className="p-6 rounded-lg"
              style={{ backgroundColor: config.background_color }}
            >
              <h3 className="font-semibold mb-2" style={{ color: config.primary_color }}>
                Active Users
              </h3>
              <p className="text-2xl font-bold" style={{ color: config.secondary_color }}>
                56
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              className="px-6 py-3 text-white rounded-lg font-medium"
              style={{ backgroundColor: config.primary_color }}
            >
              Get Started
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Basic Settings
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={config.brand_name}
                  onChange={(e) => setConfig({ ...config, brand_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                  placeholder="Your Brand Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Domain
                </label>
                <input
                  type="text"
                  value={config.custom_domain}
                  onChange={(e) => setConfig({ ...config, custom_domain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                  placeholder="yourdomain.com"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.is_enabled}
                  onChange={(e) => setConfig({ ...config, is_enabled: e.target.checked })}
                  className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable White-Label Mode
                </span>
              </label>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Logo
            </h4>

            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="h-20 w-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Recommended: PNG or JPG, max 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Color Scheme */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Color Scheme
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => handleColorChange('primary_color', e.target.value)}
                    className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primary_color}
                    onChange={(e) => handleColorChange('primary_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={config.secondary_color}
                    onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                    className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.secondary_color}
                    onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={config.accent_color}
                    onChange={(e) => handleColorChange('accent_color', e.target.value)}
                    className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.accent_color}
                    onChange={(e) => handleColorChange('accent_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Background Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={config.background_color}
                    onChange={(e) => handleColorChange('background_color', e.target.value)}
                    className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.background_color}
                    onChange={(e) => handleColorChange('background_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Preset Themes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Preset Themes
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {presetThemes.map((theme, index) => (
                  <button
                    key={index}
                    onClick={() => applyPresetTheme(theme)}
                    className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 transition-colors"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.primary_color }}
                      ></div>
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.accent_color }}
                      ></div>
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.secondary_color }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {theme.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Typography
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Family
              </label>
              <select
                value={config.font_family}
                onChange={(e) => setConfig({ ...config, font_family: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white"
              >
                <option value="Inter, sans-serif">Inter</option>
                <option value="Roboto, sans-serif">Roboto</option>
                <option value="Open Sans, sans-serif">Open Sans</option>
                <option value="Lato, sans-serif">Lato</option>
                <option value="Poppins, sans-serif">Poppins</option>
                <option value="Montserrat, sans-serif">Montserrat</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
              </select>
            </div>
          </div>

          {/* Custom CSS */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Custom CSS
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom CSS (Advanced)
              </label>
              <textarea
                value={config.custom_css}
                onChange={(e) => setConfig({ ...config, custom_css: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white font-mono text-sm"
                placeholder="/* Add custom CSS here */"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Add custom CSS to override default styles
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
