import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import InvoiceList from '../components/InvoiceList'
import { Invoice } from '../types'

// Mock data
const mockInvoices: Invoice[] = [
  {
    id: 1,
    invoice_no: 'INV-001',
    issue_date: '2024-01-01',
    due_date: '2024-01-15',
    company_id: 1,
    customer_id: 1,
    subtotal: 1000,
    vat_amount: 70,
    total_amount: 1070,
    status: 'draft',
    items: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    invoice_no: 'INV-002',
    issue_date: '2024-01-02',
    due_date: '2024-01-16',
    company_id: 1,
    customer_id: 2,
    subtotal: 2000,
    vat_amount: 140,
    total_amount: 2140,
    status: 'sent',
    items: [],
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
]

const mockOnView = jest.fn()
const mockOnEdit = jest.fn()
const mockOnDelete = jest.fn()
const mockOnDownloadPDF = jest.fn()
const mockOnDownloadXML = jest.fn()

describe('InvoiceList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders list of invoices', () => {
    render(
      <InvoiceList
        invoices={mockInvoices}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDownloadPDF={mockOnDownloadPDF}
        onDownloadXML={mockOnDownloadXML}
      />
    )

    expect(screen.getByText('INV-001')).toBeInTheDocument()
    expect(screen.getByText('INV-002')).toBeInTheDocument()
    expect(screen.getByText('1,070.00')).toBeInTheDocument()
    expect(screen.getByText('2,140.00')).toBeInTheDocument()
  })

  it('shows empty state when no invoices', () => {
    render(
      <InvoiceList
        invoices={[]}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDownloadPDF={mockOnDownloadPDF}
        onDownloadXML={mockOnDownloadXML}
      />
    )

    expect(screen.getByText(/no invoices found/i)).toBeInTheDocument()
  })

  it('calls onView when view button is clicked', () => {
    render(
      <InvoiceList
        invoices={mockInvoices}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDownloadPDF={mockOnDownloadPDF}
        onDownloadXML={mockOnDownloadXML}
      />
    )

    fireEvent.click(screen.getByTitle('View'))
    expect(mockOnView).toHaveBeenCalledWith(mockInvoices[0])
  })

  it('calls onEdit when edit button is clicked', () => {
    render(
      <InvoiceList
        invoices={mockInvoices}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDownloadPDF={mockOnDownloadPDF}
        onDownloadXML={mockOnDownloadXML}
      />
    )

    fireEvent.click(screen.getByTitle('Edit'))
    expect(mockOnEdit).toHaveBeenCalledWith(mockInvoices[0])
  })

  it('calls onDelete when delete button is clicked', () => {
    render(
      <InvoiceList
        invoices={mockInvoices}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDownloadPDF={mockOnDownloadPDF}
        onDownloadXML={mockOnDownloadXML}
      />
    )

    fireEvent.click(screen.getByTitle('Delete'))
    expect(mockOnDelete).toHaveBeenCalledWith(mockInvoices[0].id)
  })

  it('calls onDownloadPDF when download button is clicked', () => {
    render(
      <InvoiceList
        invoices={mockInvoices}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDownloadPDF={mockOnDownloadPDF}
        onDownloadXML={mockOnDownloadXML}
      />
    )

    fireEvent.click(screen.getByTitle('Download PDF'))
    expect(mockOnDownloadPDF).toHaveBeenCalledWith(mockInvoices[0].id, mockInvoices[0].invoice_no)
  })
})
