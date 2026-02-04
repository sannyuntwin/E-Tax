-- Monetization database schema
-- Create tables for subscription management, billing, and white-label features

-- Subscription plans
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    billing_cycle VARCHAR(10) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    features JSONB,
    max_invoices INTEGER NOT NULL DEFAULT 100,
    max_users INTEGER NOT NULL DEFAULT 5,
    max_api_keys INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company subscriptions
CREATE TABLE company_subscriptions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    subscription_plan_id INTEGER REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'cancelled', 'expired')),
    trial_ends_at TIMESTAMP,
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    next_billing_date TIMESTAMP NOT NULL,
    cancelled_at TIMESTAMP,
    cancel_reason TEXT,
    auto_renew BOOLEAN DEFAULT true,
    usage_stats JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API usage tracking
CREATE TABLE api_usage (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    api_key_id INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time INTEGER,
    request_size INTEGER DEFAULT 0,
    response_size INTEGER DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing invoices
CREATE TABLE billing_invoices (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES company_subscriptions(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    issued_at TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    paid_at TIMESTAMP,
    payment_method VARCHAR(50),
    payment_ref VARCHAR(100),
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    usage_summary JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage quotas and limits
CREATE TABLE usage_quotas (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL,
    limit_value INTEGER NOT NULL,
    used_value INTEGER DEFAULT 0,
    reset_period VARCHAR(10) DEFAULT 'monthly' CHECK (reset_period IN ('daily', 'weekly', 'monthly')),
    last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_over_limit BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- White-label configurations
CREATE TABLE white_label_configs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    brand_name VARCHAR(100),
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3b82f6',
    secondary_color VARCHAR(7) DEFAULT '#64748b',
    accent_color VARCHAR(7) DEFAULT '#10b981',
    background_color VARCHAR(7) DEFAULT '#f9fafb',
    font_family VARCHAR(50) DEFAULT 'Inter, sans-serif',
    custom_css TEXT,
    custom_domain VARCHAR(255),
    is_enabled BOOLEAN DEFAULT false,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace integrations
CREATE TABLE marketplace_integrations (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    store_url TEXT,
    api_key TEXT,
    api_secret TEXT,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    config JSONB,
    sync_status VARCHAR(20) DEFAULT 'disabled',
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- POS vendor configurations
CREATE TABLE pos_vendor_configs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    vendor_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website TEXT,
    is_active BOOLEAN DEFAULT false,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    max_invoices INTEGER DEFAULT 100,
    features JSONB,
    api_access BOOLEAN DEFAULT false,
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_sort ON subscription_plans(sort_order);
CREATE INDEX idx_company_subscriptions_company ON company_subscriptions(company_id);
CREATE INDEX idx_company_subscriptions_status ON company_subscriptions(status);
CREATE INDEX idx_company_subscriptions_next_billing ON company_subscriptions(next_billing_date);

CREATE INDEX idx_api_usage_company ON api_usage(company_id);
CREATE INDEX idx_api_usage_timestamp ON api_usage(timestamp);
CREATE INDEX idx_api_usage_company_timestamp ON api_usage(company_id, timestamp);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);

CREATE INDEX idx_billing_invoices_company ON billing_invoices(company_id);
CREATE INDEX idx_billing_invoices_status ON billing_invoices(status);
CREATE INDEX idx_billing_invoices_period ON billing_invoices(period_start, period_end);

CREATE INDEX idx_usage_quotas_company ON usage_quotas(company_id);
CREATE INDEX idx_usage_quotas_resource ON usage_quotas(resource_type);
CREATE INDEX idx_usage_quotas_over_limit ON usage_quotas(is_over_limit);

CREATE INDEX idx_white_label_configs_company ON white_label_configs(company_id);
CREATE INDEX idx_white_label_configs_enabled ON white_label_configs(is_enabled);

CREATE INDEX idx_payment_methods_company ON payment_methods(company_id);
CREATE INDEX idx_payment_methods_active ON payment_methods(is_active);

CREATE INDEX idx_marketplace_integrations_company ON marketplace_integrations(company_id);
CREATE INDEX idx_marketplace_integrations_platform ON marketplace_integrations(platform);
CREATE INDEX idx_marketplace_integrations_active ON marketplace_integrations(is_active);

CREATE INDEX idx_pos_vendor_configs_company ON pos_vendor_configs(company_id);
CREATE INDEX idx_pos_vendor_configs_active ON pos_vendor_configs(is_active);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, billing_cycle, features, max_invoices, max_users, max_api_keys, sort_order) VALUES
('Free', 'Perfect for small businesses getting started', 0.00, 'monthly', '["basic_invoicing", "5_invoices_per_month", "1_user", "email_support"]', 5, 1, 0, 1),
('Starter', 'Great for growing businesses', 299.00, 'monthly', '["unlimited_invoices", "50_invoices_per_month", "3_users", "email_support", "basic_reports"]', 50, 3, 5, 2),
('Professional', 'For established businesses', 799.00, 'monthly', '["unlimited_invoices", "200_invoices_per_month", "10_users", "email_support", "priority_support", "advanced_reports", "api_access"]', 200, 10, 20, 3),
('Enterprise', 'For large organizations', 1999.00, 'monthly', '["unlimited_invoices", "unlimited_invoices_per_month", "unlimited_users", "24/7_support", "advanced_reports", "api_access", "white_label", "dedicated_account_manager"]', 999999, 999, 100, 4),
('Free Yearly', 'Free plan with annual billing', 0.00, 'yearly', '["basic_invoicing", "5_invoices_per_month", "1_user", "email_support"]', 5, 1, 0, 5),
('Starter Yearly', 'Starter plan with annual billing', 2990.00, 'yearly', '["unlimited_invoices", "50_invoices_per_month", "3_users", "email_support", "basic_reports"]', 50, 3, 5, 2),
('Professional Yearly', 'Professional plan with annual billing', 7990.00, 'yearly', '["unlimited_invoices", "200_invoices_per_month", "10_users", "email_support", "priority_support", "advanced_reports", "api_access"]', 200, 10, 20, 3),
('Enterprise Yearly', 'Enterprise plan with annual billing', 19990.00, 'yearly', '["unlimited_invoices", "unlimited_invoices_per_month", "unlimited_users", "24/7_support", "advanced_reports", "api_access", "white_label", "dedicated_account_manager"]', 999999, 999, 100, 4);

-- Create function to calculate usage statistics
CREATE OR REPLACE FUNCTION calculate_usage_stats(p_company_id INTEGER, p_start_date DATE, p_end_date DATE)
RETURNS JSONB AS $$
DECLARE
    v_invoice_count INTEGER;
    v_api_calls INTEGER;
    v_storage_used BIGINT;
    v_active_users INTEGER;
    v_result JSONB;
BEGIN
    -- Count invoices in period
    SELECT COUNT(*) INTO v_invoice_count
    FROM invoices 
    WHERE company_id = p_company_id 
    AND created_at BETWEEN p_start_date AND p_end_date;
    
    -- Count API calls in period
    SELECT COUNT(*) INTO v_api_calls
    FROM api_usage 
    WHERE company_id = p_company_id 
    AND timestamp BETWEEN p_start_date AND p_end_date;
    
    -- Count active users
    SELECT COUNT(DISTINCT user_id) INTO v_active_users
    FROM api_usage 
    WHERE company_id = p_company_id 
    AND timestamp BETWEEN p_start_date AND p_end_date
    AND user_id IS NOT NULL;
    
    -- Build result JSON
    v_result := jsonb_build_object(
        'invoice_count', v_invoice_count,
        'api_calls', v_api_calls,
        'active_users', v_active_users,
        'storage_used', v_storage_used,
        'period_start', p_start_date,
        'period_end', p_end_date
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create function to check and update quotas
CREATE OR REPLACE FUNCTION check_and_update_quota(p_company_id INTEGER, p_resource_type VARCHAR(50), p_increment INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_usage INTEGER;
    v_limit_value INTEGER;
    v_new_usage INTEGER;
    v_is_over_limit BOOLEAN;
BEGIN
    -- Get current usage
    SELECT used_value INTO v_current_usage
    FROM usage_quotas 
    WHERE company_id = p_company_id 
    AND resource_type = p_resource_type;
    
    -- Get limit
    SELECT limit_value INTO v_limit_value
    FROM usage_quotas 
    WHERE company_id = p_company_id 
    AND resource_type = p_resource_type;
    
    -- Calculate new usage
    v_new_usage := v_current_usage + p_increment;
    
    -- Check if over limit
    v_is_over_limit := v_new_usage > v_limit_value;
    
    -- Update usage
    UPDATE usage_quotas 
    SET used_value = v_new_usage,
        is_over_limit = v_is_over_limit
    WHERE company_id = p_company_id 
    AND resource_type = p_resource_type;
    
    RETURN v_is_over_limit;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically reset quotas
CREATE OR REPLACE FUNCTION reset_quotas()
RETURNS void AS $$
BEGIN
    -- Reset daily quotas
    UPDATE usage_quotas 
    SET used_value = 0,
        last_reset = CURRENT_TIMESTAMP,
        is_over_limit = false
    WHERE reset_period = 'daily'
    AND last_reset < CURRENT_DATE;
    
    -- Reset weekly quotas
    UPDATE usage_quotas 
    SET used_value = 0,
        last_reset = CURRENT_TIMESTAMP,
        is_over_limit = false
    WHERE reset_period = 'weekly'
    AND last_reset < CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    -- Reset monthly quotas
    UPDATE usage_quotas 
    SET used_value = 0,
        last_reset = CURRENT_TIMESTAMP,
        is_over_limit = false
    WHERE reset_period = 'monthly'
    AND last_reset < CURRENT_TIMESTAMP - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically reset quotas daily
CREATE OR REPLACE FUNCTION trigger_reset_quotas()
RETURNS trigger AS $$
BEGIN
    PERFORM reset_quotas();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to reset quotas (this would be set up as a scheduled job in production)
-- CREATE TRIGGER auto_reset_quotas
-- AFTER INSERT ON usage_quotas
-- FOR EACH STATEMENT
-- EXECUTE FUNCTION trigger_reset_quotas();

-- Add search vectors for monetization tables
ALTER TABLE subscription_plans ADD COLUMN search_vector tsvector;
ALTER TABLE company_subscriptions ADD COLUMN search_vector tsvector;
ALTER TABLE billing_invoices ADD COLUMN search_vector tsvector;
ALTER TABLE white_label_configs ADD COLUMN search_vector tsvector;

-- Create indexes for search
CREATE INDEX idx_subscription_plans_search ON subscription_plans USING gin(search_vector);
CREATE INDEX idx_company_subscriptions_search ON company_subscriptions USING gin(search_vector);
CREATE INDEX idx_billing_invoices_search ON billing_invoices USING gin(search_vector);
CREATE INDEX idx_white_label_configs_search ON white_label_configs USING gin(search_vector);

-- Update search vectors
UPDATE subscription_plans SET search_vector = to_tsvector('english', name || ' ' || COALESCE(description, ''));
UPDATE company_subscriptions SET search_vector = to_tsvector('english', status || ' ' || COALESCE(cancel_reason, ''));
UPDATE billing_invoices SET search_vector = to_tsvector('english', invoice_number || ' ' || COALESCE(payment_ref, ''));
UPDATE white_label_configs SET search_vector = to_tsvector('english', brand_name || ' ' || COALESCE(logo_url, ''));

-- Create triggers to update search vectors
CREATE OR REPLACE FUNCTION update_subscription_plan_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', NEW.name || ' ' || COALESCE(NEW.description, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plan_search_vector_trigger
BEFORE INSERT OR UPDATE ON subscription_plans
FOR EACH ROW EXECUTE FUNCTION update_subscription_plan_search_vector();

CREATE OR REPLACE FUNCTION update_company_subscription_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', NEW.status || ' ' || COALESCE(NEW.cancel_reason, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_subscription_search_vector_trigger
BEFORE INSERT OR UPDATE ON company_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_company_subscription_search_vector();

CREATE OR REPLACE FUNCTION update_billing_invoice_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', NEW.invoice_number || ' ' || COALESCE(NEW.payment_ref, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_billing_invoice_search_vector_trigger
BEFORE INSERT OR UPDATE ON billing_invoices
FOR EACH ROW EXECUTE FUNCTION update_billing_invoice_search_vector();

CREATE OR REPLACE FUNCTION update_white_label_config_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', NEW.brand_name || ' ' || COALESCE(NEW.logo_url, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_white_label_config_search_vector_trigger
BEFORE INSERT OR UPDATE ON white_label_configs
FOR EACH ROW EXECUTE FUNCTION update_white_label_config_search_vector();
