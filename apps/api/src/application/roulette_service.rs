use crate::domain::events::GameEvent;
use tokio::sync::broadcast;
use std::sync::Arc;
use uuid::Uuid;
use crate::infrastructure::postgres::roulette_repository::PostgresRouletteRepository;
use crate::domain::entities::{RouletteSpin, RouletteSpinHistory};

pub struct RouletteService {
    repo: Arc<PostgresRouletteRepository>,
    tx: broadcast::Sender<GameEvent>,
}

impl RouletteService {
    pub fn new(repo: Arc<PostgresRouletteRepository>, tx: broadcast::Sender<GameEvent>) -> Self {
        Self { repo, tx }
    }

    pub async fn record_spin(&self, game_id: Uuid, user_id: Uuid, result_label: String, result_value: i32, result_type: String) -> Result<RouletteSpin, anyhow::Error> {
        let result = self.repo.create(game_id, user_id, result_label, result_value, result_type).await;
        
        if let Ok(spin) = &result {
            let _ = self.tx.send(GameEvent::RouletteSpun(spin.clone()));
        }

        result
    }

    pub async fn get_history(&self, game_id: Uuid) -> Result<Vec<RouletteSpinHistory>, anyhow::Error> {
        self.repo.find_by_game_id(game_id).await
    }
}
