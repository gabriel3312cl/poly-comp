use async_trait::async_trait;
use sqlx::{Pool, Postgres};
use uuid::Uuid;
use crate::domain::repositories::CardRepository;
use crate::domain::entities::{Card, ParticipantCard, GameBovedaMarket, CardUsageHistory};

pub struct PostgresCardRepository {
    pool: Pool<Postgres>,
}

impl PostgresCardRepository {
    pub fn new(pool: Pool<Postgres>) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl CardRepository for PostgresCardRepository {


    async fn find_by_type(&self, card_type: &str) -> Result<Vec<Card>, anyhow::Error> {
        let cards = sqlx::query_as::<_, Card>(
            "SELECT id, type::text AS type_, title, description, cost, color::text, action_type::text, action_value FROM cards WHERE type = $1::card_type"
        )
        .bind(card_type)
        .fetch_all(&self.pool)
        .await?;
        Ok(cards)
    }

    async fn find_drawn_cards(&self, game_id: Uuid) -> Result<Vec<Uuid>, anyhow::Error> {
        let rows = sqlx::query_scalar::<_, Uuid>(
            "SELECT card_id FROM game_drawn_cards WHERE game_id = $1"
        )
        .bind(game_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows)
    }

    async fn mark_card_drawn(&self, game_id: Uuid, card_id: Uuid) -> Result<(), anyhow::Error> {
        sqlx::query(
            "INSERT INTO game_drawn_cards (game_id, card_id) VALUES ($1, $2) ON CONFLICT DO NOTHING"
        )
        .bind(game_id)
        .bind(card_id)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn clear_drawn_cards(&self, game_id: Uuid, card_type: &str) -> Result<(), anyhow::Error> {
        // Only clear drawn cards of a specific type
        sqlx::query(
            r#"
            DELETE FROM game_drawn_cards 
            WHERE game_id = $1 
            AND card_id IN (SELECT id FROM cards WHERE type = $2::card_type)
            "#
        )
        .bind(game_id)
        .bind(card_type)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    // Boveda Market
    async fn get_boveda_market(&self, game_id: Uuid) -> Result<Vec<GameBovedaMarket>, anyhow::Error> {
        let market = sqlx::query_as::<_, GameBovedaMarket>(
            r#"
            SELECT 
                bm.game_id, 
                bm.slot_index, 
                bm.card_id,
                c.title,
                c.description,
                c.cost,
                c.color::text,
                c.type::text AS type_,
                c.action_type::text,
                c.action_value
            FROM game_boveda_market bm
            JOIN cards c ON bm.card_id = c.id
            WHERE bm.game_id = $1
            ORDER BY bm.slot_index
            "#
        )
        .bind(game_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(market)
    }

    async fn set_boveda_market_slot(&self, game_id: Uuid, slot_index: i32, card_id: Uuid) -> Result<(), anyhow::Error> {
        sqlx::query(
            r#"
            INSERT INTO game_boveda_market (game_id, slot_index, card_id) 
            VALUES ($1, $2, $3)
            ON CONFLICT (game_id, slot_index) DO UPDATE SET card_id = EXCLUDED.card_id
            "#
        )
        .bind(game_id)
        .bind(slot_index)
        .bind(card_id)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
    
    async fn clear_boveda_market_slot(&self, game_id: Uuid, slot_index: i32) -> Result<(), anyhow::Error> {
        sqlx::query("DELETE FROM game_boveda_market WHERE game_id = $1 AND slot_index = $2")
            .bind(game_id)
            .bind(slot_index)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn find_all_participant_cards_in_game(&self, game_id: Uuid) -> Result<Vec<Uuid>, anyhow::Error> {
        let rows = sqlx::query_scalar::<_, Uuid>(
            "SELECT pc.card_id FROM participant_cards pc JOIN game_participants gp ON pc.participant_id = gp.id WHERE gp.game_id = $1"
        )
        .bind(game_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows)
    }

    async fn find_owner_of_card_title(&self, game_id: Uuid, card_title: &str) -> Result<Option<Uuid>, anyhow::Error> {
        let row: Option<Uuid> = sqlx::query_scalar(
            r#"
            SELECT pc.participant_id 
            FROM participant_cards pc 
            JOIN game_participants gp ON pc.participant_id = gp.id 
            JOIN cards c ON pc.card_id = c.id
            WHERE gp.game_id = $1 AND c.title = $2 
            LIMIT 1
            "#
        )
        .bind(game_id)
        .bind(card_title)
        .fetch_optional(&self.pool)
        .await?;
        Ok(row)
    }

    // Inventory
    async fn add_to_inventory(&self, participant_id: Uuid, card_id: Uuid) -> Result<ParticipantCard, anyhow::Error> {
        let pc = sqlx::query_as::<_, ParticipantCard>(
            r#"
            INSERT INTO participant_cards (participant_id, card_id)
            VALUES ($1, $2)
            RETURNING 
                id, participant_id, card_id, is_active, acquired_at,
                (SELECT title FROM cards WHERE id = $2) as title,
                (SELECT description FROM cards WHERE id = $2) as description,
                (SELECT type::text FROM cards WHERE id = $2) as type_,
                (SELECT color::text FROM cards WHERE id = $2) as color,
                (SELECT action_type::text FROM cards WHERE id = $2) as action_type,
                (SELECT action_value FROM cards WHERE id = $2) as action_value
            "#
        )
        .bind(participant_id)
        .bind(card_id)
        .fetch_one(&self.pool)
        .await?;
        Ok(pc)
    }

    async fn get_inventory(&self, participant_id: Uuid) -> Result<Vec<ParticipantCard>, anyhow::Error> {
        let cards = sqlx::query_as::<_, ParticipantCard>(
            r#"
            SELECT 
                pc.id, pc.participant_id, pc.card_id, pc.is_active, pc.acquired_at,
                c.title, c.description, c.type::text AS type_, c.color::text, c.action_type::text, c.action_value
            FROM participant_cards pc
            JOIN cards c ON pc.card_id = c.id
            WHERE pc.participant_id = $1
            ORDER BY pc.acquired_at DESC
            "#
        )
        .bind(participant_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(cards)
    }

    async fn remove_from_inventory(&self, inventory_id: Uuid) -> Result<(), anyhow::Error> {
        sqlx::query("DELETE FROM participant_cards WHERE id = $1")
            .bind(inventory_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    // History
    async fn log_usage(&self, game_id: Uuid, participant_id: Uuid, card_id: Uuid, description: Option<String>) -> Result<CardUsageHistory, anyhow::Error> {
         let log = sqlx::query_as::<_, CardUsageHistory>(
            r#"
            INSERT INTO card_usage_history (game_id, participant_id, card_id, action_description)
            VALUES ($1, $2, $3, $4)
            RETURNING 
                id, game_id, participant_id, card_id, action_description, used_at,
                (SELECT first_name FROM users u JOIN game_participants gp ON gp.user_id = u.id WHERE gp.id = $2) as first_name,
                (SELECT title FROM cards WHERE id = $3) as card_title
            "#
        )
        .bind(game_id)
        .bind(participant_id)
        .bind(card_id)
        .bind(description)
        .fetch_one(&self.pool)
        .await?;
        Ok(log)
    }

    // Seeding
    async fn ensure_cards_seeded(&self) -> Result<(), anyhow::Error> {
        let count_boveda: i64 = sqlx::query_scalar("SELECT count(*) FROM cards WHERE type = 'boveda'")
            .fetch_one(&self.pool)
            .await?;
        
        if count_boveda < 10 {
            sqlx::query(
                r#"
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
                "#
            ).execute(&self.pool).await?;
        }

        // Arca
        let count_arca: i64 = sqlx::query_scalar("SELECT count(*) FROM cards WHERE type = 'arca'")
            .fetch_one(&self.pool)
            .await?;
        if count_arca < 5 {
            sqlx::query(
                r#"
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
                ('arca', 'Cárcel', 'Ve directamente a la cárcel', 'move_to', -1),
                ('arca', 'Concurso de belleza', 'Has ganado el segundo premio. Cobra 10', 'receive_bank', 10),
                ('arca', 'Adoptas un perrito', 'Paga 50', 'pay_bank', 50),
                ('arca', 'Hospital', 'Facturas de hospital. Paga 100', 'pay_bank', 100),
                ('arca', 'Sal de la Cárcel', 'Sal de la carcel gratis. Conservar.', 'keep', 0);
                "#
            ).execute(&self.pool).await?;
        }

        // Fortuna
        let count_fortuna: i64 = sqlx::query_scalar("SELECT count(*) FROM cards WHERE type = 'fortuna'")
            .fetch_one(&self.pool)
            .await?;
        if count_fortuna < 5 {
            sqlx::query(
                r#"
                INSERT INTO cards (type, title, description, action_type, action_value) VALUES
                ('fortuna', 'Ferrocarril', 'Avanza al siguiente ferrocarril.', 'move_to', 0),
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
                "#
            ).execute(&self.pool).await?;
        }
        
        Ok(())
    }
}
