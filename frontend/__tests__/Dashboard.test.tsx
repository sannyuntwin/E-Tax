import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Dashboard from '../components/Dashboard'

describe('Dashboard', () => {
  it('renders dashboard component', () => {
    render(<Dashboard onCreateInvoice={() => {}} />)
    
    // Check if main dashboard elements are present
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/create invoice/i)).toBeInTheDocument()
  })
})
