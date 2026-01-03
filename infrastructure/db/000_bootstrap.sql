-- Run this script as a Superuser (e.g., 'postgres')
-- psql -U postgres -f infrastructure/db/000_bootstrap.sql

-- 1. Create the application user
-- CHANGE 'monopoly_password' to a secure password!
CREATE USER monopoly_user WITH PASSWORD 'monopoly_password';

-- 2. Create the database and assign ownership
CREATE DATABASE monopoly_companion OWNER monopoly_user;

-- 3. Grant privileges (Optional, OWNER usually has enough, but explicit grant is safe)
GRANT ALL PRIVILEGES ON DATABASE monopoly_companion TO monopoly_user;

-- 4. (Optional) Allow user to create schemas etc. if needed
-- ALTER USER monopoly_user CREATEDB; -- Only if you want them to create more DBs
