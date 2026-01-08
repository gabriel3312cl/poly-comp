use std::sync::Arc;
use uuid::Uuid;
use crate::domain::{
    entities::Trade,
    repositories::{TradeRepository, PropertyRepository, CardRepository, ParticipantRepository},
    events::GameEvent,
};
use crate::application::transaction_service::TransactionService;

pub struct TradeService {
    trade_repo: Arc<dyn TradeRepository + Send + Sync>,
    property_repo: Arc<dyn PropertyRepository + Send + Sync>,
    _card_repo: Arc<dyn CardRepository + Send + Sync>, 
    participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
    transaction_service: Arc<TransactionService>,
    tx: tokio::sync::broadcast::Sender<GameEvent>,
}

impl TradeService {
    pub fn new(
        trade_repo: Arc<dyn TradeRepository + Send + Sync>,
        property_repo: Arc<dyn PropertyRepository + Send + Sync>,
        _card_repo: Arc<dyn CardRepository + Send + Sync>,
        participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
        transaction_service: Arc<TransactionService>,
        tx: tokio::sync::broadcast::Sender<GameEvent>,
    ) -> Self {
        Self { trade_repo, property_repo, _card_repo, participant_repo, transaction_service, tx }
    }

    pub async fn create_trade(&self, trade: Trade) -> Result<Trade, anyhow::Error> {
        let created = self.trade_repo.create(trade).await?;
        let _ = self.tx.send(GameEvent::TradeUpdated(created.clone()));
        Ok(created)
    }

    pub async fn accept_trade(&self, trade_id: Uuid, user_id: Uuid) -> Result<Trade, anyhow::Error> {
        let mut trade = self.trade_repo.find_by_id(trade_id).await?
            .ok_or_else(|| anyhow::anyhow!("Trade not found"))?;

        if trade.status != "PENDING" {
            return Err(anyhow::anyhow!("Trade is not pending"));
        }

        // Verify user is the target
        let participants = self.participant_repo.find_by_game_id(trade.game_id).await?;
        let target_p = participants.iter().find(|p| p.user_id == user_id)
            .ok_or_else(|| anyhow::anyhow!("Participant not found"))?;
        
        if trade.target_id != target_p.id {
             return Err(anyhow::anyhow!("You are not the target of this trade"));
        }

        // Execute Transfers
        // 1. Cash (Initiator pays Offer Cash to Target)
        if trade.offer_cash > bigdecimal::BigDecimal::from(0) {
            self.transaction_service.transfer(
                trade.game_id, Some(trade.initiator_id), Some(trade.target_id), trade.offer_cash.clone(), Some("Trade Cash".to_string())
            ).await?;
        }
        // 2. Request Cash (Target pays Request Cash to Initiator)
         if trade.request_cash > bigdecimal::BigDecimal::from(0) {
            self.transaction_service.transfer(
                trade.game_id, Some(trade.target_id), Some(trade.initiator_id), trade.request_cash.clone(), Some("Trade Cash".to_string())
            ).await?;
        }

        // 3. Properties (Offer Properties -> Target)
        if let Some(props) = &trade.offer_properties {
             for prop_id in props.0.iter() {
                 self.property_repo.transfer_property(trade.game_id, *prop_id, trade.target_id).await?;
             }
        }
        // 4. Request Properties (Target Properties -> Initiator)
        if let Some(props) = &trade.request_properties {
             for prop_id in props.0.iter() {
                 self.property_repo.transfer_property(trade.game_id, *prop_id, trade.initiator_id).await?;
             }
        }
        
        trade.status = "ACCEPTED".to_string();
        let updated = self.trade_repo.update(trade).await?;
        let _ = self.tx.send(GameEvent::TradeUpdated(updated.clone()));
        Ok(updated)
    }

    pub async fn reject_trade(&self, trade_id: Uuid, _user_id: Uuid) -> Result<Trade, anyhow::Error> {
        let mut trade = self.trade_repo.find_by_id(trade_id).await?
            .ok_or_else(|| anyhow::anyhow!("Trade not found"))?;

        // Verify user is target OR initiator (initiator can cancel)
        // ... Logic checks ...

        trade.status = "REJECTED".to_string();
        let updated = self.trade_repo.update(trade).await?;
        let _ = self.tx.send(GameEvent::TradeUpdated(updated.clone()));
        Ok(updated)
    }
}
