-- ==========================================
-- BOOTSTRAP SECTION
-- Only run the CREATE DATABASE / USER parts if they don't exist.
-- Ideally run as 'postgres' superuser.
-- ==========================================

-- 1. Create User (Manual bootstrap if needed)
-- CREATE USER monopoly_user WITH PASSWORD 'monopoly_pass';

-- 2. Create Database
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

-- Enums for Cards
CREATE TYPE card_type AS ENUM ('arca', 'fortuna', 'bonificacion', 'boveda');
CREATE TYPE card_color AS ENUM ('yellow', 'red', 'green'); -- For Boveda
CREATE TYPE card_action AS ENUM ('pay_bank', 'receive_bank', 'pay_all', 'receive_all', 'move_to', 'keep', 'repair', 'custom');

-- Users Table
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
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(4) UNIQUE NOT NULL,
    host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'Monopoly Game',
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    jackpot_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    current_turn_user_id UUID REFERENCES users(id),
    turn_order JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Game Participants Table
CREATE TABLE game_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 1500.00,
    position INTEGER NOT NULL DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, user_id)
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    from_participant_id UUID REFERENCES game_participants(id) ON DELETE CASCADE,
    to_participant_id UUID REFERENCES game_participants(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_at_least_one_party CHECK (from_participant_id IS NOT NULL OR to_participant_id IS NOT NULL)
);

-- Dice Rolls Table
CREATE TABLE dice_rolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dice_count INT NOT NULL,
    dice_sides INT NOT NULL,
    results JSONB NOT NULL,
    total INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roulette Spins Table
CREATE TABLE roulette_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    result_label TEXT NOT NULL,
    result_value INT NOT NULL,
    result_type TEXT NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Special Dice Rolls Table
CREATE TABLE special_dice_rolls (
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

-- Cards Catalog
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type card_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(20, 2),
    color card_color,
    action_type card_action,
    action_value DECIMAL(20, 2)
);

-- Active Decks per Game
CREATE TABLE game_cards_deck (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    card_type card_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track DISCARDED/DRAWN cards.
CREATE TABLE game_drawn_cards (
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    drawn_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (game_id, card_id)
);

-- Boveda Market
CREATE TABLE game_boveda_market (
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    slot_index INT NOT NULL,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, slot_index)
);

