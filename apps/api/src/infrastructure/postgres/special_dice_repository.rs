use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::entities::{SpecialDiceRoll, SpecialDiceRollHistory};

pub struct PostgresSpecialDiceRepository {
    pool: PgPool,
}

impl PostgresSpecialDiceRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(
        &self, 
        game_id: Uuid, 
        user_id: Uuid, 
        die_name: String, 
        die_id: String, 
        face_label: String, 
        face_value: Option<i32>, 
        face_action: Option<String>
    ) -> Result<SpecialDiceRoll, anyhow::Error> {
        let rec = sqlx::query_as::<_, SpecialDiceRoll>(
            r#"
            INSERT INTO special_dice_rolls (game_id, user_id, die_name, die_id, face_label, face_value, face_action)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#
        )
        .bind(game_id)
        .bind(user_id)
        .bind(die_name)
        .bind(die_id)
        .bind(face_label)
        .bind(face_value)
        .bind(face_action)
        .fetch_one(&self.pool)
        .await?;
        
        Ok(rec)
    }

    pub async fn find_by_game_id(&self, game_id: Uuid) -> Result<Vec<SpecialDiceRollHistory>, anyhow::Error> {
        let recs = sqlx::query_as::<_, SpecialDiceRollHistory>(
            r#"
            SELECT s.*, u.first_name, u.last_name
            FROM special_dice_rolls s
            JOIN users u ON s.user_id = u.id
            WHERE s.game_id = $1
            ORDER BY s.created_at DESC
            LIMIT 50
            "#
        )
        .bind(game_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(recs)
    }
}
