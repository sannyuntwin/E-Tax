-- Admin Seed Data for E-Tax System
-- This script creates admin users with proper password hashing

-- Clear existing admin users (optional - uncomment if you want to reset)
-- DELETE FROM users WHERE role = 'admin';

-- Create super admin user
-- Username: superadmin
-- Email: superadmin@etax.com  
-- Password: Admin123!
INSERT INTO users (username, email, password, first_name, last_name, role, is_active, created_at, updated_at) VALUES
('superadmin', 'superadmin@etax.com', '$argon2id$v=19$m=65536,t=3,p=2$c7Xf8gq+8tpI/9CU29SWvw$x578opbdhTE1Rp+n7+uHFlAGaCnimb5mxL/iVPn43g4', 'Super', 'Administrator', 'admin', true, NOW(), NOW());

-- Create system admin user
-- Username: sysadmin
-- Email: sysadmin@etax.com
-- Password: System@2024
INSERT INTO users (username, email, password, first_name, last_name, role, is_active, created_at, updated_at) VALUES
('sysadmin', 'sysadmin@etax.com', '$argon2id$v=19$m=65536,t=3,p=2$JSuvCucmEJ57JGo7fSt0tQ$mnsa8gwriIUDoorS67H7/Xh5oCEvi+5rV4lEobf4BOM', 'System', 'Administrator', 'admin', true, NOW(), NOW());

-- Create operations admin user
-- Username: opsadmin
-- Email: opsadmin@etax.com
-- Password: Operations@2024
INSERT INTO users (username, email, password, first_name, last_name, role, is_active, created_at, updated_at) VALUES
('opsadmin', 'opsadmin@etax.com', '$argon2id$v=19$m=65536,t=3,p=2$LerVRjVgvAa3ReQa/69gCQ$5bA5BaYEC30RvSbpxATyLstQeKh63stXE1B7R7jr0Ac', 'Operations', 'Administrator', 'admin', true, NOW(), NOW());

-- Create demo admin user (for development/testing)
-- Username: demo_admin
-- Email: demo_admin@etax.com
-- Password: Demo@1234
INSERT INTO users (username, email, password, first_name, last_name, role, is_active, created_at, updated_at) VALUES
('demo_admin', 'demo_admin@etax.com', '$argon2id$v=19$m=65536,t=3,p=2$e2jmp6QVqOqMtBk/RQDTJw$AI00akPFfEQwu2KNdwLudPQkNV/lUETU/PKl92F6GTA', 'Demo', 'Administrator', 'admin', true, NOW(), NOW());

-- Create audit log entries for admin creation
INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent, created_at) VALUES
(1, 'create_admin', 'user', 'Created super admin user', '127.0.0.1', 'Database Seed Script', NOW()),
(1, 'create_admin', 'user', 'Created system admin user', '127.0.0.1', 'Database Seed Script', NOW()),
(1, 'create_admin', 'user', 'Created operations admin user', '127.0.0.1', 'Database Seed Script', NOW()),
(1, 'create_admin', 'user', 'Created demo admin user', '127.0.0.1', 'Database Seed Script', NOW());

-- Create API keys for admin users
INSERT INTO api_keys (name, key, user_id, permissions, is_active, expires_at, created_at) VALUES
('Super Admin API Key', 'sk-super-admin-' || substr(md5(random()::text), 1, 24), 5, '["read", "write", "delete", "admin"]', true, CURRENT_TIMESTAMP + INTERVAL '1 year', NOW()),
('System Admin API Key', 'sk-sys-admin-' || substr(md5(random()::text), 1, 24), 6, '["read", "write", "admin"]', true, CURRENT_TIMESTAMP + INTERVAL '1 year', NOW()),
('Operations Admin API Key', 'sk-ops-admin-' || substr(md5(random()::text), 1, 24), 7, '["read", "write"]', true, CURRENT_TIMESTAMP + INTERVAL '6 months', NOW()),
('Demo Admin API Key', 'sk-demo-admin-' || substr(md5(random()::text), 1, 24), 8, '["read", "write"]', true, CURRENT_TIMESTAMP + INTERVAL '3 months', NOW());

-- Output summary
DO $$
BEGIN
    RAISE NOTICE 'Admin users created successfully:';
    RAISE NOTICE '1. superadmin / Admin123!';
    RAISE NOTICE '2. sysadmin / System@2024';
    RAISE NOTICE '3. opsadmin / Operations@2024';
    RAISE NOTICE '4. demo_admin / Demo@1234';
    RAISE NOTICE '';
    RAISE NOTICE 'Note: All passwords use Argon2id hashing. Replace the hashed passwords';
    RAISE NOTICE 'with actual hashed values for production use.';
END $$;
