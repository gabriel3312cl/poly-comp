-- Fix Permissions / Ownership
-- Run this as Superuser (postgres) connected to database 'monopoly_companion'
-- psql -U postgres -d monopoly_companion -f infrastructure/db/001_fix_permissions.sql

-- Option 1: Grant all privileges (Quick fix)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO monopoly_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO monopoly_user;

-- Option 2: Change Ownership (Cleaner fix, if monopoly_user created the DB)
ALTER TABLE users OWNER TO monopoly_user;
ALTER TABLE game_sessions OWNER TO monopoly_user;
ALTER TABLE game_participants OWNER TO monopoly_user;
ALTER TABLE transactions OWNER TO monopoly_user;
