use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::{entities::User, repositories::UserRepository};

pub struct PostgresUserRepository {
    pool: PgPool,
}

impl PostgresUserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserRepository for PostgresUserRepository {
    async fn create(&self, user: User) -> Result<User, anyhow::Error> {
        let rec = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (id, username, first_name, last_name, password_hash)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#
        )
        .bind(user.id)
        .bind(user.username)
        .bind(user.first_name)
        .bind(user.last_name)
        .bind(user.password_hash)
        .fetch_one(&self.pool)
        .await?;

        Ok(rec)
    }

    async fn find_by_username(&self, username: &str) -> Result<Option<User>, anyhow::Error> {
        let rec = sqlx::query_as::<_, User>(
            r#"
            SELECT * FROM users WHERE username = $1
            "#
        )
        .bind(username)
        .fetch_optional(&self.pool)
        .await?;

        Ok(rec)
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, anyhow::Error> {
        let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(user)
    }

    async fn update(&self, user: User) -> Result<User, anyhow::Error> {
        let updated_user = sqlx::query_as::<_, User>(
            "UPDATE users SET first_name = $1, last_name = $2, password_hash = $3 WHERE id = $4 RETURNING *"
        )
        .bind(user.first_name)
        .bind(user.last_name)
        .bind(user.password_hash)
        .bind(user.id)
        .fetch_one(&self.pool)
        .await?;
        Ok(updated_user)
    }

    async fn update_last_logout(&self, id: Uuid, logout_at: time::OffsetDateTime) -> Result<(), anyhow::Error> {
        sqlx::query("UPDATE users SET last_logout_at = $1 WHERE id = $2")
            .bind(logout_at)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn delete(&self, id: Uuid) -> Result<(), anyhow::Error> {
        sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
