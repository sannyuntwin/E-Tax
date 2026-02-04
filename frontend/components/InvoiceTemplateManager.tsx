'use client'

import { useState, useEffect } from 'react'
import { Save, FileText, Copy, Trash2, Plus } from 'lucide-react'
import { InvoiceTemplate } from '@/types'

interface InvoiceTemplateManagerProps {
  onSelectTemplate: (template: InvoiceTemplate) => void
  onSaveAsTemplate: (invoiceData: any, templateName: string) => void
  companies: any[]
  customers: any[]
}

export default function InvoiceTemplateManager({ 
  onSelectTemplate, 
  onSaveAsTemplate, 
  companies, 
  customers 
}: InvoiceTemplateManagerProps) {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [loading, setLoading] = useState(true)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/invoice-templates`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return

    // Get current invoice data from the form (this would be passed from parent)
    const currentInvoiceData = {
      // This would come from the current form state
      company_id: companies[0]?.id,
      customer_id: customers[0]?.id,
      items: [], // Current items from form
      notes: ''
    }

    onSaveAsTemplate(currentInvoiceData, templateName)
    setShowSaveForm(false)
    setTemplateName('')
    setTemplateDescription('')
  }

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`${API_BASE}/api/invoice-templates/${templateId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId))
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const handleDuplicateTemplate = async (template: InvoiceTemplate) => {
    const newTemplateName = `${template.name} (Copy)`
    try {
      const response = await fetch(`${API_BASE}/api/invoice-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplateName,
          description: template.description,
          company_id: template.company_id,
          customer_id: template.customer_id,
          items: template.items,
          notes: template.notes
        })
      })
      if (response.ok) {
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error duplicating template:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Invoice Templates
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSaveForm(true)}
              className="flex items-center px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <Save className="w-4 h-4 mr-1" />
              Save Current as Template
            </button>
          </div>
        </div>
      </div>

      {/* Save Template Form */}
      {showSaveForm && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black"
                placeholder="e.g., Web Development Services"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-black"
                placeholder="Optional description..."
                rows={2}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Template
              </button>
              <button
                onClick={() => {
                  setShowSaveForm(false)
                  setTemplateName('')
                  setTemplateDescription('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="max-h-96 overflow-y-auto">
        {templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No templates found</p>
            <p className="text-sm mt-2">Save your first invoice as a template</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {templates.map((template) => (
              <div key={template.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      {template.is_default && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Created: {new Date(template.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => onSelectTemplate(template)}
                      className="p-2 text-blue-600 hover:text-blue-800"
                      title="Use Template"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicateTemplate(template)}
                      className="p-2 text-gray-600 hover:text-gray-800"
                      title="Duplicate Template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 text-red-600 hover:text-red-800"
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
