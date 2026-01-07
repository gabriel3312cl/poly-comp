use crate::domain::events::GameEvent;
use tokio::sync::broadcast;
use std::sync::Arc;
use uuid::Uuid;
use crate::domain::entities::{DiceRoll}; 
use crate::infrastructure::postgres::dice_repository::PostgresDiceRepository;
use crate::domain::repositories::ParticipantRepository;
use crate::application::transaction_service::TransactionService;
use bigdecimal::BigDecimal;
use rand::Rng;

pub struct DiceService {
    dice_repo: Arc<PostgresDiceRepository>,
    participant_repo: Arc<dyn ParticipantRepository + Send + Sync>, 
    transaction_service: Arc<TransactionService>,
    tx: broadcast::Sender<GameEvent>,
}

impl DiceService {
    pub fn new(
        dice_repo: Arc<PostgresDiceRepository>, 
        participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
        transaction_service: Arc<TransactionService>,
        tx: broadcast::Sender<GameEvent>
    ) -> Self {
        Self { dice_repo, participant_repo, transaction_service, tx }
    }

    pub async fn roll_dice(&self, game_id: Uuid, user_id: Uuid, sides: i32, count: i32, auto_salary: bool) -> Result<DiceRoll, anyhow::Error> {
        let (results, total) = {
            let mut rng = rand::rng();
            let mut results = Vec::new();
            let mut total = 0;

            for _ in 0..count {
                let val = rng.random_range(1..=sides);
                results.push(val);
                total += val;
            }
            (results, total)
        };

        let roll = self.dice_repo.create(game_id, user_id, count, sides, results, total).await?;

        // --- Board Movement Logic ---
        // 1. Get Current Participant
        let members = self.participant_repo.find_by_game_id(game_id).await?;
        if let Some(participant) = members.into_iter().find(|p| p.user_id == user_id) {
            let old_pos = participant.position;
            let mut new_pos = old_pos + total;
            
            // Handle Wrap Around (Pass Go)
            if new_pos >= 40 {
                new_pos %= 40;
                // Trigger Auto Salary if enabled
                if auto_salary {
                    tracing::info!("Auto-Salary triggered for user {} in game {}", user_id, game_id);
                    let _ = self.transaction_service.transfer(
                        game_id, 
                        None, // From Bank 
                        Some(participant.id), 
                        BigDecimal::from(200), 
                        Some("Salary (Passed Go)".to_string())
                    ).await;
                }
            }
            
            // Handle "Vayase a la Carcel" (Space 30)
            if new_pos == 30 {
               new_pos = 10; // Jail
            }

            // Update DB
            self.participant_repo.update_position(game_id, user_id, new_pos).await?;

            // Broadcast Event with Position info
            // Fetch updated participant to get full struct
            if let Some(gp) = self.participant_repo.find_by_game_id(game_id).await?
                .into_iter().find(|p| p.user_id == user_id) 
            {
                 // Convert GameParticipant to Participant
                 let p = crate::domain::entities::Participant {
                     id: gp.id,
                     user_id: gp.user_id,
                     game_id: gp.game_id,
                     balance: gp.balance,
                     position: gp.position,
                     created_at: gp.joined_at,
                 };
                 let _ = self.tx.send(GameEvent::ParticipantUpdated(p));
            }
        }
        
        // Broadcast Dice Roll
        let _ = self.tx.send(GameEvent::DiceRolled(roll.clone()));

        Ok(roll)
    }

    pub async fn get_history(&self, game_id: Uuid) -> Result<Vec<crate::domain::entities::DiceRollHistory>, anyhow::Error> {
        self.dice_repo.find_by_game_id(game_id).await
    }
}