-- Player Inventory
CREATE TABLE participant_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES game_participants(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    acquired_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage History
CREATE TABLE card_usage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES game_participants(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(id),
    action_description TEXT,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX idx_transactions_game_id ON transactions(game_id);
CREATE INDEX idx_transactions_from_participant ON transactions(from_participant_id);
CREATE INDEX idx_transactions_to_participant ON transactions(to_participant_id);
CREATE INDEX idx_dice_rolls_game_id ON dice_rolls(game_id);
CREATE INDEX idx_roulette_spins_game_id ON roulette_spins(game_id);
CREATE INDEX idx_special_dice_rolls_game_id ON special_dice_rolls(game_id);

-- ==========================================
-- OWNERSHIP / PRIVILEGES
-- ==========================================
ALTER TABLE users OWNER TO monopoly_user;
ALTER TABLE game_sessions OWNER TO monopoly_user;
ALTER TABLE game_participants OWNER TO monopoly_user;
ALTER TABLE transactions OWNER TO monopoly_user;
ALTER TABLE dice_rolls OWNER TO monopoly_user;
ALTER TABLE roulette_spins OWNER TO monopoly_user;
ALTER TABLE special_dice_rolls OWNER TO monopoly_user;
ALTER TABLE cards OWNER TO monopoly_user;
ALTER TABLE game_cards_deck OWNER TO monopoly_user;
ALTER TABLE game_drawn_cards OWNER TO monopoly_user;
ALTER TABLE game_boveda_market OWNER TO monopoly_user;
ALTER TABLE participant_cards OWNER TO monopoly_user;
ALTER TABLE card_usage_history OWNER TO monopoly_user;

-- ==========================================
-- SEED DATA
-- ==========================================

-- Arca Comunal
INSERT INTO cards (type, title, description, action_type, action_value) VALUES
('arca', 'Venta de acciones', 'Por venta de acciones, cobra 50', 'receive_bank', 50),
('arca', 'Devolución de impuestos', 'Cobra 20', 'receive_bank', 20),
('arca', 'Herencia misteriosa', 'Recibes una herencia misteriosa. Cobra 100', 'receive_bank', 100),
('arca', 'Error bancario', 'Error bancario a tu favor. Cobra 200', 'receive_bank', 200),
('arca', 'Gastos escolares', 'Paga 50', 'pay_bank', 50),
('arca', 'Cumpleaños', 'Es tu cumpleaños. Cobra 10 a cada jugador', 'receive_all', 10),
('arca', 'La Salida', 'Avanza hasta la salida. Cobra 200', 'move_to', 0),
('arca', 'Seguro de vida', 'El seguro de vida te reporta beneficios. Cobra 100', 'receive_bank', 100),
('arca', 'Consultoría', 'Honorarios de consultoria. Cobra 25', 'receive_bank', 25),
('arca', 'Reparaciones', 'Debes hacer reparaciones viales. Paga por casas y hoteles.', 'repair', 0),
('arca', 'Fondo vacacional', 'El fondo vacacional te reporta beneficios. Cobra 100', 'receive_bank', 100),
('arca', 'Cárcel', 'Ve directamente a la cárcel. No pases por la salida.', 'move_to', -1),
('arca', 'Concurso de belleza', 'Has ganado el segundo premio. Cobra 10', 'receive_bank', 10),
('arca', 'Adoptas un perrito', 'Paga 50', 'pay_bank', 50),
('arca', 'Hospital', 'Facturas de hospital. Paga 100', 'pay_bank', 100),
('arca', 'Sal de la Cárcel', 'Sal de la carcel gratis. Conservar.', 'keep', 0);

-- Fortuna
INSERT INTO cards (type, title, description, action_type, action_value) VALUES
('fortuna', 'Ferrocarril', 'Avanza al siguiente ferrocarril. Si tiene dueño paga doble.', 'move_to', 0),
('fortuna', 'San Carlos', 'Avanza hasta la plaza San Carlos.', 'move_to', 0),
('fortuna', 'Cárcel', 'Ve directamente a la cárcel.', 'move_to', -1),
('fortuna', 'Muelle', 'Avanza hasta el muelle.', 'move_to', 0),
('fortuna', 'Retrocede', 'Retrocede tres casillas.', 'move_to', -3),
('fortuna', 'Reading', 'Viaja hasta el ferrocarril Reading.', 'move_to', 0),
('fortuna', 'Dividendo', 'El banco te paga un dividendo de 50.', 'receive_bank', 50),
('fortuna', 'Presidente', 'Elegido presidente. Paga a cada jugador 50.', 'pay_all', 50),
('fortuna', 'Salida', 'Avanza hasta la salida.', 'move_to', 0),
('fortuna', 'Préstamo', 'Por cumplimiento del préstamo, cobra 150.', 'receive_bank', 150),
('fortuna', 'Servicio Público', 'Avanza al servicio público más cercano.', 'move_to', 0),
('fortuna', 'Sal de la Cárcel', 'Sal de la carcel gratis.', 'keep', 0),
('fortuna', 'Illinois', 'Avanza a la Avenida Illinois.', 'move_to', 0),
('fortuna', 'Reparaciones', 'Reparaciones generales.', 'repair', 0),
('fortuna', 'Multa', 'Multa por exceso de velocidad. Paga 15.', 'pay_bank', 15);

-- Bonificaciones
INSERT INTO cards (type, title, description, action_type) VALUES
('bonificacion', 'De nuevo', 'Vuelve a girar la ruleta', 'custom'),
('bonificacion', 'Hazte más verde', 'Al caer en verde, mueve a otro verde', 'custom'),
('bonificacion', 'Gran Premio', 'Cobra el gran premio de la parada libre', 'custom'),
('bonificacion', 'Gira la ruleta', 'Gira sin gastar ficha', 'custom'),
('bonificacion', 'Propiedad Gratis', 'Toma propiedad sin dueño gratis', 'custom'),
('bonificacion', 'Reversa', 'Sustrae 1 de tu movimiento', 'custom'),
('bonificacion', 'Luz verde', 'Si caes en rojo, mueve a verde adyacente', 'custom'),
('bonificacion', 'Atajo', 'Mueve token a cualquier propiedad', 'custom'),
('bonificacion', 'Casa Gratis', 'Construye casa gratis', 'custom'),
('bonificacion', 'Mejora', 'Cambia token por Limusina (renta gratis)', 'custom'),
('bonificacion', 'Intercambio', 'Intercambia propiedad por una sin dueño', 'custom'),
('bonificacion', 'Compra dos', 'Compra propiedad y la siguiente tambien', 'custom');

-- Bóveda (Store)
INSERT INTO cards (type, title, description, cost, color, action_type) VALUES
('boveda', 'Constructor Privilegiado', 'Puedes construir casas en cualquier momento.', 250, 'yellow', 'keep'),
('boveda', 'Títulos de Propiedad', 'Eres dueño de los títulos. Cobras tú en lugar del banco.', 375, 'yellow', 'keep'),
('boveda', 'Tren de Victorias', 'Si posees 4 ferrocarriles, ganas.', 225, 'green', 'keep'),
('boveda', 'Subasta Instantánea', 'Subasta la siguiente propiedad sin dueño.', 25, 'red', 'custom'),
('boveda', 'Casa del Éxito', 'Ganas con: 1 ferrocarril, 1 esquina, 1 servicio, 1 impuesto.', 250, 'green', 'keep'),
('boveda', 'El Banco', 'Eres dueño del banco. Usas dinero del banco para pagar.', 500, 'yellow', 'keep'),
('boveda', 'Monopolio Instantáneo', 'Compra grupo completo.', 50, 'red', 'custom'),
('boveda', 'Ladrón de Títulos', 'Roba título más barato a cada jugador.', 200, 'red', 'custom'),
('boveda', 'La Bóveda', 'Eres dueño de la bóveda. Cobras tú las tarjetas de venta.', 500, 'yellow', 'keep'),
('boveda', 'Todos los de 50', 'Toma todos los billetes de 50 de todos.', 300, 'red', 'custom'),
('boveda', 'Número 7', 'Controlas el 7. Mueves a quien saque 7.', 300, 'yellow', 'keep'),
('boveda', 'Propulsor', 'Avanza a cualquier casilla en vez de tirar.', 150, 'red', 'custom'),
('boveda', 'Campeón Doble', 'Ganas con 2 grupos completos.', 300, 'green', 'keep'),
('boveda', 'Dado de Compra', 'Eliges resultado del dado.', 275, 'yellow', 'keep'),
('boveda', 'Victoria por Barrida', 'Ganas con 8 títulos.', 350, 'green', 'keep'),
('boveda', 'Bienes Raíces Gratis', 'Coloca casa gratis.', 25, 'red', 'custom'),
('boveda', 'Circuito Victoria', 'Ganas con Muelle + Hotel.', 325, 'green', 'keep'),
('boveda', 'Dobles', 'Ganas con 3 dobles.', 50, 'green', 'keep'),
('boveda', 'Todas las Construcciones', 'Dueño de casas/hoteles. Cobras por construir.', 100, 'yellow', 'keep'),
('boveda', 'Salida Victoriosa', 'Ganas al caer en Salida.', 200, 'green', 'keep');

-- ==========================================
-- NEW GAME MECHANICS (PROPERTIES, AUCTIONS, TRADES)
-- ==========================================

-- Properties Catalog (Static Data)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    group_color VARCHAR(20) NOT NULL, -- e.g. 'red', 'blue', 'railroad', 'utility'
    price DECIMAL(15, 2) NOT NULL,
    rent_base DECIMAL(15, 2) NOT NULL,
    rent_house_1 DECIMAL(15, 2),
    rent_house_2 DECIMAL(15, 2),
    rent_house_3 DECIMAL(15, 2),
    rent_house_4 DECIMAL(15, 2),
    rent_hotel DECIMAL(15, 2),
    mortgage_value DECIMAL(15, 2) NOT NULL,
    unmortgage_cost DECIMAL(15, 2) NOT NULL,
    house_cost DECIMAL(15, 2),
    hotel_cost DECIMAL(15, 2),
    board_position INT -- Index on the board (0-39) to link with UI
);

-- Property Ownership (Dynamic per Game)
CREATE TABLE participant_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES game_participants(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id),
    is_mortgaged BOOLEAN DEFAULT FALSE,
    house_count INT DEFAULT 0, -- 0-4
    hotel_count INT DEFAULT 0, -- 0-1
    UNIQUE(game_id, property_id) -- A property can only be owned by one person in a game
);

