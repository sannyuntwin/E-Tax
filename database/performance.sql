-- Performance optimization indexes
-- These indexes will significantly improve query performance

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_invoices_status_date 
ON invoices(status, issue_date DESC);

CREATE INDEX CONCURRENTLY idx_invoices_customer_status 
ON invoices(customer_id, payment_status);

CREATE INDEX CONCURRENTLY idx_invoices_payment_status 
ON invoices(payment_status, due_date);

CREATE INDEX CONCURRENTLY idx_invoices_company_date 
ON invoices(company_id, issue_date DESC);

-- Invoice items optimization
CREATE INDEX CONCURRENTLY idx_invoice_items_invoice 
ON invoice_items(invoice_id);

CREATE INDEX CONCURRENTLY idx_invoice_items_product_name 
ON invoice_items(product_name);

-- Payments optimization
CREATE INDEX CONCURRENTLY idx_payments_invoice_date 
ON payments(invoice_id, payment_date DESC);

CREATE INDEX CONCURRENTLY idx_payments_date_amount 
ON payments(payment_date DESC, amount);

-- Recurring invoices optimization
CREATE INDEX CONCURRENTLY idx_recurring_invoices_next_date 
ON recurring_invoices(next_invoice_date, is_active);

CREATE INDEX CONCURRENTLY idx_recurring_invoices_customer 
ON recurring_invoices(customer_id, is_active);

-- Payment reminders optimization
CREATE INDEX CONCURRENTLY idx_payment_reminders_scheduled 
ON payment_reminders(scheduled_date, is_sent);

CREATE INDEX CONCURRENTLY idx_payment_reminders_invoice 
ON payment_reminders(invoice_id, reminder_type);

-- Full-text search indexes (PostgreSQL)
CREATE INDEX CONCURRENTLY idx_invoices_search 
ON invoices USING gin(to_tsvector('english', invoice_no || ' ' || COALESCE(notes, '')));

CREATE INDEX CONCURRENTLY idx_customers_search 
ON customers USING gin(to_tsvector('english', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')));

CREATE INDEX CONCURRENTLY idx_invoice_items_search 
ON invoice_items USING gin(to_tsvector('english', product_name || ' ' || COALESCE(description, '')));

-- Partial indexes for better performance
CREATE INDEX CONCURRENTLY idx_invoices_active 
ON invoices(issue_date DESC) WHERE status IN ('sent', 'paid');

CREATE INDEX CONCURRENTLY idx_invoices_overdue 
ON invoices(due_date) WHERE payment_status IN ('unpaid', 'partial') AND due_date < CURRENT_DATE;

-- Covering indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_invoices_cover 
ON invoices(status, payment_status, issue_date DESC, customer_id);

CREATE INDEX CONCURRENTLY idx_payments_cover 
ON payments(invoice_id, payment_date, amount);

-- Statistics updates for better query planning
ANALYZE invoices;
ANALYZE customers;
ANALYZE invoice_items;
ANALYZE payments;
ANALYZE recurring_invoices;
ANALYZE payment_reminders;
