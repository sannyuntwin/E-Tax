# Admin Seed Data

This directory contains seed data for creating admin users in the E-Tax system.

## Files

- `admin_seed.sql` - Main seed file for creating admin users with proper password hashing
- `../scripts/generate_admin_hashes.go` - Script to generate new password hashes

## Admin Users Created

### 1. Super Admin
- **Username:** `superadmin`
- **Email:** `superadmin@etax.com`
- **Password:** `Admin123!`
- **Permissions:** Full system access

### 2. System Admin
- **Username:** `sysadmin`
- **Email:** `sysadmin@etax.com`
- **Password:** `System@2024`
- **Permissions:** System administration

### 3. Operations Admin
- **Username:** `opsadmin`
- **Email:** `opsadmin@etax.com`
- **Password:** `Operations@2024`
- **Permissions:** Operations management

### 4. Demo Admin
- **Username:** `demo_admin`
- **Email:** `demo_admin@etax.com`
- **Password:** `Demo@1234`
- **Permissions:** Demo/testing purposes

## Usage

### Running the Seed Script

```bash
# Connect to your database and run:
psql -h localhost -U postgres -d etax -f database/admin_seed.sql
```

### Using Docker

```bash
# If using Docker Compose, copy the seed file to the container:
docker cp database/admin_seed.sql etax-postgres:/tmp/
docker exec -it etax-postgres psql -U postgres -d etax -f /tmp/admin_seed.sql
```

### Reset Admin Users

To reset all admin users, uncomment the DELETE statement at the top of `admin_seed.sql`:

```sql
-- Uncomment this line to reset admin users
DELETE FROM users WHERE role = 'admin';
```

## Security Notes

- All passwords use Argon2id hashing (recommended by OWASP)
- Passwords meet complexity requirements (minimum 8 characters, uppercase, lowercase, numbers, special characters)
- Each admin user gets unique API keys with appropriate permissions
- All admin creation actions are logged in the audit trail

## Generating New Admin Users

1. Modify `../scripts/generate_admin_hashes.go` to add new users
2. Run the script to generate new password hashes:
   ```bash
   cd scripts && go run generate_admin_hashes.go
   ```
3. Copy the generated INSERT statements into `admin_seed.sql`

## API Keys

Each admin user gets an API key with different permission levels:

- **Super Admin:** `["read", "write", "delete", "admin"]` (1 year expiry)
- **System Admin:** `["read", "write", "admin"]` (1 year expiry)
- **Operations Admin:** `["read", "write"]` (6 months expiry)
- **Demo Admin:** `["read", "write"]` (3 months expiry)

## First Login

After running the seed script:

1. Log in with any of the admin credentials
2. Change the default passwords immediately
3. Configure two-factor authentication if enabled
4. Review and update security settings

## Troubleshooting

### Duplicate User Error
If you get "duplicate key value violates unique constraint", run the reset query first or manually delete existing admin users.

### Permission Denied
Ensure the database user has INSERT permissions on the `users`, `audit_logs`, and `api_keys` tables.

### Password Not Working
Verify the password hashing algorithm matches your backend implementation. The generated hashes use Argon2id with standard parameters.