-- Auctions
CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id),
    current_bid DECIMAL(15, 2) DEFAULT 0,
    highest_bidder_id UUID REFERENCES game_participants(id),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, FINISHED, CANCELLED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ
);

-- Trades
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    initiator_id UUID NOT NULL REFERENCES game_participants(id),
    target_id UUID NOT NULL REFERENCES game_participants(id),
    offer_cash DECIMAL(15, 2) DEFAULT 0,
    offer_properties JSONB, -- List of property_ids
    offer_cards JSONB,      -- List of participant_card_ids
    request_cash DECIMAL(15, 2) DEFAULT 0,
    request_properties JSONB,
    request_cards JSONB,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, CANCELLED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED PROPERTIES
-- Based on provided text file "titulos de propiedad.txt"
-- Note: Prices are derived as Mortgage * 2 if not explicitly standard.
-- Groups: brown, light_blue, pink, orange, red, yellow, green, dark_blue, railroad, utility

INSERT INTO properties (name, group_color, price, rent_base, rent_house_1, rent_house_2, rent_house_3, rent_house_4, rent_hotel, mortgage_value, unmortgage_cost, house_cost, hotel_cost, board_position) VALUES
-- Brown
('Avenida Mediterráneo', 'brown', 60, 2, 10, 30, 90, 160, 250, 30, 33, 50, 50, 1),
('Avenida Báltica', 'brown', 60, 4, 20, 60, 180, 320, 450, 30, 33, 50, 50, 3),

