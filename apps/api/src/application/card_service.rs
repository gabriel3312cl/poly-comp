use std::sync::Arc;
use uuid::Uuid;
use tokio::sync::broadcast;
use rand::prelude::IndexedRandom; 
use crate::domain::{
    repositories::{CardRepository, TransactionRepository, GameRepository, ParticipantRepository},
    entities::{Card, ParticipantCard, GameBovedaMarket, Transaction}, 
    events::GameEvent, 
};
use bigdecimal::BigDecimal;

#[derive(Clone)]
pub struct CardService {
    card_repo: Arc<dyn CardRepository + Send + Sync>,
    transaction_repo: Arc<dyn TransactionRepository + Send + Sync>,
    _game_repo: Arc<dyn GameRepository + Send + Sync>,
    participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
    _tx: broadcast::Sender<GameEvent>,
}

impl CardService {
    pub fn new(
        card_repo: Arc<dyn CardRepository + Send + Sync>,
        transaction_repo: Arc<dyn TransactionRepository + Send + Sync>,
        game_repo: Arc<dyn GameRepository + Send + Sync>,
        participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
        tx: broadcast::Sender<GameEvent>,
    ) -> Self {
        Self { card_repo, transaction_repo, _game_repo: game_repo, participant_repo, _tx: tx }
    }

    // --- Standard Cards (Arca/Fortuna) ---

    pub async fn draw_card(&self, game_id: Uuid, user_id: Uuid, card_type: &str) -> Result<Card, anyhow::Error> {
        // 1. Get all cards of type
        // This is a naive implementation. Ideally we track deck state.
        // For V1: Pick random from "NOT DRAWN". If all drawn, reset.
        
        let all_cards = self.card_repo.find_by_type(card_type).await?;
        if all_cards.is_empty() {
             return Err(anyhow::anyhow!("No cards definition found for type {}", card_type));
        }

        let drawn_ids = self.card_repo.find_drawn_cards(game_id).await?;
        
        let available: Vec<&Card> = all_cards.iter().filter(|c| !drawn_ids.contains(&c.id)).collect();
        
        let card = if available.is_empty() {
            // Reshuffle: Clear drawn cards for this type
            self.card_repo.clear_drawn_cards(game_id, card_type).await?;
            // Pick random from all
            all_cards.choose(&mut rand::rng()).ok_or(anyhow::anyhow!("Empty deck"))?
        } else {
            available.choose(&mut rand::rng()).ok_or(anyhow::anyhow!("Empty deck"))?
        };

        // Mark as drawn
        self.card_repo.mark_card_drawn(game_id, card.id).await?;

        // 2. Check if "Keepable" (e.g. Sal de la Carcel)
        if card.action_type.as_deref() == Some("keep") {
            // Add to inventory
            // Find participant ID
            let detail = self.participant_repo.find_details_by_game_id(game_id).await?
                .into_iter().find(|p| p.user_id == user_id)
                .ok_or(anyhow::anyhow!("User not participant"))?;

             self.card_repo.add_to_inventory(detail.id, card.id).await?;
        }
        
        // Match standard functionality:
        // Execute financial actions immediately for simplicity if it's "pay_bank" or "receive_bank".
        if let Some(amt) = &card.action_value {
            if card.action_type.as_deref() == Some("receive_bank") {
                 let detail = self.participant_repo.find_details_by_game_id(game_id).await?
                    .into_iter().find(|p| p.user_id == user_id)
                    .ok_or(anyhow::anyhow!("User not participant"))?;

                 // Create Transaction
                 let _ = self.transaction_repo.execute_transfer(Transaction {
                     id: Uuid::new_v4(),
                     game_id,
                     from_participant_id: None,
                     to_participant_id: Some(detail.id),
                     amount: amt.clone(),
                     description: Some(card.title.clone()),
                     created_at: Some(time::OffsetDateTime::now_utc())
                 }).await?;
            } 
            else if card.action_type.as_deref() == Some("pay_bank") {
                 let detail = self.participant_repo.find_details_by_game_id(game_id).await?
                    .into_iter().find(|p| p.user_id == user_id)
                    .ok_or(anyhow::anyhow!("User not participant"))?;

                 let _ = self.transaction_repo.execute_transfer(Transaction {
                     id: Uuid::new_v4(),
                     game_id,
                     from_participant_id: Some(detail.id),
                     to_participant_id: None,
                     amount: amt.clone(),
                     description: Some(card.title.clone()),
                     created_at: Some(time::OffsetDateTime::now_utc())
                 }).await?;
             }
        }
        
        return Ok(card.clone());
    }

    // --- Boveda Market ---

