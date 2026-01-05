use std::sync::Arc;
use uuid::Uuid;
use crate::infrastructure::postgres::roulette_repository::PostgresRouletteRepository;
use crate::domain::entities::{RouletteSpin, RouletteSpinHistory};

pub struct RouletteService {
    repo: Arc<PostgresRouletteRepository>,
}

impl RouletteService {
    pub fn new(repo: Arc<PostgresRouletteRepository>) -> Self {
        Self { repo }
    }

    pub async fn record_spin(&self, game_id: Uuid, user_id: Uuid, result_label: String, result_value: i32, result_type: String) -> Result<RouletteSpin, anyhow::Error> {
        self.repo.create(game_id, user_id, result_label, result_value, result_type).await
    }

    pub async fn get_history(&self, game_id: Uuid) -> Result<Vec<RouletteSpinHistory>, anyhow::Error> {
        self.repo.find_by_game_id(game_id).await
    }
}
