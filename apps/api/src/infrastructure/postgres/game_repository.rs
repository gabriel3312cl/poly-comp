use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::{entities::GameSession, repositories::GameRepository};

pub struct PostgresGameRepository {
    pool: PgPool,
}

impl PostgresGameRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl GameRepository for PostgresGameRepository {
    async fn create(&self, game: GameSession) -> Result<GameSession, anyhow::Error> {
        let rec = sqlx::query_as::<_, GameSession>(
            r#"
            INSERT INTO game_sessions (id, host_user_id, name, status, created_at, ended_at, code)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#
        )
        .bind(game.id)
        .bind(game.host_user_id)
        .bind(game.name)
        .bind(game.status)
        .bind(game.created_at)
        .bind(game.ended_at)
        .bind(game.code)
        .fetch_one(&self.pool)
        .await?;

        Ok(rec)
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<GameSession>, anyhow::Error> {
        let game = sqlx::query_as::<_, GameSession>("SELECT * FROM game_sessions WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(game)
    }

    async fn find_by_code(&self, code: &str) -> Result<Option<GameSession>, anyhow::Error> {
        let game = sqlx::query_as::<_, GameSession>("SELECT * FROM game_sessions WHERE code = $1")
            .bind(code)
            .fetch_optional(&self.pool)
            .await?;
        Ok(game)
    }

    async fn update(&self, game: GameSession) -> Result<GameSession, anyhow::Error> {
        let updated = sqlx::query_as::<_, GameSession>(
            r#"
            UPDATE game_sessions 
            SET host_user_id = $1, name = $2, status = $3, ended_at = $4
            WHERE id = $5
            RETURNING *
            "#
        )
        .bind(game.host_user_id)
        .bind(game.name)
        .bind(game.status)
        .bind(game.ended_at)
        .bind(game.id)
        .fetch_one(&self.pool)
        .await?;
        Ok(updated)
    }

    async fn delete(&self, id: Uuid) -> Result<(), anyhow::Error> {
        sqlx::query("DELETE FROM game_sessions WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