-- Light Blue
('Avenida Oriental', 'light_blue', 100, 6, 30, 90, 270, 400, 550, 50, 55, 50, 50, 6),
('Avenida Vermont', 'light_blue', 100, 6, 30, 90, 270, 400, 550, 50, 55, 50, 50, 8),
('Avenida Connecticut', 'light_blue', 120, 8, 40, 100, 300, 450, 600, 60, 66, 50, 50, 9),

-- Pink
('Plaza San Carlos', 'pink', 140, 10, 50, 150, 450, 625, 750, 70, 77, 100, 100, 11),
('Avenida Estados', 'pink', 140, 10, 50, 150, 450, 625, 750, 70, 77, 100, 100, 13),
('Avenida Virginia', 'pink', 160, 12, 60, 180, 500, 700, 900, 80, 88, 100, 100, 14),

-- Orange
('Plaza St. James', 'orange', 180, 14, 70, 200, 550, 750, 950, 90, 99, 100, 100, 16),
('Avenida Tennessee', 'orange', 180, 14, 70, 200, 550, 750, 950, 90, 99, 100, 100, 18),
('Avenida Nueva York', 'orange', 200, 16, 80, 220, 600, 800, 1000, 100, 110, 100, 100, 19),

-- Red
('Avenida Kentucky', 'red', 220, 18, 90, 250, 700, 875, 1050, 110, 121, 150, 150, 21),
('Avenida Indiana', 'red', 220, 18, 90, 250, 700, 875, 1050, 110, 121, 150, 150, 23),
('Avenida Illinois', 'red', 240, 20, 100, 300, 750, 925, 1100, 120, 132, 150, 150, 24),

-- Yellow
('Avenida Atlántico', 'yellow', 260, 22, 110, 330, 800, 975, 1150, 130, 143, 150, 150, 26),
('Avenida Ventnor', 'yellow', 260, 22, 110, 330, 800, 975, 1150, 130, 143, 150, 150, 27),
('Jardines Marvin', 'yellow', 280, 24, 120, 360, 850, 1025, 1200, 140, 154, 150, 150, 29),

-- Green
('Avenida Pacífico', 'green', 300, 26, 130, 390, 900, 1100, 1275, 150, 165, 200, 200, 31),
('Avenida Carolina del Norte', 'green', 300, 26, 130, 390, 900, 1100, 1275, 150, 165, 200, 200, 32),
('Avenida Pennsylvania', 'green', 320, 28, 150, 450, 1000, 1200, 1400, 160, 176, 200, 200, 34),

-- Dark Blue
('Plaza Park', 'dark_blue', 350, 35, 175, 500, 1100, 1300, 1500, 175, 193, 200, 200, 37),
('El Muelle', 'dark_blue', 400, 50, 200, 600, 1400, 1700, 2000, 200, 200, 200, 200, 39),

-- Railroads (Rent is multiplier based on count, handled in code)
('Ferrocarril Reading', 'railroad', 200, 25, 0, 0, 0, 0, 0, 100, 110, 0, 0, 5),
('Ferrocarril Pennsylvania', 'railroad', 200, 25, 0, 0, 0, 0, 0, 100, 110, 0, 0, 15),
('Ferrocarril B. & O.', 'railroad', 200, 25, 0, 0, 0, 0, 0, 100, 110, 0, 0, 25),
('Ferrocarril Vía Rápida', 'railroad', 200, 25, 0, 0, 0, 0, 0, 100, 110, 0, 0, 35),

-- Utilities (Rent is multiplier based on dice, handled in code)
('Compañía de Electricidad', 'utility', 150, 0, 0, 0, 0, 0, 0, 75, 83, 0, 0, 12),
('Compañía de Agua', 'utility', 150, 0, 0, 0, 0, 0, 0, 75, 83, 0, 0, 28);
