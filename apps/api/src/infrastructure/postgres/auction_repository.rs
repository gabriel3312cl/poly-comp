use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::{
    entities::Auction,
    repositories::AuctionRepository,
};

pub struct PostgresAuctionRepository {
    pool: PgPool,
}

impl PostgresAuctionRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl AuctionRepository for PostgresAuctionRepository {
    async fn create(&self, auction: Auction) -> Result<Auction, anyhow::Error> {
        let created = sqlx::query_as::<_, Auction>(
            r#"
            INSERT INTO auctions (game_id, property_id, current_bid, highest_bidder_id, status, ends_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            "#
        )
        .bind(auction.game_id)
        .bind(auction.property_id)
        .bind(auction.current_bid)
        .bind(auction.highest_bidder_id)
        .bind(auction.status)
        .bind(auction.ends_at)
        .fetch_one(&self.pool)
        .await?;
        Ok(created)
    }

    async fn find_by_game(&self, game_id: Uuid) -> Result<Vec<Auction>, anyhow::Error> {
        let auctions = sqlx::query_as::<_, Auction>(
            "SELECT * FROM auctions WHERE game_id = $1 ORDER BY created_at DESC"
        )
        .bind(game_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(auctions)
    }

    async fn find_active_by_game(&self, game_id: Uuid) -> Result<Option<Auction>, anyhow::Error> {
        let auction = sqlx::query_as::<_, Auction>(
            "SELECT * FROM auctions WHERE game_id = $1 AND status = 'ACTIVE' LIMIT 1"
        )
        .bind(game_id)
        .fetch_optional(&self.pool)
        .await?;
        Ok(auction)
    }

    async fn update(&self, auction: Auction) -> Result<Auction, anyhow::Error> {
        let updated = sqlx::query_as::<_, Auction>(
            r#"
            UPDATE auctions
            SET current_bid = $1, highest_bidder_id = $2, status = $3, ends_at = $4
            WHERE id = $5
            RETURNING *
            "#
        )
        .bind(auction.current_bid)
        .bind(auction.highest_bidder_id)
        .bind(auction.status)
        .bind(auction.ends_at)
        .bind(auction.id)
        .fetch_one(&self.pool)
        .await?;
        Ok(updated)
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<Auction>, anyhow::Error> {
        let auction = sqlx::query_as::<_, Auction>(
            "SELECT * FROM auctions WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;
        Ok(auction)
    }
}
