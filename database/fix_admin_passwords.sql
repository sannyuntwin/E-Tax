-- Fix admin user passwords with correct hashing format
-- This fixes the 401 Unauthorized error by using the backend's expected password format

-- Update superadmin password (Admin123!)
UPDATE users SET password = '/o2fE8Ub5MSOJq/L4dW2uAIj6E55uBaCI35qDyJUhHulijhp7lV4tZoqHlGXC8iK' WHERE username = 'superadmin';

-- Update sysadmin password (System@2024)
UPDATE users SET password = 'ftYb30pvsVmjXA643Q5Ain2mkGwLjSi9K23svsz3TXb9Qiey7sBq40naKF/dsXk9' WHERE username = 'sysadmin';

-- Update opsadmin password (Operations@2024)
UPDATE users SET password = 'o1eg9ylPDYjtXH49Avo/AYcrwllseDLqm+ngTk20IZ4eFeuC3KUy/34CPWA7ILZJ' WHERE username = 'opsadmin';

-- Update demo_admin password (Demo@1234)
UPDATE users SET password = 'CFQpcDKisW01ICqnQCSeUduD4qloItzewIaKbNAi1moEsOLmdgyuVKP0BIgNDHhd' WHERE username = 'demo_admin';

-- Verify the updates
SELECT username, email, role, is_active FROM users WHERE role = 'admin' ORDER BY id;
