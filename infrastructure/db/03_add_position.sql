-- Add position column to game_participants table
ALTER TABLE game_participants ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
