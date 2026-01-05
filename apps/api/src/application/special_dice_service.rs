use crate::domain::events::GameEvent;
use tokio::sync::broadcast;
use std::sync::Arc;
use uuid::Uuid;
use crate::infrastructure::postgres::special_dice_repository::PostgresSpecialDiceRepository;
use crate::domain::entities::{SpecialDiceRoll, SpecialDiceRollHistory};

pub struct SpecialDiceService {
    repo: Arc<PostgresSpecialDiceRepository>,
    tx: broadcast::Sender<GameEvent>,
}

impl SpecialDiceService {
    pub fn new(repo: Arc<PostgresSpecialDiceRepository>, tx: broadcast::Sender<GameEvent>) -> Self {
        Self { repo, tx }
    }

    pub async fn record_roll(
        &self, 
        game_id: Uuid, 
        user_id: Uuid, 
        die_name: String, 
        die_id: String, 
        face_label: String, 
        face_value: Option<i32>, 
        face_action: Option<String>
    ) -> Result<SpecialDiceRoll, anyhow::Error> {
        let result = self.repo.create(game_id, user_id, die_name, die_id, face_label, face_value, face_action).await;

        if let Ok(roll) = &result {
            let _ = self.tx.send(GameEvent::SpecialDiceRolled(roll.clone()));
        }

        result
    }

    pub async fn get_history(&self, game_id: Uuid) -> Result<Vec<SpecialDiceRollHistory>, anyhow::Error> {
        self.repo.find_by_game_id(game_id).await
    }
}
