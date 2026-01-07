use std::sync::Arc;
use uuid::Uuid;
use bigdecimal::BigDecimal;
use crate::domain::{
    entities::Transaction,
    repositories::{TransactionRepository, ParticipantRepository, CardRepository},
    events::GameEvent,
};
use tokio::sync::broadcast;

pub struct TransactionService {
    transaction_repo: Arc<dyn TransactionRepository + Send + Sync>,
    _participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
    card_repo: Arc<dyn CardRepository + Send + Sync>,
    tx: broadcast::Sender<GameEvent>,
}

impl TransactionService {
    pub fn new(
        transaction_repo: Arc<dyn TransactionRepository + Send + Sync>,
        participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
        card_repo: Arc<dyn CardRepository + Send + Sync>,
        tx: broadcast::Sender<GameEvent>,
    ) -> Self {
        Self { transaction_repo, _participant_repo: participant_repo, card_repo, tx }
    }

    pub async fn transfer(&self, game_id: Uuid, from_pid: Option<Uuid>, to_pid: Option<Uuid>, amount: BigDecimal, description: Option<String>) -> Result<Transaction, anyhow::Error> {
        // Balance validation removed to allow negative balances (debt)
        
        let final_from = from_pid;
        let mut final_to = to_pid;
        let mut final_amount = amount.clone();
        
        // --- El Banco Check ---
        // We need to resolve "El Banco" owner.
        // If from_pid or to_pid involves Bank or Owner, we apply rules.
        
        if let Ok(Some(bank_owner_pid)) = self.card_repo.find_owner_of_card_title(game_id, "El Banco").await {
            
            // Case 1: Payment TO Bank (from_pid = Some, to_pid = None)
            if from_pid.is_some() && to_pid.is_none() {
                if from_pid != Some(bank_owner_pid) {
                    // Rule: Other player pays Bank -> Redirect to Owner.
                    final_to = Some(bank_owner_pid);
                    
                    // Side-effect: Also add to Jackpot?
                    // "los pagos... van ademas del jackpot, a la cuenta del jugador"
                    // We need a secondary transaction for Jackpot injection.
                    // Doing it async/fire-and-forget.
                    let tx_repo = self.transaction_repo.clone();
                    let amt = amount.clone();
                    tokio::spawn(async move {
                         let _ = tx_repo.execute_transfer(Transaction {
                             id: Uuid::new_v4(),
                             game_id,
                             from_participant_id: None, 
                             to_participant_id: None, // To Jackpot
                             amount: amt,
                             description: Some("El Banco Bonus (Inflation)".to_string()),
                             created_at: Some(time::OffsetDateTime::now_utc())
                         }).await;
                    });

                } else {
                    // Rule: Owner pays Bank -> Immune (Cost 0) BUT add to Jackpot.
                    final_amount = BigDecimal::from(0);
                    
                    // Add original amount to Jackpot
                    let tx_repo = self.transaction_repo.clone();
                    let amt = amount.clone();
                    tokio::spawn(async move {
                         let _ = tx_repo.execute_transfer(Transaction {
                             id: Uuid::new_v4(),
                             game_id,
                             from_participant_id: None,
                             to_participant_id: None, // To Jackpot
                             amount: amt,
                             description: Some("El Banco Owner Payment (Inflation)".to_string()),
                             created_at: Some(time::OffsetDateTime::now_utc())
                         }).await;
                    });
                }
            }
        }

        let tx = Transaction {
            id: Uuid::new_v4(),
            game_id,
            from_participant_id: final_from,
            to_participant_id: final_to,
            amount: final_amount,
            description,
            created_at: Some(time::OffsetDateTime::now_utc()),
        };

        let result = self.transaction_repo.execute_transfer(tx).await;
        
        if let Ok(transaction) = &result {
            // Broadcast event. We ignore errors if nobody is listening.
            let _ = self.tx.send(GameEvent::TransactionCreated(transaction.clone()));
        }

        result
    }

    pub async fn delete_transaction(&self, tx_id: Uuid) -> Result<(), anyhow::Error> {
        // Just delete for now.
        // TODO: Broadcast undo? For now just delete.
        self.transaction_repo.delete(tx_id).await
    }
    pub async fn get_transactions(&self, game_id: Uuid) -> Result<Vec<Transaction>, anyhow::Error> {
        self.transaction_repo.find_by_game(game_id).await
    }

    pub async fn claim_jackpot(&self, game_id: Uuid, user_id: Uuid) -> Result<Transaction, anyhow::Error> {
        let result = self.transaction_repo.claim_jackpot(game_id, user_id).await;

        if let Ok(transaction) = &result {
             // Broadcast event
             let _ = self.tx.send(GameEvent::TransactionCreated(transaction.clone()));
        }

        result
    }
}
