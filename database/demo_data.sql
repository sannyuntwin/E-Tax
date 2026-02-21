-- Demo Data for E-Tax System
-- This script populates the database with sample data for demonstration purposes

-- Insert sample companies
INSERT INTO companies (id, tax_id, company_name, address, phone, email, certificate_path, created_at, updated_at) VALUES
(1, '1234567890123', 'Demo Company Ltd.', '123 Demo Street, Bangkok, Thailand', '+66 2 123 4567', 'info@democompany.com', '/certs/demo_cert.pem', NOW(), NOW()),
(2, '9876543210987', 'Sample Business Co.', '456 Sample Road, Chiang Mai, Thailand', '+66 5 987 6543', 'contact@samplebusiness.com', '/certs/sample_cert.pem', NOW(), NOW());

-- Insert sample customers
INSERT INTO customers (id, name, tax_id, email, phone, address, created_at, updated_at) VALUES
(1, 'Demo Customer A', '1111111111111', 'customerA@demo.com', '+66 2 111 1111', '789 Customer Ave, Bangkok', NOW(), NOW()),
(2, 'Demo Customer B', '2222222222222', 'customerB@demo.com', '+66 2 222 2222', '456 Customer Blvd, Chiang Mai', NOW(), NOW()),
(3, 'Demo Customer C', '3333333333333', 'customerC@demo.com', '+66 2 333 3333', '123 Customer St, Phuket', NOW(), NOW());

-- Insert sample products
INSERT INTO products (id, name, description, sku, unit_price, created_at, updated_at) VALUES
(1, 'Professional Services', 'Consulting and professional services', 'PROD-001', 5000.00, NOW(), NOW()),
(2, 'Software License', 'Annual software license subscription', 'PROD-002', 12000.00, NOW(), NOW()),
(3, 'Hardware Equipment', 'Computer hardware and peripherals', 'PROD-003', 15000.00, NOW(), NOW()),
(4, 'Training Services', 'Technical training and workshops', 'PROD-004', 8000.00, NOW(), NOW()),
(5, 'Maintenance Contract', 'Annual maintenance and support', 'PROD-005', 24000.00, NOW(), NOW());

-- Insert sample invoices
INSERT INTO invoices (id, invoice_no, issue_date, due_date, company_id, customer_id, subtotal, vat_amount, total_amount, status, notes, is_draft, created_at, updated_at) VALUES
(1, 'DEM-2024-001', '2024-01-15', '2024-02-15', 1, 1, 10000.00, 700.00, 10700.00, 'sent', 'Demo invoice for professional services', false, NOW(), NOW()),
(2, 'DEM-2024-002', '2024-01-20', '2024-02-20', 1, 2, 12000.00, 840.00, 12840.00, 'paid', 'Software license invoice', false, NOW(), NOW()),
(3, 'DEM-2024-003', '2024-01-25', '2024-02-25', 2, 3, 15000.00, 1050.00, 16050.00, 'draft', 'Hardware equipment quotation', true, NOW(), NOW()),
(4, 'DEM-2024-004', '2024-02-01', '2024-03-01', 2, 1, 8000.00, 560.00, 8560.00, 'sent', 'Training services invoice', false, NOW(), NOW()),
(5, 'DEM-2024-005', '2024-02-10', '2024-03-10', 1, 2, 24000.00, 1680.00, 25680.00, 'overdue', 'Maintenance contract - overdue', false, NOW(), NOW());

-- Insert sample invoice items
INSERT INTO invoice_items (id, invoice_id, product_name, description, quantity, unit_price, line_total, created_at, updated_at) VALUES
(1, 1, 'Professional Services', 'Business consulting services - 40 hours', 1, 5000.00, 5000.00, NOW(), NOW()),
(2, 1, 'Professional Services', 'Technical consulting services - 20 hours', 1, 5000.00, 5000.00, NOW(), NOW()),
(3, 2, 'Software License', 'Annual enterprise software license', 1, 12000.00, 12000.00, NOW(), NOW()),
(4, 3, 'Hardware Equipment', 'Laptop computer with accessories', 1, 15000.00, 15000.00, NOW(), NOW()),
(5, 4, 'Training Services', 'On-site technical training - 2 days', 1, 8000.00, 8000.00, NOW(), NOW()),
(6, 5, 'Maintenance Contract', 'Annual maintenance and support contract', 1, 24000.00, 24000.00, NOW(), NOW());

-- Insert sample users for demo
INSERT INTO users (id, username, email, password, role, is_active, created_at, updated_at) VALUES
(1, 'demo_admin', 'admin@etax-demo.com', '$2a$10$hashed_password_for_demo', 'admin', true, NOW(), NOW()),
(2, 'demo_user', 'user@etax-demo.com', '$2a$10$hashed_password_for_demo', 'user', true, NOW(), NOW()),
(3, 'demo_accountant', 'accountant@etax-demo.com', '$2a$10$hashed_password_for_demo', 'accountant', true, NOW(), NOW());

-- Insert sample recurring invoices
INSERT INTO recurring_invoices (id, company_id, customer_id, invoice_no_prefix, frequency, day_of_month, start_date, end_date, next_invoice_date, is_active, created_at, updated_at) VALUES
(1, 1, 1, 'REC-MONTHLY', 'monthly', 1, '2024-01-01', '2024-12-31', '2024-02-01', true, NOW(), NOW()),
(2, 2, 2, 'REC-QUARTERLY', 'quarterly', 15, '2024-01-01', '2024-12-31', '2024-04-15', true, NOW(), NOW());

-- Insert sample payments
INSERT INTO payments (id, invoice_id, amount, payment_date, payment_method, status, created_at, updated_at) VALUES
(1, 2, 12840.00, '2024-02-20', 'bank_transfer', 'completed', NOW(), NOW()),
(2, 5, 25680.00, '2024-03-05', 'credit_card', 'completed', NOW(), NOW());

-- Insert sample payment reminders
INSERT INTO payment_reminders (id, invoice_id, reminder_date, reminder_type, status, created_at, updated_at) VALUES
(1, 4, '2024-02-28', 'email', 'sent', NOW(), NOW()),
(2, 5, '2024-03-15', 'sms', 'pending', NOW(), NOW());

-- Insert sample audit logs
INSERT INTO audit_logs (id, user_id, action, resource, details, ip_address, user_agent, created_at) VALUES
(1, 1, 'login', 'auth', 'User logged in successfully', '127.0.0.1', 'Mozilla/5.0 (Demo Browser)', NOW()),
(2, 2, 'create_invoice', 'invoice', 'Created new invoice DEM-2024-002', '127.0.0.1', 'Mozilla/5.0 (Demo Browser)', NOW()),
(3, 1, 'view_invoice', 'invoice', 'Viewed invoice DEM-2024-001', '127.0.0.1', 'Mozilla/5.0 (Demo Browser)', NOW());
