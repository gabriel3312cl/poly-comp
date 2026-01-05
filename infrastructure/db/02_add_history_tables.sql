-- Create Dice Rolls Table
CREATE TABLE IF NOT EXISTS dice_rolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dice_count INT NOT NULL,
    dice_sides INT NOT NULL,
    results JSONB NOT NULL,
    total INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dice_rolls_game_id ON dice_rolls(game_id);

-- Create Roulette Spins Table
CREATE TABLE IF NOT EXISTS roulette_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    result_label TEXT NOT NULL,
    result_value INT NOT NULL,
    result_type TEXT NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roulette_spins_game_id ON roulette_spins(game_id);

-- Create Special Dice Rolls Table
CREATE TABLE IF NOT EXISTS special_dice_rolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    die_name TEXT NOT NULL,
    die_id TEXT NOT NULL,
    face_label TEXT NOT NULL,
    face_value INT, 
    face_action TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_special_dice_rolls_game_id ON special_dice_rolls(game_id);
