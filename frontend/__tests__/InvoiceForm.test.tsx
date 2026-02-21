import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import InvoiceForm from '../components/InvoiceForm'
import { Company, Customer, Invoice } from '../types'

// Mock data
const mockCompanies: Company[] = [
  { 
    id: 1, 
    tax_id: '123456789',
    company_name: 'Test Company', 
    address: '123 Test St', 
    phone: '123-456-7890',
    email: 'test@company.com',
    certificate_path: '/path/to/cert',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockCustomers: Customer[] = [
  { 
    id: 1, 
    name: 'Test Customer', 
    email: 'test@example.com', 
    phone: '123-456-7890',
    address: '123 Customer St',
    tax_id: '987654321',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockOnSubmit = jest.fn()
const mockOnCancel = jest.fn()
const mockOnSaveDraft = jest.fn()

describe('InvoiceForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders invoice form with basic fields', () => {
    render(
      <InvoiceForm
        companies={mockCompanies}
        customers={mockCustomers}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByLabelText(/invoice number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/issue date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/customer/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
  })

  it('populates form with invoice data when editing', () => {
    const mockInvoice: Invoice = {
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
      notes: 'Test notes',
      items: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    render(
      <InvoiceForm
        companies={mockCompanies}
        customers={mockCustomers}
        invoice={mockInvoice}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByDisplayValue('INV-001')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument()
  })

  it('calls onSubmit when form is submitted', async () => {
    render(
      <InvoiceForm
        companies={mockCompanies}
        customers={mockCustomers}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/invoice number/i), {
      target: { value: 'INV-002' }
    })
    fireEvent.change(screen.getByLabelText(/due date/i), {
      target: { value: '2024-02-01' }
    })

    // Submit form
    fireEvent.click(screen.getByText(/create invoice/i))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          invoice_no: 'INV-002',
          due_date: '2024-02-01'
        })
      )
    })
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <InvoiceForm
        companies={mockCompanies}
        customers={mockCustomers}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    fireEvent.click(screen.getByText(/cancel/i))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('adds and removes invoice items', () => {
    render(
      <InvoiceForm
        companies={mockCompanies}
        customers={mockCustomers}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Initially should have one item row
    expect(screen.getAllByPlaceholderText(/item description/i)).toHaveLength(1)

    // Add new item
    fireEvent.click(screen.getByText(/add item/i))
    expect(screen.getAllByPlaceholderText(/item description/i)).toHaveLength(2)

    // Remove item
    const removeButtons = screen.getAllByLabelText(/remove item/i)
    fireEvent.click(removeButtons[0])
    expect(screen.getAllByPlaceholderText(/item description/i)).toHaveLength(1)
  })
})
