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
