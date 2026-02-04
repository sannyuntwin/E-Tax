-- Add recurring invoices table
CREATE TABLE recurring_invoices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    company_id INTEGER REFERENCES companies(id),
    customer_id INTEGER REFERENCES customers(id),
    frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    interval_value INTEGER DEFAULT 1, -- e.g., every 2 weeks
    start_date DATE NOT NULL,
    end_date DATE, -- null for ongoing
    next_invoice_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_generated DATE,
    total_generated INTEGER DEFAULT 0,
    template_data JSON, -- Store invoice template data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add recurring invoice reference to regular invoices
ALTER TABLE invoices ADD COLUMN recurring_invoice_id INTEGER REFERENCES recurring_invoices(id);
ALTER TABLE invoices ADD COLUMN is_recurring BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX idx_recurring_invoices_customer ON recurring_invoices(customer_id);
CREATE INDEX idx_recurring_invoices_next_date ON recurring_invoices(next_invoice_date);
CREATE INDEX idx_recurring_invoices_active ON recurring_invoices(is_active);
CREATE INDEX idx_invoices_recurring ON invoices(is_recurring);

-- Insert sample recurring invoice data
INSERT INTO recurring_invoices (name, description, company_id, customer_id, frequency, start_date, next_invoice_date, template_data) VALUES
('Monthly Web Hosting', 'Monthly web hosting service for Customer A', 1, 1, 'monthly', 1, '2024-01-01', '2024-02-01', '{
  "items": [
    {"product_name": "Web Hosting", "description": "Monthly hosting package", "quantity": 1, "unit_price": 500.00},
    {"product_name": "SSL Certificate", "description": "Annual SSL certificate", "quantity": 1, "unit_price": 100.00}
  ],
  "notes": "Monthly recurring invoice for web hosting services"
}'),
('Weekly Consulting', 'Weekly consulting retainer', 1, 2, 'weekly', 1, '2024-01-01', '2024-01-08', '{
  "items": [
    {"product_name": "Business Consulting", "description": "Weekly consulting hours", "quantity": 10, "unit_price": 150.00}
  ],
  "notes": "Weekly retainer for business consulting services"
}'),
('Quarterly Software License', 'Quarterly software maintenance', 1, 3, 'quarterly', 1, '2024-01-01', '2024-04-01', '{
  "items": [
    {"product_name": "Software License A", "description": "Enterprise software license", "quantity": 1, "unit_price": 2000.00},
    {"product_name": "Support Package", "description": "Premium support package", "quantity": 1, "unit_price": 500.00}
  ],
  "notes": "Quarterly software license and support fees"
}');
