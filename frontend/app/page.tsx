'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, FileText, Download, Eye, Trash2, Edit, BarChart3, HelpCircle, RefreshCw, 
  Building2, Users, Package, CreditCard, Bell, Settings, Shield, Activity,
  Globe, ShoppingCart, Database, TrendingUp, Lock, UserCheck, Server,
  ChevronDown, Menu, X, ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

// Import all the new components
import AdminUserManagement from '@/components/AdminUserManagement'
import AdminAuditLogs from '@/components/AdminAuditLogs'
import AdminSecuritySettings from '@/components/AdminSecuritySettings'
import AdminLoginAttempts from '@/components/AdminLoginAttempts'
import AdminSystemStats from '@/components/AdminSystemStats'
import AdminCompanyApproval from '@/components/AdminCompanyApproval'
import POSVendorManagement from '@/components/POSVendorManagement'
import MarketplaceIntegrationManager from '@/components/MarketplaceIntegrationManager'
import ProductCatalogManagement from '@/components/ProductCatalogManagement'
import SystemHealthMonitor from '@/components/SystemHealthMonitor'
import APIUsageDashboard from '@/components/APIUsageDashboard'

// Import existing components
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
import AuthWrapper from '@/components/AuthWrapper'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Invoice, Company, Customer, SearchFilters, Product, InvoiceTemplate, RecurringInvoice } from '@/types'
import apiClient from '@/utils/api'

interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  role: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

type ViewType = 
  | 'dashboard' 
  | 'invoices' 
  | 'admin-users'
  | 'admin-audit-logs'
  | 'admin-security'
  | 'admin-login-attempts'
  | 'admin-system-stats'
  | 'admin-companies'
  | 'pos-vendors'
  | 'marketplace-integrations'
  | 'product-catalog'
  | 'invoice-templates'
  | 'recurring-invoices'
  | 'system-health'
  | 'api-usage'

interface NavigationItem {
  id: ViewType
  label: string
  icon: React.ComponentType<{ className?: string }>
  category: string
  adminOnly?: boolean
}

const navigationItems: NavigationItem[] = [
  // Main Navigation
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, category: 'main' },
  { id: 'invoices', label: 'Invoices', icon: FileText, category: 'main' },
  
  // Product & Template Management
  { id: 'product-catalog', label: 'Product Catalog', icon: Package, category: 'products' },
  { id: 'invoice-templates', label: 'Invoice Templates', icon: FileText, category: 'products' },
  { id: 'recurring-invoices', label: 'Recurring Invoices', icon: RefreshCw, category: 'products' },
  
  // Admin Tools
  { id: 'admin-users', label: 'User Management', icon: Users, category: 'admin', adminOnly: true },
  { id: 'admin-companies', label: 'Company Approval', icon: Building2, category: 'admin', adminOnly: true },
  { id: 'admin-audit-logs', label: 'Audit Logs', icon: Activity, category: 'admin', adminOnly: true },
  { id: 'admin-security', label: 'Security Settings', icon: Shield, category: 'admin', adminOnly: true },
  { id: 'admin-login-attempts', label: 'Login Attempts', icon: Lock, category: 'admin', adminOnly: true },
  { id: 'admin-system-stats', label: 'System Statistics', icon: TrendingUp, category: 'admin', adminOnly: true },
  
  // Integrations & APIs
  { id: 'pos-vendors', label: 'POS Vendors', icon: ShoppingCart, category: 'integrations', adminOnly: true },
  { id: 'marketplace-integrations', label: 'Marketplace Integrations', icon: Globe, category: 'integrations', adminOnly: true },
  { id: 'api-usage', label: 'API Usage', icon: Database, category: 'integrations', adminOnly: true },
  
  // System Monitoring
  { id: 'system-health', label: 'System Health', icon: Server, category: 'monitoring', adminOnly: true },
]

