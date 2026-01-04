use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::DiceRoll;

pub struct PostgresDiceRepository {
    pool: PgPool,
}

impl PostgresDiceRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, game_id: Uuid, user_id: Uuid, dice_count: i32, dice_sides: i32, results: Vec<i32>, total: i32) -> Result<DiceRoll, anyhow::Error> {
        let rec = sqlx::query_as::<_, DiceRoll>(
            r#"
            INSERT INTO dice_rolls (game_id, user_id, dice_count, dice_sides, results, total)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            "#
        )
        .bind(game_id)
        .bind(user_id)
        .bind(dice_count)
        .bind(dice_sides)
        .bind(sqlx::types::Json(results))
        .bind(total)
        .fetch_one(&self.pool)
        .await?;
        
        Ok(rec)
    }

    pub async fn find_by_game_id(&self, game_id: Uuid) -> Result<Vec<crate::domain::entities::DiceRollHistory>, anyhow::Error> {
        let recs = sqlx::query_as::<_, crate::domain::entities::DiceRollHistory>(
            r#"
            SELECT d.*, u.first_name, u.last_name
            FROM dice_rolls d
            JOIN users u ON d.user_id = u.id
            WHERE d.game_id = $1
            ORDER BY d.created_at DESC
            LIMIT 50
            "#
        )
        .bind(game_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(recs)
    }
}
