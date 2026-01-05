-- Cards Catalog
CREATE TYPE card_type AS ENUM ('arca', 'fortuna', 'bonificacion', 'boveda');
CREATE TYPE card_color AS ENUM ('yellow', 'red', 'green'); -- For Boveda
CREATE TYPE card_action AS ENUM ('pay_bank', 'receive_bank', 'pay_all', 'receive_all', 'move_to', 'keep', 'repair', 'custom');

CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type card_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(20, 2), -- For Boveda purchasable cards
    color card_color, -- For Boveda
    action_type card_action,
    action_value DECIMAL(20, 2) -- Amount or specific val
);

-- Active Decks per Game (Track order/status)
-- We will store the deck as a shuffled list of card IDs in Redis or just simpler:
-- Actually, a table tracking which cards are "in deck", "drawn", "discarded" for each game.
CREATE TABLE game_cards_deck (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    card_type card_type NOT NULL,
    -- We can just store the 'order' or state. 
    -- Simplification: "draw_pile" and "discard_pile".
    -- But mapping every card to every game is heavy rows.
    -- Better: Services/Logic handles the random draw from the 'cards' table using NOT EXISTS in 'drawn_cards'.
    -- If deck is empty, clear 'drawn_cards' (reshuffle).
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instead of a heavy deck table, we track DISCARDED cards. 
-- When drawing, we pick random from cards WHERE type=? AND id NOT IN (drawn_cards for game).
-- If count is 0, we delete entries from drawn_cards (shuffle).
CREATE TABLE game_drawn_cards (
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    drawn_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (game_id, card_id)
);

-- Boveda Market (The 3 active global cards)
CREATE TABLE game_boveda_market (
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    slot_index INT NOT NULL, -- 0, 1, 2
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, slot_index)
);

-- Player Inventory (Saved Cards)
CREATE TABLE participant_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES game_participants(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE, -- For passive/active checking
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

-- SEED DATA --

-- Arca Comunal
INSERT INTO cards (type, title, description, action_type, action_value) VALUES
('arca', 'Venta de acciones', 'Por venta de acciones, cobra 50', 'receive_bank', 50),
('arca', 'Devolución de impuestos', 'Cobra 20', 'receive_bank', 20),
('arca', 'Herencia misteriosa', 'Recibes una herencia misteriosa. Cobra 100', 'receive_bank', 100),
('arca', 'Error bancario', 'Error bancario a tu favor. Cobra 200', 'receive_bank', 200),
('arca', 'Gastos escolares', 'Paga 50', 'pay_bank', 50),
('arca', 'Cumpleaños', 'Es tu cumpleaños. Cobra 10 a cada jugador', 'receive_all', 10),
('arca', 'La Salida', 'Avanza hasta la salida. Cobra 200', 'move_to', 0), -- Special logic for move
('arca', 'Seguro de vida', 'El seguro de vida te reporta beneficios. Cobra 100', 'receive_bank', 100),
('arca', 'Consultoría', 'Honorarios de consultoria. Cobra 25', 'receive_bank', 25),
('arca', 'Reparaciones', 'Debes hacer reparaciones viales. Paga por casas y hoteles.', 'repair', 0), -- Complex logic
('arca', 'Fondo vacacional', 'El fondo vacacional te reporta beneficios. Cobra 100', 'receive_bank', 100),
('arca', 'Cárcel', 'Ve directamente a la cárcel. No pases por la salida.', 'move_to', -1), -- -1 code for jail?
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
