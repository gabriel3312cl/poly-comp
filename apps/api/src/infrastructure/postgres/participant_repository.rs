use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;
// use bigdecimal::BigDecimal;
use crate::domain::{entities::GameParticipant, repositories::ParticipantRepository};

pub struct PostgresParticipantRepository {
    pool: PgPool,
}

impl PostgresParticipantRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ParticipantRepository for PostgresParticipantRepository {
    async fn add_participant(&self, participant: GameParticipant) -> Result<GameParticipant, anyhow::Error> {
        let rec = sqlx::query_as::<_, GameParticipant>(
            r#"
            INSERT INTO game_participants (id, game_id, user_id, balance)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#
        )
        .bind(participant.id)
        .bind(participant.game_id)
        .bind(participant.user_id)
        .bind(participant.balance)
        .fetch_one(&self.pool)
        .await?;

        Ok(rec)
    }

    async fn find_by_game_id(&self, game_id: Uuid) -> Result<Vec<GameParticipant>, anyhow::Error> {
        let participants = sqlx::query_as::<_, GameParticipant>("SELECT * FROM game_participants WHERE game_id = $1")
            .bind(game_id)
            .fetch_all(&self.pool)
            .await?;
        Ok(participants)
    }

    async fn remove_participant(&self, game_id: Uuid, user_id: Uuid) -> Result<(), anyhow::Error> {
        sqlx::query("DELETE FROM game_participants WHERE game_id = $1 AND user_id = $2")
            .bind(game_id)
            .bind(user_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