    // Ensure 3 cards are in the market
    pub async fn refresh_boveda_market(&self, game_id: Uuid) -> Result<Vec<GameBovedaMarket>, anyhow::Error> {
        let current_market = self.card_repo.get_boveda_market(game_id).await?;
        let required_slots = vec![0, 1, 2];
        
        let filled_indices: Vec<i32> = current_market.iter().map(|m| m.slot_index).collect();
        let missing_indices: Vec<i32> = required_slots.into_iter().filter(|i| !filled_indices.contains(i)).collect();

        if missing_indices.is_empty() {
             return Ok(current_market);
        }
        
        tracing::debug!("Refilling Boveda Market for game {}. Missing slots: {:?}", game_id, missing_indices);

        let mut all_boveda = self.card_repo.find_by_type("boveda").await?;
        tracing::debug!("Found {} boveda cards in definition.", all_boveda.len());

        if all_boveda.is_empty() {
             tracing::warn!("Boveda cards missing. Attempting to seed default cards...");
             self.card_repo.ensure_cards_seeded().await?;
             all_boveda = self.card_repo.find_by_type("boveda").await?;
             
             if all_boveda.is_empty() {
                 tracing::error!("CRITICAL: Still no 'boveda' cards found after seeding!");
                 return Err(anyhow::anyhow!("No boveda cards type defined"));
             }
        }
        
        for slot in missing_indices {
             let random_card = all_boveda.choose(&mut rand::rng()).ok_or(anyhow::anyhow!("No boveda cards"))?;
             tracing::debug!("Assigning card {} to slot {}", random_card.title, slot);
             if let Err(e) = self.card_repo.set_boveda_market_slot(game_id, slot, random_card.id).await {
                 tracing::error!("Failed to set market slot {}: {}", slot, e);
                 return Err(e);
             }
        }

        self.card_repo.get_boveda_market(game_id).await
    }

    pub async fn get_market(&self, game_id: Uuid) -> Result<Vec<GameBovedaMarket>, anyhow::Error> {
        self.refresh_boveda_market(game_id).await
    }

    pub async fn buy_market_card(&self, game_id: Uuid, user_id: Uuid, slot_index: i32) -> Result<ParticipantCard, anyhow::Error> {
        // 1. Verify User is Player
        let detail = self.participant_repo.find_details_by_game_id(game_id).await?
             .into_iter().find(|p| p.user_id == user_id)
             .ok_or(anyhow::anyhow!("User not participant"))?;

        // 2. Get Card at Slot
        let market = self.card_repo.get_boveda_market(game_id).await?;
        let item = market.iter().find(|m| m.slot_index == slot_index).ok_or(anyhow::anyhow!("Slot empty"))?;
        
        let cost = item.cost.clone().unwrap_or(BigDecimal::from(0));

        // 3. Deduct Funds
        self.transaction_repo.execute_transfer(Transaction {
             id: Uuid::new_v4(),
             game_id,
             from_participant_id: Some(detail.id),
             to_participant_id: None,
             amount: cost,
             description: Some(format!("Bought Boveda Card: {}", item.title.as_deref().unwrap_or("Unknown"))),
             created_at: Some(time::OffsetDateTime::now_utc())
        }).await?;

        // 4. Add to Inventory
        let pc = self.card_repo.add_to_inventory(detail.id, item.card_id).await?;

        // 5. Remove from Market
        self.card_repo.clear_boveda_market_slot(game_id, slot_index).await?;
        
        // 6. Refresh Market immediately
        self.refresh_boveda_market(game_id).await?;

        Ok(pc)
    }

    pub async fn exchange_market_card(&self, game_id: Uuid, slot_index: i32) -> Result<Vec<GameBovedaMarket>, anyhow::Error> {
        // Remove current
        self.card_repo.clear_boveda_market_slot(game_id, slot_index).await?;
        // Refresh will fill it with new random
        self.refresh_boveda_market(game_id).await
    }

    // --- Inventory / Usage ---
    
    pub async fn get_inventory(&self, game_id: Uuid, user_id: Uuid) -> Result<Vec<ParticipantCard>, anyhow::Error> {
         let detail = self.participant_repo.find_details_by_game_id(game_id).await?
             .into_iter().find(|p| p.user_id == user_id)
             .ok_or(anyhow::anyhow!("User not participant"))?;
         
         self.card_repo.get_inventory(detail.id).await
    }

    pub async fn use_card(&self, game_id: Uuid, user_id: Uuid, inventory_id: Uuid) -> Result<(), anyhow::Error> {
         let detail = self.participant_repo.find_details_by_game_id(game_id).await?
             .into_iter().find(|p| p.user_id == user_id)
             .ok_or(anyhow::anyhow!("User not participant"))?;
        
         let inventory = self.card_repo.get_inventory(detail.id).await?;
         let card_item = inventory.iter().find(|pc| pc.id == inventory_id).ok_or(anyhow::anyhow!("Card not in inventory"))?;

         // Log usage
         self.card_repo.log_usage(game_id, detail.id, card_item.card_id, Some("Used card".to_string())).await?;

         // Handle effects (Naive implementation)
         let is_consumable = card_item.color.as_deref() == Some("red") 
                            || card_item.type_.as_deref() == Some("arca") 
                            || card_item.type_.as_deref() == Some("fortuna"); 

         if is_consumable {
             self.card_repo.remove_from_inventory(inventory_id).await?;
         }

         Ok(())
    }
}
