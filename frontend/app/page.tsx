'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText, Download, Eye, Trash2, Edit } from 'lucide-react'
import InvoiceForm from '@/components/InvoiceForm'
import InvoiceList from '@/components/InvoiceList'
import InvoiceView from '@/components/InvoiceView'
import { Invoice, Company, Customer } from '@/types'

export default function Home() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [invoicesRes, companiesRes, customersRes] = await Promise.all([
        fetch(`${API_BASE}/api/invoices`),
        fetch(`${API_BASE}/api/companies`),
        fetch(`${API_BASE}/api/customers`)
      ])

      const [invoicesData, companiesData, customersData] = await Promise.all([
        invoicesRes.json(),
        companiesRes.json(),
        customersRes.json()
      ])

      setInvoices(invoicesData)
      setCompanies(companiesData)
      setCustomers(customersData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
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
        setInvoices([...invoices, newInvoice])
        setShowForm(false)
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
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
        fetchData() // Refresh data
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">E-Tax Invoice System</h1>
          <p className="mt-2 text-gray-600">Manage your Thailand e-Tax invoices</p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Invoice
            </button>
          </div>
        </div>

        {showForm && (
          <InvoiceForm
            companies={companies}
            customers={customers}
            onSubmit={handleCreateInvoice}
            onCancel={() => setShowForm(false)}
          />
        )}

        {editingInvoice && (
          <InvoiceForm
            companies={companies}
            customers={customers}
            invoice={editingInvoice}
            onSubmit={handleUpdateInvoice}
            onCancel={() => setEditingInvoice(null)}
          />
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

        <InvoiceList
          invoices={invoices}
          onView={setSelectedInvoice}
          onEdit={setEditingInvoice}
          onDelete={handleDeleteInvoice}
          onDownloadPDF={downloadPDF}
          onDownloadXML={downloadXML}
        />
      </div>
    </div>
  )
}
