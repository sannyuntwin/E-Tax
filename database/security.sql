-- Security database schema
-- Create tables for authentication, authorization, and security

-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'accountant', 'user')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for token management
CREATE TABLE sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET
);

-- Audit log for security events
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50),
    resource_id INTEGER,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API keys for external integrations
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    key VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permissions TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security settings
CREATE TABLE security_settings (
    id SERIAL PRIMARY KEY,
    password_min_length INTEGER DEFAULT 8,
    require_strong_password BOOLEAN DEFAULT true,
    session_timeout INTEGER DEFAULT 86400,
    max_login_attempts INTEGER DEFAULT 5,
    lockout_duration INTEGER DEFAULT 900,
    require_two_factor BOOLEAN DEFAULT false,
    ip_whitelist TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Login attempt tracking
CREATE TABLE login_attempts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    reason VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_token ON sessions(token);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key ON api_keys(key);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

CREATE INDEX idx_login_attempts_username ON login_attempts(username);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);

-- Insert default admin user (password: Admin123!)
INSERT INTO users (username, email, password, first_name, last_name, role) VALUES
('admin', 'admin@etax.com', '$argon2id$v=19$m=65536,t=3,p=2$c29tZXNhbHQzZXhhbXBsZSQ$RmFrZVJhbHRlZGF0YQ', 'System', 'Administrator', 'admin');

-- Insert default security settings
INSERT INTO security_settings (password_min_length, require_strong_password, session_timeout, max_login_attempts, lockout_duration) VALUES
(8, true, 86400, 5, 900);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_settings_updated_at BEFORE UPDATE ON security_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up expired sessions periodically
CREATE OR REPLACE FUNCTION trigger_cleanup_sessions()
RETURNS trigger AS $$
BEGIN
    PERFORM cleanup_expired_sessions();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run cleanup every hour (this would be set up as a cron job in production)
-- CREATE TRIGGER auto_cleanup_sessions
-- AFTER INSERT ON sessions
-- FOR EACH STATEMENT
-- EXECUTE FUNCTION trigger_cleanup_sessions();

-- Function to lock user account after failed attempts
CREATE OR REPLACE FUNCTION lock_user_account(p_username VARCHAR(50))
RETURNS void AS $$
DECLARE
    v_user_id INTEGER;
    v_attempt_count INTEGER;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM users WHERE username = p_username;
    
    IF v_user_id IS NOT NULL THEN
        -- Count failed attempts in last 15 minutes
        SELECT COUNT(*) INTO v_attempt_count
        FROM login_attempts
        WHERE username = p_username 
        AND success = false 
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '15 minutes';
        
        -- Lock account if too many failed attempts
        IF v_attempt_count >= 5 THEN
            UPDATE users SET is_active = false WHERE id = v_user_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to unlock user account
CREATE OR REPLACE FUNCTION unlock_user_account(p_username VARCHAR(50))
RETURNS void AS $$
BEGIN
    UPDATE users SET is_active = true WHERE username = p_username;
END;
$$ LANGUAGE plpgsql;

-- Add search vector for audit logs
ALTER TABLE audit_logs ADD COLUMN search_vector tsvector;
CREATE INDEX idx_audit_logs_search ON audit_logs USING gin(search_vector);

-- Add search vector for users
ALTER TABLE users ADD COLUMN search_vector tsvector;
CREATE INDEX idx_users_search ON users USING gin(search_vector);

-- Update search vectors
UPDATE users SET search_vector = to_tsvector('english', username || ' ' || email || ' ' || first_name || ' ' || last_name);
UPDATE audit_logs SET search_vector = to_tsvector('english', action || ' ' || COALESCE(resource, '') || ' ' || COALESCE(details, ''));

-- Create trigger to update search vectors
CREATE OR REPLACE FUNCTION update_user_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', NEW.username || ' ' || NEW.email || ' ' || NEW.first_name || ' ' || NEW.last_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_search_vector_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_user_search_vector();

CREATE OR REPLACE FUNCTION update_audit_log_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', NEW.action || ' ' || COALESCE(NEW.resource, '') || ' ' || COALESCE(NEW.details, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_audit_log_search_vector_trigger
BEFORE INSERT OR UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION update_audit_log_search_vector();
