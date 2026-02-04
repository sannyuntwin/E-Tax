-- Create database
CREATE DATABASE IF NOT EXISTS etax;

-- Use the database
\c etax;

-- Companies table
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    tax_id VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    certificate_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(20),
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    company_id INTEGER REFERENCES companies(id),
    customer_id INTEGER REFERENCES customers(id),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items table
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Insert sample company data
INSERT INTO companies (tax_id, company_name, address, phone, email) VALUES
('0105551000001', 'Demo Company Co., Ltd.', '123 Sukhumvit Road, Bangkok 10110', '+66 2 123 4567', 'info@demo-company.com'),
('0105551000002', 'Tech Solutions Thailand', '456 Silom Road, Bangkok 10500', '+66 2 234 5678', 'contact@techsolutions.co.th'),
('0105551000003', 'Global Trading Co., Ltd.', '789 Ratchada Road, Bangkok 10400', '+66 2 345 6789', 'sales@globaltrading.com'),
('0105551000004', 'Digital Services Asia', '321 Asoke Road, Bangkok 10110', '+66 2 456 7890', 'hello@digitalservices.asia'),
('0105551000005', 'Innovation Hub Thailand', '654 Sathorn Road, Bangkok 10120', '+66 2 567 8901', 'admin@innovationhub.th');

-- Insert sample customer data
INSERT INTO customers (name, tax_id, email, phone, address) VALUES
('Customer A Co., Ltd.', '0105552000001', 'billing@customer-a.com', '+66 2 987 6543', '456 Silom Road, Bangkok 10500'),
('Customer B', NULL, 'customer.b@email.com', '+66 81 234 5678', '789 Asoke Road, Bangkok 10110'),
('Retail Store Co., Ltd.', '0105552000002', 'accounts@retailstore.com', '+66 2 111 2222', '321 Ratchada Road, Bangkok 10400'),
('Small Business Shop', NULL, 'owner@smallbusiness.com', '+66 82 333 4444', '987 Sukhumvit Road, Bangkok 10110'),
('Restaurant Group Co., Ltd.', '0105552000003', 'finance@restaurantgroup.com', '+66 2 555 6666', '147 Sathorn Road, Bangkok 10120'),
('Freelance Services', NULL, 'freelance@email.com', '+66 89 777 8888', '258 Ploenchit Road, Bangkok 10330'),
('Import Export Ltd.', '0105552000004', 'payment@importexport.com', '+66 2 999 0000', '369 Wireless Road, Bangkok 10330'),
('Local Market Shop', NULL, 'market@localshop.com', '+66 86 111 2222', '741 Sukhumvit Soi 23, Bangkok 10110');

-- Insert sample invoice data
INSERT INTO invoices (invoice_no, issue_date, due_date, company_id, customer_id, subtotal, vat_amount, total_amount, status, notes) VALUES
('INV2024001', '2024-01-15', '2024-02-15', 1, 1, 10000.00, 700.00, 10700.00, 'paid', 'Web development services - January 2024'),
('INV2024002', '2024-01-20', '2024-02-20', 1, 2, 5000.00, 350.00, 5350.00, 'sent', 'Consulting services'),
('INV2024003', '2024-01-25', '2024-02-25', 1, 3, 15000.00, 1050.00, 16050.00, 'draft', 'Software licensing'),
('INV2024004', '2024-02-01', '2024-03-01', 1, 4, 7500.00, 525.00, 8025.00, 'sent', 'Digital marketing campaign'),
('INV2024005', '2024-02-05', '2024-03-05', 1, 5, 20000.00, 1400.00, 21400.00, 'overdue', 'Hardware equipment');

-- Insert sample invoice items
INSERT INTO invoice_items (invoice_id, product_name, description, quantity, unit_price, line_total) VALUES
-- Items for INV2024001
(1, 'Web Development', 'Frontend development services', 40, 250.00, 10000.00),
-- Items for INV2024002
(2, 'Business Consulting', 'Strategic planning consultation', 10, 500.00, 5000.00),
-- Items for INV2024003
(3, 'Software License A', 'Annual license for software A', 1, 10000.00, 10000.00),
(3, 'Software License B', 'Annual license for software B', 1, 5000.00, 5000.00),
-- Items for INV2024004
(4, 'SEO Services', 'Monthly SEO optimization', 1, 5000.00, 5000.00),
(4, 'Content Creation', 'Blog post creation', 5, 500.00, 2500.00),
-- Items for INV2024005
(5, 'Laptop Computer', 'Business laptop - Model X', 2, 8000.00, 16000.00),
(5, 'Monitor', '24-inch LED monitor', 2, 2000.00, 4000.00);
