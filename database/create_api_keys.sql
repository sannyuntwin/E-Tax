-- Create API keys for admin users
INSERT INTO api_keys (name, key, user_id, permissions, is_active, expires_at, created_at) VALUES
('Super Admin API Key', 'sk-super-admin-' || substr(md5(random()::text), 1, 24), 5, '["read", "write", "delete", "admin"]', true, CURRENT_TIMESTAMP + INTERVAL '1 year', NOW()),
('System Admin API Key', 'sk-sys-admin-' || substr(md5(random()::text), 1, 24), 6, '["read", "write", "admin"]', true, CURRENT_TIMESTAMP + INTERVAL '1 year', NOW()),
('Operations Admin API Key', 'sk-ops-admin-' || substr(md5(random()::text), 1, 24), 7, '["read", "write"]', true, CURRENT_TIMESTAMP + INTERVAL '6 months', NOW()),
('Demo Admin API Key', 'sk-demo-admin-' || substr(md5(random()::text), 1, 24), 8, '["read", "write"]', true, CURRENT_TIMESTAMP + INTERVAL '3 months', NOW());
