'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText, Download, Eye, Trash2, Edit, BarChart3 } from 'lucide-react'
import InvoiceForm from '@/components/InvoiceForm'
import InvoiceList from '@/components/InvoiceList'
import InvoiceView from '@/components/InvoiceView'
import Dashboard from '@/components/Dashboard'
import SearchAndFilter from '@/components/SearchAndFilter'
import ProductCatalog from '@/components/ProductCatalog'
import { Invoice, Company, Customer, SearchFilters, Product } from '@/types'

export default function Home() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'invoices'>('dashboard')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showProductCatalog, setShowProductCatalog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [loading, setLoading] = useState(true)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (currentView === 'invoices') {
      fetchInvoices()
    }
  }, [currentView, filters])

  const fetchData = async () => {
    try {
      const [companiesRes, customersRes] = await Promise.all([
        fetch(`${API_BASE}/api/companies`),
        fetch(`${API_BASE}/api/customers`)
      ])

      const [companiesData, customersData] = await Promise.all([
        companiesRes.json(),
        customersRes.json()
      ])

      setCompanies(companiesData)
      setCustomers(customersData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const url = params.toString() 
        ? `${API_BASE}/api/invoices/search?${params}`
        : `${API_BASE}/api/invoices`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  const handleCreateInvoice = async (invoiceData: Partial<Invoice>) => {
    try {
      const response = await fetch(`${API_BASE}/api/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      })

      if (response.ok) {
        const newInvoice = await response.json()
        setShowForm(false)
        setCurrentView('invoices')
        fetchInvoices()
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
    }
  }

  const handleSaveDraft = async (invoiceData: Partial<Invoice>) => {
    try {
      const response = await fetch(`${API_BASE}/api/invoices/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      })

      if (response.ok) {
        const draft = await response.json()
        console.log('Draft saved:', draft)
      }
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }

  const handleUpdateInvoice = async (invoiceData: Partial<Invoice>) => {
    if (!editingInvoice) return

    try {
      const response = await fetch(`${API_BASE}/api/invoices/${editingInvoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      })

      if (response.ok) {
        const updatedInvoice = await response.json()
        setInvoices(invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv))
        setEditingInvoice(null)
        fetchInvoices()
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
    }
  }

  const handleDeleteInvoice = async (id: number) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      const response = await fetch(`${API_BASE}/api/invoices/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setInvoices(invoices.filter(inv => inv.id !== id))
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
    }
  }

  const downloadPDF = async (id: number, invoiceNo: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/invoices/${id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice_${invoiceNo}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  const downloadXML = async (id: number, invoiceNo: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/invoices/${id}/xml`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice_${invoiceNo}.xml`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading XML:', error)
    }
  }

  const handleSelectProduct = (product: Product) => {
    // This will be used to add products to invoice form
    console.log('Selected product:', product)
    setShowProductCatalog(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">E-Tax Invoice System</h1>
          <p className="mt-2 text-gray-600">Manage your Thailand e-Tax invoices</p>
          
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('invoices')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                currentView === 'invoices'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-5 h-5 mr-2" />
              Invoices
            </button>
          </div>
        </div>

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <Dashboard 
            onCreateInvoice={() => {
              setShowForm(true)
              setCurrentView('invoices')
            }} 
          />
        )}

        {/* Invoices View */}
        {currentView === 'invoices' && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Invoice
                </button>
                <button
                  onClick={() => setShowProductCatalog(true)}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Product Catalog
                </button>
              </div>
            </div>

            <SearchAndFilter
              filters={filters}
              onFiltersChange={setFilters}
              customers={customers}
            />

            <InvoiceList
              invoices={invoices}
              onView={setSelectedInvoice}
              onEdit={setEditingInvoice}
              onDelete={handleDeleteInvoice}
              onDownloadPDF={downloadPDF}
              onDownloadXML={downloadXML}
            />
          </>
        )}

        {/* Modals */}
        {showForm && (
          <InvoiceForm
            companies={companies}
            customers={customers}
            invoice={editingInvoice || undefined}
            onSubmit={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}
            onSaveDraft={handleSaveDraft}
            onCancel={() => {
              setShowForm(false)
              setEditingInvoice(null)
            }}
          />
        )}

        {showProductCatalog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">Product Catalog</h2>
                <button
                  onClick={() => setShowProductCatalog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <ProductCatalog onSelectProduct={handleSelectProduct} />
            </div>
          </div>
        )}

        {selectedInvoice && (
          <InvoiceView
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            onEdit={() => {
              setEditingInvoice(selectedInvoice)
              setSelectedInvoice(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
