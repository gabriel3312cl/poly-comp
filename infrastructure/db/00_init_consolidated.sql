-- ==========================================
-- BOOTSTRAP SECTION
-- Only run the CREATE DATABASE / USER parts if they don't exist.
-- Ideally run as 'postgres' superuser.
-- ==========================================

-- 1. Create User (if not exists, this command will fail if exists, or use DROP first)
-- DROP ROLE IF EXISTS monopoly_user;
-- CREATE USER monopoly_user WITH PASSWORD 'monopoly_pass';

-- 2. Create Database
-- DROP DATABASE IF EXISTS monopoly_companion;
-- CREATE DATABASE monopoly_companion OWNER monopoly_user;

-- 3. Connect to Database (PSQL specific command)
-- \c monopoly_companion

-- 4. Grant Schema Privileges
-- GRANT ALL ON SCHEMA public TO monopoly_user;

-- ==========================================
-- SCHEMA INITIALIZATION
-- ==========================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
-- Stores basic user information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_logout_at TIMESTAMP WITH TIME ZONE
);

-- Game Sessions Table
-- Stores the state of a game session
-- Status values: 'WAITING', 'ACTIVE', 'PAUSED', 'FINISHED', 'CANCELLED'
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(4) UNIQUE NOT NULL,
    host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'Monopoly Game',
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Game Participants Table
-- Links users to games and tracks their current balance
CREATE TABLE game_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 1500.00, -- Default Monopoly starting money
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, user_id)
);

-- Transactions Table
-- Records all financial movements within a game
-- If from_participant_id is NULL, the money comes from the Bank
-- If to_participant_id is NULL, the money goes to the Bank
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    from_participant_id UUID REFERENCES game_participants(id) ON DELETE CASCADE,
    to_participant_id UUID REFERENCES game_participants(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Ensure at least one party is a player (Bank <-> Bank transfers don't make sense here usually, but logic allows Bank <-> Player or Player <-> Player)
    CONSTRAINT chk_at_least_one_party CHECK (from_participant_id IS NOT NULL OR to_participant_id IS NOT NULL)
);

-- Indexes for common lookups
CREATE INDEX idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX idx_transactions_game_id ON transactions(game_id);
CREATE INDEX idx_transactions_from_participant ON transactions(from_participant_id);
CREATE INDEX idx_transactions_to_participant ON transactions(to_participant_id);

-- Ownership / Permissions
-- Ensure the application user has control over these tables
ALTER TABLE users OWNER TO monopoly_user;
ALTER TABLE game_sessions OWNER TO monopoly_user;
ALTER TABLE game_participants OWNER TO monopoly_user;
ALTER TABLE transactions OWNER TO monopoly_user;
