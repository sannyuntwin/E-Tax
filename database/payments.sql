-- Add payment reminders table
CREATE TABLE payment_reminders (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL, -- 'due_date', 'overdue', 'custom'
    days_before INTEGER DEFAULT 0, -- days before due date (0 = on due date, negative = overdue)
    is_sent BOOLEAN DEFAULT false,
    scheduled_date DATE NOT NULL,
    sent_date TIMESTAMP,
    email_sent BOOLEAN DEFAULT false,
    sms_sent BOOLEAN DEFAULT false,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add payment tracking table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50), -- 'cash', 'bank_transfer', 'credit_card', 'promptpay', etc.
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add payment status to invoices
ALTER TABLE invoices ADD COLUMN payment_status VARCHAR(20) DEFAULT 'unpaid'; -- 'unpaid', 'partial', 'paid', 'overdue'
ALTER TABLE invoices ADD COLUMN paid_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN payment_date DATE;
ALTER TABLE invoices ADD COLUMN payment_method VARCHAR(50);

-- Create indexes
CREATE INDEX idx_payment_reminders_invoice ON payment_reminders(invoice_id);
CREATE INDEX idx_payment_reminders_scheduled ON payment_reminders(scheduled_date);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);

-- Insert sample payment reminders
INSERT INTO payment_reminders (invoice_id, reminder_type, days_before, scheduled_date, message) VALUES
-- Due date reminders for sample invoices
(1, 'due_date', 3, '2024-02-12', 'Friendly reminder: Invoice INV2024001 is due in 3 days'),
(1, 'due_date', 0, '2024-02-15', 'Invoice INV2024001 is due today'),
(2, 'due_date', 3, '2024-02-17', 'Friendly reminder: Invoice INV2024002 is due in 3 days'),
(2, 'due_date', 0, '2024-02-20', 'Invoice INV2024002 is due today'),
-- Overdue reminders
(5, 'overdue', -7, '2024-02-12', 'Invoice INV2024005 is 7 days overdue'),
(5, 'overdue', -14, '2024-02-19', 'Invoice INV2024005 is 14 days overdue');

-- Insert sample payments
INSERT INTO payments (invoice_id, amount, payment_date, payment_method, reference_number, notes) VALUES
(1, 10700.00, '2024-02-10', 'bank_transfer', 'BANK123456', 'Full payment received'),
(3, 8025.00, '2024-02-05', 'promptpay', 'PROMPT789', 'Paid via PromptPay'),
(1, 5000.00, '2024-02-08', 'credit_card', 'CC456789', 'Partial payment');
