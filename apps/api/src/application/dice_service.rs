use std::sync::Arc;
use uuid::Uuid;
use crate::domain::entities::DiceRoll;
use crate::infrastructure::postgres::dice_repository::PostgresDiceRepository;
use rand::Rng;

pub struct DiceService {
    dice_repo: Arc<PostgresDiceRepository>,
}

impl DiceService {
    pub fn new(dice_repo: Arc<PostgresDiceRepository>) -> Self {
        Self { dice_repo }
    }

    pub async fn roll_dice(&self, game_id: Uuid, user_id: Uuid, sides: i32, count: i32) -> Result<DiceRoll, anyhow::Error> {
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
        Ok(roll)
    }

    pub async fn get_history(&self, game_id: Uuid) -> Result<Vec<crate::domain::entities::DiceRollHistory>, anyhow::Error> {
        self.dice_repo.find_by_game_id(game_id).await
    }
}