function AppContent({ user }: { user: User }) {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showProductCatalog, setShowProductCatalog] = useState(false)
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [showRecurringDashboard, setShowRecurringDashboard] = useState(false)
  const [showRecurringForm, setShowRecurringForm] = useState(false)
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(undefined)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>(undefined)
  const [editingRecurring, setEditingRecurring] = useState<RecurringInvoice | undefined>(undefined)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user')

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  // Set user role based on authenticated user
  useEffect(() => {
    if (user) {
      setUserRole(user.role as 'user' | 'admin')
    }
  }, [user])

  // Keyboard shortcuts for back navigation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (showProductCatalog || showTemplateManager || showRecurringDashboard || showRecurringForm)) {
        setShowProductCatalog(false)
        setShowTemplateManager(false)
        setShowRecurringDashboard(false)
        setShowRecurringForm(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showProductCatalog, showTemplateManager, showRecurringDashboard, showRecurringForm])

  const confirmAction = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      toast((t) => (
        <div className="flex items-center space-x-4">
          <span className="text-base font-medium">{message}</span>
          <button
            onClick={() => {
              toast.dismiss(t.id)
              resolve(true)
            }}
            className="btn btn-sm btn-danger"
          >
            Yes
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id)
              resolve(false)
            }}
            className="btn btn-sm btn-secondary"
          >
            No
          </button>
        </div>
      ), {
        duration: 0,
        position: 'top-center',
      })
    })
  }

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    if (user && currentView === 'invoices') {
      fetchInvoices()
    }
  }, [user, currentView, filters])

  useEffect(() => {
    if (user && showRecurringDashboard) {
      fetchRecurringInvoices()
    }
  }, [user, showRecurringDashboard])

  const fetchRecurringInvoices = async () => {
    try {
      const response = await apiClient.get('/api/recurring-invoices')
      
      if (response.status === 404) {
        // Endpoint not implemented - set empty array
        setRecurringInvoices([])
      } else if (response.ok) {
        const data = await response.json()
        setRecurringInvoices(data)
      }
    } catch (error) {
      console.error('Error fetching recurring invoices:', error)
      setRecurringInvoices([])
    }
  }

  const handleCreateRecurringInvoice = async (recurringData: any) => {
    try {
      const response = await apiClient.post('/api/recurring-invoices', JSON.stringify(recurringData))
      
      if (response.status === 404) {
        toast.error('Recurring invoices feature not available')
      } else if (response.ok) {
        const newRecurring = await response.json()
        setRecurringInvoices([...recurringInvoices, newRecurring])
        setShowRecurringForm(false)
        setEditingRecurring(undefined)
        toast.success('Recurring invoice created successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create recurring invoice')
      }
    } catch (error) {
      console.error('Error creating recurring invoice:', error)
      toast.error('Failed to create recurring invoice')
    }
  }

  const handleUpdateRecurringInvoice = async (recurringData: any) => {
    if (!editingRecurring) return

    try {
      const response = await apiClient.put(`/api/recurring-invoices/${editingRecurring.id}`, JSON.stringify(recurringData))
      
      if (response.status === 404) {
        toast.error('Recurring invoices feature not available')
      } else if (response.ok) {
        const updatedRecurring = await response.json()
        setRecurringInvoices(recurringInvoices.map(inv => inv.id === updatedRecurring.id ? updatedRecurring : inv))
        setEditingRecurring(undefined)
        setShowRecurringForm(false)
        fetchRecurringInvoices()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update recurring invoice')
      }
    } catch (error) {
      console.error('Error updating recurring invoice:', error)
      toast.error('Failed to update recurring invoice')
    }
  }

  const handleDeleteRecurringInvoice = async (id: number) => {
    if (await confirmAction('Are you sure you want to delete this recurring invoice? This will stop all future invoice generation.')) {
      try {
        const response = await fetch(`${API_BASE}/api/recurring-invoices/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setRecurringInvoices(recurringInvoices.filter(inv => inv.id !== id))
          toast.success('Recurring invoice deleted successfully')
        } else {
          toast.error('Failed to delete recurring invoice')
        }
      } catch (error) {
        console.error('Error deleting recurring invoice:', error)
        toast.error('Error deleting recurring invoice')
      }
    }
  }

  const handleGenerateInvoice = async (id: number) => {
    if (await confirmAction('Generate next invoice from this recurring schedule?')) {
      try {
        const response = await fetch(`${API_BASE}/api/recurring-invoices/${id}/generate`, {
          method: 'POST',
        })

        if (response.ok) {
          const invoice = await response.json()
          console.log('Generated invoice:', invoice)
          fetchInvoices()
          fetchRecurringInvoices()
          toast.success('Invoice generated successfully')
        } else {
          toast.error('Failed to generate invoice')
        }
      } catch (error) {
        console.error('Error generating invoice:', error)
        toast.error('Error generating invoice')
      }
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
        apiClient.get('/api/companies'),
        apiClient.get('/api/customers')
      ])

      if (companiesRes.ok && customersRes.ok) {
        const [companiesData, customersData] = await Promise.all([
          companiesRes.json(),
          customersRes.json()
        ])
        setCompanies(companiesData)
        setCustomers(customersData)
      } else {
        // Mock data for demo
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
      // Mock data for demo
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

      const endpoint = params.toString() 
        ? `/api/invoices/search?${params}`
        : `/api/invoices`

      const response = await apiClient.get(endpoint)
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      } else {
        // Mock data for demo
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
    } catch (error) {
      console.error('Error fetching invoices:', error)
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
      const response = await apiClient.post('/api/invoices', invoiceData)

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
        setEditingInvoice(undefined)
        fetchInvoices()
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
    }
  }

  const handleDeleteInvoice = async (id: number) => {
    if (await confirmAction('Are you sure you want to delete this invoice?')) {
      try {
        const response = await fetch(`${API_BASE}/api/invoices/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setInvoices(invoices.filter(inv => inv.id !== id))
          toast.success('Invoice deleted successfully')
        } else {
          toast.error('Failed to delete invoice')
        }
      } catch (error) {
        console.error('Error deleting invoice:', error)
        toast.error('Error deleting invoice')
      }
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

  const exportData = () => {
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

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onCreateInvoice={() => setShowForm(true)} user={user} />
      
      case 'invoices':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="h2">Invoices</h2>
              <div className="flex items-center space-x-3">
                <SearchAndFilter 
                  filters={filters} 
                  onFiltersChange={setFilters}
                  customers={customers}
                />
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors w-auto min-w-[140px]"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Invoice
                </button>
              </div>
            </div>
            <InvoiceList
              invoices={invoices}
              onEdit={setEditingInvoice}
              onDelete={handleDeleteInvoice}
              onView={setSelectedInvoice}
              onDownloadPDF={downloadPDF}
              onDownloadXML={downloadXML}
            />
          </div>
        )
      
      case 'admin-users':
        return <AdminUserManagement />
      
      case 'admin-audit-logs':
        return <AdminAuditLogs />
      
      case 'admin-security':
        return <AdminSecuritySettings />
      
      case 'admin-login-attempts':
        return <AdminLoginAttempts />
      
      case 'admin-system-stats':
        return <AdminSystemStats />
      
      case 'admin-companies':
        return <AdminCompanyApproval user={user} />
      
      case 'pos-vendors':
        return <POSVendorManagement />
      
      case 'marketplace-integrations':
        return <MarketplaceIntegrationManager />
      
      case 'product-catalog':
        return <ProductCatalog />
      
      case 'invoice-templates':
        return <InvoiceTemplateManager />
      
      case 'recurring-invoices':
        return <RecurringInvoicesDashboard onCreateRecurring={() => setShowRecurringForm(true)} />
      
      case 'system-health':
        return <SystemHealthMonitor />
      
      case 'api-usage':
        return <APIUsageDashboard />
      
      default:
        return <Dashboard onCreateInvoice={() => setShowForm(true)} user={user} />
    }
  }

  const filteredNavigationItems = navigationItems.filter(item => 
    !item.adminOnly || userRole === 'admin'
  )

  const groupedNavigation = filteredNavigationItems.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = []
    }
    groups[item.category].push(item)
    return groups
  }, {} as Record<string, NavigationItem[]>)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="loading-text">Loading E-Tax System...</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h1 className="h1 text-blue-600">E-Tax</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            {Object.entries(groupedNavigation).map(([category, items]) => (
              <div key={category}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === 'product-catalog') {
                            setCurrentView('product-catalog')
                            setSidebarOpen(false)
                          } else if (item.id === 'invoice-templates') {
                            setCurrentView('invoice-templates')
                            setSidebarOpen(false)
                          } else if (item.id === 'recurring-invoices') {
                            setCurrentView('recurring-invoices')
                            setSidebarOpen(false)
                          } else {
                            setCurrentView(item.id)
                            setSidebarOpen(false)
                          }
                        }}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          currentView === item.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-md hover:bg-gray-100 mr-4"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  
                  {/* Back button for non-main views */}
                  {currentView !== 'dashboard' && currentView !== 'invoices' && currentView !== 'product-catalog' && currentView !== 'invoice-templates' && currentView !== 'recurring-invoices' && (
                    <button
                      onClick={() => setCurrentView('dashboard')}
                      className="p-2 rounded-md hover:bg-gray-100 mr-4 flex items-center text-gray-600 hover:text-gray-900"
                      title="Back to Dashboard"
                    >
                      <ArrowLeft className="h-5 w-5 mr-1" />
                      Back
                    </button>
                  )}
                  
                  <h2 className="text-xl font-semibold text-gray-900">
                    {navigationItems.find(item => item.id === currentView)?.label || 'Dashboard'}
                  </h2>
                </div>
                
                <div className="flex items-center space-x-4">
                  <DarkModeToggle />
                  <KeyboardShortcuts
                    onCreateInvoice={() => {
                      setShowForm(true)
                      setCurrentView('invoices')
                    }}
                    onSaveDraft={() => {
                      if (showForm) {
                        const form = document.querySelector('form') as HTMLFormElement
                        if (form) {
                          const formData = new FormData(form)
                          console.log('Saving draft...', Object.fromEntries(formData))
                        }
                      }
                    }}
                    onSearch={focusSearch}
                    onToggleDarkMode={toggleDarkMode}
                    onExportData={exportData}
                  />
                  <button
                    className="btn btn-sm btn-ghost"
                    title="Help"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {renderCurrentView()}
            </div>
          </main>
        </div>

        {/* Modals */}
        {showForm && (
          <InvoiceForm
            companies={companies}
            customers={customers}
            invoice={editingInvoice}
            onSubmit={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}
            onSaveDraft={handleSaveDraft}
            onCancel={() => {
              setShowForm(false)
              setEditingInvoice(undefined)
            }}
          />
        )}

        {selectedInvoice && (
          <InvoiceView
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(undefined)}
            onEdit={() => {
              setEditingInvoice(selectedInvoice)
              setSelectedInvoice(undefined)
            }}
          />
        )}

        {showRecurringForm && (
          <RecurringInvoiceForm
            companies={companies}
            customers={customers}
            recurringInvoice={editingRecurring}
            onSubmit={editingRecurring ? handleUpdateRecurringInvoice : handleCreateRecurringInvoice}
            onCancel={() => {
              setShowRecurringForm(false)
              setEditingRecurring(undefined)
            }}
          />
        )}
      </div>
    </ThemeProvider>
  )
}

export default function Home() {
  return (
    <AuthWrapper>
      {(user) => <AppContent user={user} />}
    </AuthWrapper>
  )
}
