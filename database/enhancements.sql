-- Add products table for catalog
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    vat_rate DECIMAL(5,2) DEFAULT 7.00,
    category VARCHAR(100),
    sku VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add invoice templates table
CREATE TABLE invoice_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    company_id INTEGER REFERENCES companies(id),
    customer_id INTEGER REFERENCES customers(id),
    items JSON, -- Store template items as JSON
    notes TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add invoice drafts auto-save
ALTER TABLE invoices ADD COLUMN is_draft BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN last_saved TIMESTAMP;

-- Add indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_invoice_templates_company ON invoice_templates(company_id);
CREATE INDEX idx_invoices_draft ON invoices(is_draft);

-- Insert sample products
INSERT INTO products (name, description, unit_price, vat_rate, category, sku) VALUES
('Web Development', 'Frontend/backend development services', 1500.00, 7.00, 'Services', 'WEB-001'),
('UI/UX Design', 'User interface and experience design', 2000.00, 7.00, 'Services', 'UIX-001'),
('SEO Optimization', 'Search engine optimization services', 800.00, 7.00, 'Marketing', 'SEO-001'),
('Content Writing', 'Blog post and website content', 500.00, 7.00, 'Marketing', 'CNT-001'),
('Hosting Setup', 'Web server configuration and setup', 1200.00, 7.00, 'Technical', 'HST-001'),
('Database Design', 'Database architecture and setup', 1800.00, 7.00, 'Technical', 'DBS-001'),
('Mobile App Development', 'iOS/Android app development', 3000.00, 7.00, 'Services', 'MOB-001'),
('Digital Marketing', 'Online marketing campaigns', 1000.00, 7.00, 'Marketing', 'DMK-001'),
('IT Consulting', 'Technical consulting services', 1200.00, 7.00, 'Consulting', 'ITC-001'),
('Training Session', 'Technical training for teams', 800.00, 7.00, 'Training', 'TRN-001');
