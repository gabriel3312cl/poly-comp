use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::{
    entities::Trade,
    repositories::TradeRepository,
};

pub struct PostgresTradeRepository {
    pool: PgPool,
}

impl PostgresTradeRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl TradeRepository for PostgresTradeRepository {
    async fn create(&self, trade: Trade) -> Result<Trade, anyhow::Error> {
        let created = sqlx::query_as::<_, Trade>(
            r#"
            INSERT INTO trades (
                game_id, initiator_id, target_id, 
                offer_cash, offer_properties, offer_cards,
                request_cash, request_properties, request_cards,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
            "#
        )
        .bind(trade.game_id)
        .bind(trade.initiator_id)
        .bind(trade.target_id)
        .bind(trade.offer_cash)
        .bind(trade.offer_properties)
        .bind(trade.offer_cards)
        .bind(trade.request_cash)
        .bind(trade.request_properties)
        .bind(trade.request_cards)
        .bind(trade.status)
        .fetch_one(&self.pool)
        .await?;
        Ok(created)
    }

    async fn find_by_game(&self, game_id: Uuid) -> Result<Vec<Trade>, anyhow::Error> {
        let trades = sqlx::query_as::<_, Trade>(
            "SELECT * FROM trades WHERE game_id = $1 ORDER BY created_at DESC"
        )
        .bind(game_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(trades)
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<Trade>, anyhow::Error> {
        let trade = sqlx::query_as::<_, Trade>(
            "SELECT * FROM trades WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;
        Ok(trade)
    }

    async fn update(&self, trade: Trade) -> Result<Trade, anyhow::Error> {
        let updated = sqlx::query_as::<_, Trade>(
            r#"
            UPDATE trades
            SET status = $1
            WHERE id = $2
            RETURNING *
            "#
        )
        .bind(trade.status)
        .bind(trade.id)
        .fetch_one(&self.pool)
        .await?;
        Ok(updated)
    }
}
