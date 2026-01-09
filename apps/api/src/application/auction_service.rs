use std::sync::Arc;
use uuid::Uuid;
use bigdecimal::BigDecimal;
use crate::domain::{
    entities::Auction,
    repositories::{AuctionRepository, PropertyRepository, ParticipantRepository},
    events::GameEvent,
};
use crate::application::transaction_service::TransactionService;

pub struct AuctionService {
    auction_repo: Arc<dyn AuctionRepository + Send + Sync>,
    participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
    property_repo: Arc<dyn PropertyRepository + Send + Sync>, // To transfer
    transaction_service: Arc<TransactionService>,
    tx: tokio::sync::broadcast::Sender<GameEvent>,
}

impl AuctionService {
    pub fn new(
        auction_repo: Arc<dyn AuctionRepository + Send + Sync>,
        participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
        property_repo: Arc<dyn PropertyRepository + Send + Sync>,
        transaction_service: Arc<TransactionService>,
        tx: tokio::sync::broadcast::Sender<GameEvent>,
    ) -> Self {
        Self { auction_repo, participant_repo, property_repo, transaction_service, tx }
    }

    pub async fn get_active_auction(&self, game_id: Uuid) -> Result<Option<Auction>, anyhow::Error> {
        self.auction_repo.find_active_by_game(game_id).await
    }

    pub async fn start_auction(&self, game_id: Uuid, property_id: Uuid) -> Result<Auction, anyhow::Error> {
        // Check if active auction exists? Or allow multiple? 
        // Rules say "if bank auctions property..." usually one at a time.
        // Assuming one active auction per game is simpler for UI.
        if let Ok(Some(_)) = self.auction_repo.find_active_by_game(game_id).await {
            return Err(anyhow::anyhow!("There is already an active auction"));
        }

        let auction = Auction {
            id: Uuid::new_v4(),
            game_id,
            property_id,
            current_bid: BigDecimal::from(10), // Starts at 10m
            highest_bidder_id: None,
            status: "ACTIVE".to_string(),
            created_at: Some(time::OffsetDateTime::now_utc()),
            ends_at: None, // Or set timeout
        };

        let created = self.auction_repo.create(auction).await?;
        // Broadcast Event
        let _ = self.tx.send(GameEvent::AuctionUpdated(created.clone()));
        Ok(created)
    }

    pub async fn place_bid(&self, auction_id: Uuid, bidder_user_id: Uuid, amount: BigDecimal) -> Result<Auction, anyhow::Error> {
        let mut auction = self.auction_repo.find_by_id(auction_id).await?
            .ok_or_else(|| anyhow::anyhow!("Auction not found"))?;

        if auction.status != "ACTIVE" {
            return Err(anyhow::anyhow!("Auction is not active"));
        }

        // Get Participant ID
        let participants = self.participant_repo.find_by_game_id(auction.game_id).await?;
        let bidder = participants.iter().find(|p| p.user_id == bidder_user_id)
             .ok_or_else(|| anyhow::anyhow!("Participant not found"))?;

        // Check if amount > current_bid
        if amount <= auction.current_bid {
             return Err(anyhow::anyhow!("Bid must be higher than current"));
        }

        // Check balance (Participant must have money?)
        if bidder.balance < amount {
             // Rule says "can only participate if has min 10m", but usually also needs to afford bid? 
             // Or they can mortgage during auction? 
             // Let's enforce balance >= bid for safety.
             return Err(anyhow::anyhow!("Insufficient funds for this bid"));
        }

        auction.current_bid = amount;
        auction.highest_bidder_id = Some(bidder.id);
        
        let updated = self.auction_repo.update(auction).await?;
        // Broadcast
        let _ = self.tx.send(GameEvent::AuctionUpdated(updated.clone()));
        Ok(updated)
    }

    pub async fn end_auction(&self, auction_id: Uuid) -> Result<Auction, anyhow::Error> {
        let mut auction = self.auction_repo.find_by_id(auction_id).await?
            .ok_or_else(|| anyhow::anyhow!("Auction not found"))?;
        
        if auction.status != "ACTIVE" {
             return Err(anyhow::anyhow!("Auction not active"));
        }

        // Finalize
        if let Some(winner_id) = auction.highest_bidder_id {
            // Deduct Money
            self.transaction_service.transfer(
                auction.game_id,
                Some(winner_id),
                None,
                auction.current_bid.clone(),
                Some("Won Auction".to_string())
            ).await?;

            // Transfer Property
            // Ensure any stale ownership is removed first to avoid UNIQUE constraint violations
            self.property_repo.delete_ownership(auction.game_id, auction.property_id).await?;

            let pp = crate::domain::entities::ParticipantProperty {
                id: Uuid::new_v4(),
                game_id: auction.game_id,
                participant_id: winner_id,
                property_id: auction.property_id,
                is_mortgaged: false,
                house_count: 0,
                hotel_count: 0,
                property_name: None,
                group_color: None,
            };
            self.property_repo.assign_property(pp).await?;
        }

        auction.status = "FINISHED".to_string();
        auction.ends_at = Some(time::OffsetDateTime::now_utc());
        
        let updated = self.auction_repo.update(auction).await?;
        let _ = self.tx.send(GameEvent::AuctionUpdated(updated.clone()));
        Ok(updated)
    }
}
