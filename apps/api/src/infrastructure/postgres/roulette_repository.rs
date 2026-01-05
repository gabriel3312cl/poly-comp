use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::{RouletteSpin, RouletteSpinHistory};

pub struct PostgresRouletteRepository {
    pool: PgPool,
}

impl PostgresRouletteRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, game_id: Uuid, user_id: Uuid, result_label: String, result_value: i32, result_type: String) -> Result<RouletteSpin, anyhow::Error> {
        let rec = sqlx::query_as::<_, RouletteSpin>(
            r#"
            INSERT INTO roulette_spins (game_id, user_id, result_label, result_value, result_type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#
        )
        .bind(game_id)
        .bind(user_id)
        .bind(result_label)
        .bind(result_value)
        .bind(result_type)
        .fetch_one(&self.pool)
        .await?;
        
        Ok(rec)
    }

    pub async fn find_by_game_id(&self, game_id: Uuid) -> Result<Vec<RouletteSpinHistory>, anyhow::Error> {
        let recs = sqlx::query_as::<_, RouletteSpinHistory>(
            r#"
            SELECT r.*, u.first_name, u.last_name
            FROM roulette_spins r
            JOIN users u ON r.user_id = u.id
            WHERE r.game_id = $1
            ORDER BY r.created_at DESC
            LIMIT 50
            "#
        )
        .bind(game_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(recs)
    }
}
