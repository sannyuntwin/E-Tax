'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText, Download, Eye, Trash2, Edit, BarChart3, HelpCircle, RefreshCw } from 'lucide-react'
import InvoiceForm from '@/components/InvoiceForm'
import InvoiceList from '@/components/InvoiceList'
import InvoiceView from '@/components/InvoiceView'
import Dashboard from '@/components/Dashboard'
import SearchAndFilter from '@/components/SearchAndFilter'
import ProductCatalog from '@/components/ProductCatalog'
import InvoiceTemplateManager from '@/components/InvoiceTemplateManager'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import DarkModeToggle from '@/components/DarkModeToggle'
import RecurringInvoicesDashboard from '@/components/RecurringInvoicesDashboard'
import RecurringInvoiceForm from '@/components/RecurringInvoiceForm'
import RecurringInvoicesList from '@/components/RecurringInvoicesList'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Invoice, Company, Customer, SearchFilters, Product, InvoiceTemplate, RecurringInvoice } from '@/types'

function AppContent() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'invoices'>('dashboard')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showProductCatalog, setShowProductCatalog] = useState(false)
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [showRecurringDashboard, setShowRecurringDashboard] = useState(false)
  const [showRecurringForm, setShowRecurringForm] = useState(false)
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [editingRecurring, setEditingRecurring] = useState<RecurringInvoice | null>(null)
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

  useEffect(() => {
    if (showRecurringDashboard) {
      fetchRecurringInvoices()
    }
  }, [showRecurringDashboard])

  const fetchRecurringInvoices = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/recurring-invoices`)
      if (response.ok) {
        const data = await response.json()
        setRecurringInvoices(data)
      }
    } catch (error) {
      console.error('Error fetching recurring invoices:', error)
    }
  }

  const handleCreateRecurringInvoice = async (recurringData: any) => {
    try {
      const response = await fetch(`${API_BASE}/api/recurring-invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recurringData),
      })

      if (response.ok) {
        const newRecurring = await response.json()
        setShowRecurringForm(false)
        setShowRecurringDashboard(true)
        fetchRecurringInvoices()
      }
    } catch (error) {
      console.error('Error creating recurring invoice:', error)
    }
  }

  const handleUpdateRecurringInvoice = async (recurringData: any) => {
    if (!editingRecurring) return

    try {
      const response = await fetch(`${API_BASE}/api/recurring-invoices/${editingRecurring.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recurringData),
      })

      if (response.ok) {
        const updatedRecurring = await response.json()
        setRecurringInvoices(recurringInvoices.map(inv => inv.id === updatedRecurring.id ? updatedRecurring : inv))
        setEditingRecurring(null)
        setShowRecurringForm(false)
        fetchRecurringInvoices()
      }
    } catch (error) {
      console.error('Error updating recurring invoice:', error)
    }
  }

  const handleDeleteRecurringInvoice = async (id: number) => {
    if (!confirm('Are you sure you want to delete this recurring invoice? This will stop all future invoice generation.')) return

    try {
      const response = await fetch(`${API_BASE}/api/recurring-invoices/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setRecurringInvoices(recurringInvoices.filter(inv => inv.id !== id))
      }
    } catch (error) {
      console.error('Error deleting recurring invoice:', error)
    }
  }

  const handleGenerateInvoice = async (id: number) => {
    if (!confirm('Generate next invoice from this recurring schedule?')) return

    try {
      const response = await fetch(`${API_BASE}/api/recurring-invoices/${id}/generate`, {
        method: 'POST',
      })

      if (response.ok) {
        const invoice = await response.json()
        console.log('Generated invoice:', invoice)
        fetchInvoices()
        fetchRecurringInvoices()
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
    }
  }

  const handlePauseRecurringInvoice = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/recurring-invoices/${id}/pause`, {
        method: 'POST',
      })

      if (response.ok) {
        setRecurringInvoices(recurringInvoices.map(inv => inv.id === id ? { ...inv, is_active: false } : inv))
      }
    } catch (error) {
      console.error('Error pausing recurring invoice:', error)
    }
  }

  const handleResumeRecurringInvoice = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/recurring-invoices/${id}/resume`, {
        method: 'POST',
      })

      if (response.ok) {
        setRecurringInvoices(recurringInvoices.map(inv => inv.id === id ? { ...inv, is_active: true } : inv))
      }
    } catch (error) {
      console.error('Error resuming recurring invoice:', error)
    }
  }


  const fetchData = async () => {
    try {
      const [companiesRes, customersRes] = await Promise.all([
        fetch(`${API_BASE}/api/companies`),
        fetch(`${API_BASE}/api/customers`)
      ])

      if (companiesRes.ok && customersRes.ok) {
        const [companiesData, customersData] = await Promise.all([
          companiesRes.json(),
          customersRes.json()
        ])
        setCompanies(companiesData)
        setCustomers(customersData)
      } else {
        // Use mock data when API is not available
        setCompanies([
          { id: 1, tax_id: "1234567890123", company_name: "Demo Company Ltd.", address: "123 Demo St, Bangkok", phone: "02-123-4567", email: "info@demo.com", certificate_path: "", created_at: "2024-01-01", updated_at: "2024-01-01" },
          { id: 2, tax_id: "9876543210987", company_name: "Test Corporation", address: "456 Test Ave, Bangkok", phone: "02-987-6543", email: "contact@test.com", certificate_path: "", created_at: "2024-01-01", updated_at: "2024-01-01" }
        ])
        setCustomers([
          { id: 1, name: "Customer A", tax_id: "1111111111111", address: "789 Customer Rd, Bangkok", phone: "02-111-2222", email: "customer@a.com", created_at: "2024-01-01", updated_at: "2024-01-01" },
          { id: 2, name: "Customer B", tax_id: "2222222222222", address: "321 Client St, Bangkok", phone: "02-333-4444", email: "customer@b.com", created_at: "2024-01-01", updated_at: "2024-01-01" }
        ])
        console.warn('API not available - running in demo mode with mock data')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Use mock data when API fails
      setCompanies([
        { id: 1, tax_id: "1234567890123", company_name: "Demo Company Ltd.", address: "123 Demo St, Bangkok", phone: "02-123-4567", email: "info@demo.com", certificate_path: "", created_at: "2024-01-01", updated_at: "2024-01-01" },
        { id: 2, tax_id: "9876543210987", company_name: "Test Corporation", address: "456 Test Ave, Bangkok", phone: "02-987-6543", email: "contact@test.com", certificate_path: "", created_at: "2024-01-01", updated_at: "2024-01-01" }
      ])
      setCustomers([
        { id: 1, name: "Customer A", tax_id: "1111111111111", address: "789 Customer Rd, Bangkok", phone: "02-111-2222", email: "customer@a.com", created_at: "2024-01-01", updated_at: "2024-01-01" },
        { id: 2, name: "Customer B", tax_id: "2222222222222", address: "321 Client St, Bangkok", phone: "02-333-4444", email: "customer@b.com", created_at: "2024-01-01", updated_at: "2024-01-01" }
      ])
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
      } else {
        // Use mock invoice data when API is not available
        setInvoices([
          {
            id: 1,
            invoice_no: "INV-2024-001",
            issue_date: "2024-01-15",
            due_date: "2024-02-15",
            company_id: 1,
            customer_id: 1,
            subtotal: 10000,
            vat_amount: 700,
            total_amount: 10700,
            status: "paid",
            payment_status: "paid",
            paid_amount: 10700,
            payment_date: "2024-01-20",
            created_at: "2024-01-15",
            updated_at: "2024-01-20"
          },
          {
            id: 2,
            invoice_no: "INV-2024-002",
            issue_date: "2024-01-20",
            due_date: "2024-02-20",
            company_id: 1,
            customer_id: 2,
            subtotal: 15000,
            vat_amount: 1050,
            total_amount: 16050,
            status: "sent",
            payment_status: "unpaid",
            created_at: "2024-01-20",
            updated_at: "2024-01-20"
          },
          {
            id: 3,
            invoice_no: "INV-2024-003",
            issue_date: "2024-01-25",
            due_date: "2024-01-25",
            company_id: 2,
            customer_id: 1,
            subtotal: 8000,
            vat_amount: 560,
            total_amount: 8560,
            status: "overdue",
            payment_status: "unpaid",
            created_at: "2024-01-25",
            updated_at: "2024-01-25"
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      // Use mock invoice data when API fails
      setInvoices([
        {
          id: 1,
          invoice_no: "INV-2024-001",
          issue_date: "2024-01-15",
          due_date: "2024-02-15",
          company_id: 1,
          customer_id: 1,
          subtotal: 10000,
          vat_amount: 700,
          total_amount: 10700,
          status: "paid",
          payment_status: "paid",
          paid_amount: 10700,
          payment_date: "2024-01-20",
          created_at: "2024-01-15",
          updated_at: "2024-01-20"
        }
      ])
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
    console.log('Selected product:', product)
    setShowProductCatalog(false)
  }

  const handleSelectTemplate = (template: InvoiceTemplate) => {
    console.log('Selected template:', template)
    // This would load the template data into the form
    setShowTemplateManager(false)
    setShowForm(true)
  }

  const handleSaveAsTemplate = (invoiceData: any, templateName: string) => {
    console.log('Saving as template:', templateName, invoiceData)
    // This would save the current invoice as a template
  }

  const exportData = () => {
    // Export all invoices to CSV/Excel
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Invoice No,Customer,Issue Date,Total Amount,Status\n"
      + invoices.map(inv => 
        `${inv.invoice_no},${inv.customer?.name},${inv.issue_date},${inv.total_amount},${inv.status}`
      ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "invoices_export.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const focusSearch = () => {
    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
    if (searchInput) {
      searchInput.focus()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <KeyboardShortcuts
        onCreateInvoice={() => {
          setShowForm(true)
          setCurrentView('invoices')
        }}
        onSaveDraft={() => {
          if (showForm) {
            // Save current form as draft
            const form = document.querySelector('form') as HTMLFormElement
            if (form) {
              const formData = new FormData(form)
              console.log('Saving draft...', Object.fromEntries(formData))
            }
          }
        }}
        onSearch={focusSearch}
        onToggleDarkMode={() => {}} // Handled by ThemeProvider
        onExportData={exportData}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">E-Tax Invoice System</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your Thailand e-Tax invoices</p>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <button
                onClick={() => alert('Press ? for keyboard shortcuts')}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Keyboard Shortcuts (?)"
              >
                <HelpCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                  className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Product Catalog
                </button>
                <button
                  onClick={() => setShowTemplateManager(true)}
                  className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Templates
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
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Product Catalog</h2>
                <button
                  onClick={() => setShowProductCatalog(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              <ProductCatalog onSelectProduct={handleSelectProduct} />
            </div>
          </div>
        )}

        {showTemplateManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invoice Templates</h2>
                <button
                  onClick={() => setShowTemplateManager(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              <InvoiceTemplateManager
                onSelectTemplate={handleSelectTemplate}
                onSaveAsTemplate={handleSaveAsTemplate}
                companies={companies}
                customers={customers}
              />
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

export default function Home() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
