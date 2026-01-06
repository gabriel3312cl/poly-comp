use async_trait::async_trait;
use uuid::Uuid;
use crate::domain::entities::{GameSession, GameParticipant, Transaction, User, ParticipantDetail};

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait UserRepository {
    async fn create(&self, user: User) -> Result<User, anyhow::Error>;
    async fn find_by_username(&self, username: &str) -> Result<Option<User>, anyhow::Error>;
    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, anyhow::Error>;
    async fn update(&self, user: User) -> Result<User, anyhow::Error>;
    async fn update_last_logout(&self, id: Uuid, logout_at: time::OffsetDateTime) -> Result<(), anyhow::Error>;
    async fn delete(&self, id: Uuid) -> Result<(), anyhow::Error>;
}

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait GameRepository {
    async fn create(&self, game: GameSession) -> Result<GameSession, anyhow::Error>;
    async fn find_by_id(&self, id: Uuid) -> Result<Option<GameSession>, anyhow::Error>;
    async fn find_by_code(&self, code: &str) -> Result<Option<GameSession>, anyhow::Error>;
    async fn find_hosted_by_user(&self, user_id: Uuid) -> Result<Vec<GameSession>, anyhow::Error>;
    async fn find_played_by_user(&self, user_id: Uuid) -> Result<Vec<GameSession>, anyhow::Error>;
    async fn update(&self, game: GameSession) -> Result<GameSession, anyhow::Error>;
    async fn delete(&self, id: Uuid) -> Result<(), anyhow::Error>;
}

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait ParticipantRepository {
    async fn add_participant(&self, participant: GameParticipant) -> Result<GameParticipant, anyhow::Error>;
    async fn find_by_game_id(&self, game_id: Uuid) -> Result<Vec<GameParticipant>, anyhow::Error>;
    async fn find_details_by_game_id(&self, game_id: Uuid) -> Result<Vec<ParticipantDetail>, anyhow::Error>;
    async fn remove_participant(&self, game_id: Uuid, user_id: Uuid) -> Result<(), anyhow::Error>;
}

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait TransactionRepository {
    async fn find_by_game(&self, game_id: Uuid) -> Result<Vec<Transaction>, anyhow::Error>;
    async fn delete(&self, id: Uuid) -> Result<(), anyhow::Error>;
    async fn execute_transfer(
        &self, 
        transaction: Transaction
    ) -> Result<Transaction, anyhow::Error>;
    async fn claim_jackpot(&self, game_id: Uuid, user_id: Uuid) -> Result<Transaction, anyhow::Error>;
}

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait CardRepository {

    async fn find_by_type(&self, card_type: &str) -> Result<Vec<crate::domain::entities::Card>, anyhow::Error>;
    async fn find_drawn_cards(&self, game_id: Uuid) -> Result<Vec<Uuid>, anyhow::Error>;
    async fn mark_card_drawn(&self, game_id: Uuid, card_id: Uuid) -> Result<(), anyhow::Error>;
    async fn clear_drawn_cards(&self, game_id: Uuid, card_type: &str) -> Result<(), anyhow::Error>; // Reshuffle
    
    // Boveda Market
    async fn get_boveda_market(&self, game_id: Uuid) -> Result<Vec<crate::domain::entities::GameBovedaMarket>, anyhow::Error>;
    async fn set_boveda_market_slot(&self, game_id: Uuid, slot_index: i32, card_id: Uuid) -> Result<(), anyhow::Error>;
    async fn clear_boveda_market_slot(&self, game_id: Uuid, slot_index: i32) -> Result<(), anyhow::Error>;
    async fn find_all_participant_cards_in_game(&self, game_id: Uuid) -> Result<Vec<Uuid>, anyhow::Error>;
    async fn find_owner_of_card_title(&self, game_id: Uuid, card_title: &str) -> Result<Option<Uuid>, anyhow::Error>; // Returns participant_id

    // Inventory
    async fn add_to_inventory(&self, participant_id: Uuid, card_id: Uuid) -> Result<crate::domain::entities::ParticipantCard, anyhow::Error>;
    async fn get_inventory(&self, participant_id: Uuid) -> Result<Vec<crate::domain::entities::ParticipantCard>, anyhow::Error>;
    async fn remove_from_inventory(&self, inventory_id: Uuid) -> Result<(), anyhow::Error>;

    // History
    async fn log_usage(&self, game_id: Uuid, participant_id: Uuid, card_id: Uuid, description: Option<String>) -> Result<crate::domain::entities::CardUsageHistory, anyhow::Error>;
    
    // Seeding
    async fn ensure_cards_seeded(&self) -> Result<(), anyhow::Error>;
}
