use std::sync::Arc;
use uuid::Uuid;
use bigdecimal::BigDecimal;
use rand::{rng, Rng};
use rand::distr::Alphanumeric;
use crate::domain::{
    entities::{GameSession, GameParticipant, GameStatus},
    repositories::{GameRepository, ParticipantRepository},
};

pub struct GameService {
    game_repo: Arc<dyn GameRepository + Send + Sync>,
    participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
    tx: tokio::sync::broadcast::Sender<crate::domain::events::GameEvent>,
}

impl GameService {
    pub fn new(
        game_repo: Arc<dyn GameRepository + Send + Sync>,
        participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
        tx: tokio::sync::broadcast::Sender<crate::domain::events::GameEvent>,
    ) -> Self {
        Self { game_repo, participant_repo, tx }
    }

    pub async fn create_game(&self, host_user_id: Uuid) -> Result<GameSession, anyhow::Error> {
        // Generate random 4-char code
        let code: String = rng()
            .sample_iter(&Alphanumeric)
            .take(4)
            .map(char::from)
            .collect();
        let code = code.to_uppercase(); // Ensure uppercase for better UX

        let game = GameSession {
            id: Uuid::new_v4(),
            code,
            host_user_id,
            name: "New Monopoly Game".to_string(), // Default name
            status: GameStatus::WAITING.to_string(),
            jackpot_balance: BigDecimal::from(0),
            created_at: Some(time::OffsetDateTime::now_utc()),
            ended_at: None,
        };

        let created_game = self.game_repo.create(game).await?;

        // Host automatically joins
        self.join_game(created_game.id, host_user_id).await?;

        Ok(created_game)
    }

    pub async fn join_game_with_code(&self, code: String, user_id: Uuid) -> Result<GameParticipant, anyhow::Error> {
        let game = self.game_repo.find_by_code(&code).await?
            .ok_or_else(|| anyhow::anyhow!("Game not found with code {}", code))?;
        
        // Reuse logic by calling join_game with ID
        self.join_game(game.id, user_id).await
    }

    pub async fn join_game(&self, game_id: Uuid, user_id: Uuid) -> Result<GameParticipant, anyhow::Error> {
        // Check if game exists and is in correct state
        let game = self.game_repo.find_by_id(game_id).await?
            .ok_or_else(|| anyhow::anyhow!("Game not found"))?;

        if game.status != GameStatus::WAITING.to_string() {
            return Err(anyhow::anyhow!("Game is not open for joining"));
        }

        // Check if user is already a participant
        let participants = self.participant_repo.find_by_game_id(game_id).await?;
        if participants.iter().any(|p| p.user_id == user_id) {
             return Err(anyhow::anyhow!("User is already a participant in this game"));
        }

        let participant = GameParticipant {
            id: Uuid::new_v4(),
            game_id,
            user_id,
            balance: BigDecimal::from(1500), // Default start money
            position: 0,
            joined_at: None,
        };

        self.participant_repo.add_participant(participant).await
    }

    pub async fn leave_game(&self, game_id: Uuid, user_id: Uuid) -> Result<(), anyhow::Error> {
         let game = self.game_repo.find_by_id(game_id).await?
            .ok_or_else(|| anyhow::anyhow!("Game not found"))?;
        
        // Allowed to leave if waiting? Or anytime?
        // User said "join and leave the game if the user desides".
        if game.status == GameStatus::FINISHED.to_string() {
             return Err(anyhow::anyhow!("Cannot leave chunks of a finished game"));
        }

        self.participant_repo.remove_participant(game_id, user_id).await
    }

    pub async fn update_game(&self, game_id: Uuid, user_id: Uuid, name: Option<String>, status: Option<String>) -> Result<GameSession, anyhow::Error> {
        let mut game = self.game_repo.find_by_id(game_id).await?
            .ok_or_else(|| anyhow::anyhow!("Game not found"))?;

        if game.host_user_id != user_id {
            return Err(anyhow::anyhow!("Only host can update game"));
        }

        if let Some(n) = name {
            game.name = n;
        }
        if let Some(s) = status {
             game.status = s;
             // If status is FINISHED, maybe set ended_at?
             if game.status == GameStatus::FINISHED.to_string() {
                 game.ended_at = Some(time::OffsetDateTime::now_utc());
             }
        }
        
        self.game_repo.update(game).await
    }

    pub async fn delete_game(&self, game_id: Uuid, user_id: Uuid) -> Result<(), anyhow::Error> {
         let game = self.game_repo.find_by_id(game_id).await?
            .ok_or_else(|| anyhow::anyhow!("Game not found"))?;

        if game.host_user_id != user_id {
             return Err(anyhow::anyhow!("Only host can delete game"));
        }

        self.game_repo.delete(game_id).await
    }
    pub async fn get_game(&self, game_id: Uuid) -> Result<GameSession, anyhow::Error> {
        self.game_repo.find_by_id(game_id).await?
            .ok_or_else(|| anyhow::anyhow!("Game not found"))
    }



    pub async fn get_participants_with_details(&self, game_id: Uuid) -> Result<Vec<crate::domain::entities::ParticipantDetail>, anyhow::Error> {
        self.participant_repo.find_details_by_game_id(game_id).await
    }

    pub async fn get_hosted_games(&self, user_id: Uuid) -> Result<Vec<GameSession>, anyhow::Error> {
        self.game_repo.find_hosted_by_user(user_id).await
    }

    pub async fn get_played_games(&self, user_id: Uuid) -> Result<Vec<GameSession>, anyhow::Error> {
        self.game_repo.find_played_by_user(user_id).await
    }

    pub async fn update_participant_position(&self, game_id: Uuid, user_id: Uuid, position: i32) -> Result<(), anyhow::Error> {
        // Validate game exists
        let _ = self.game_repo.find_by_id(game_id).await?
            .ok_or_else(|| anyhow::anyhow!("Game not found"))?;

        // Update Position
        self.participant_repo.update_position(game_id, user_id, position).await?;

        // Broadcast Event
        if let Some(gp) = self.participant_repo.find_by_game_id(game_id).await?
            .into_iter().find(|p| p.user_id == user_id) 
        {
             // Convert GameParticipant to Participant for event
             let p = crate::domain::entities::Participant {
                 id: gp.id,
                 user_id: gp.user_id,
                 game_id: gp.game_id,
                 balance: gp.balance,
                 position: gp.position,
                 created_at: gp.joined_at,
             };
             let _ = self.tx.send(crate::domain::events::GameEvent::ParticipantUpdated(p));
        }
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::repositories::{MockGameRepository, MockParticipantRepository};
    use mockall::predicate::*;

    #[tokio::test]
    async fn test_create_game_success() {
        let mut mock_game_repo = MockGameRepository::new();
        let mut mock_part_repo = MockParticipantRepository::new();
        let host_id = Uuid::new_v4();
        let game_id = Uuid::new_v4();

        // 1. Expect create game
        mock_game_repo.expect_create()
            .times(1)
            .returning(move |mut g| {
                g.id = game_id;
                // Code is generated inside create_game, so we just return it as passed
                Ok(g)
            });

        // 2. Expect find_by_id (called by join_game)
        mock_game_repo.expect_find_by_id()
            .with(eq(game_id))
            .returning(move |_| Ok(Some(GameSession {
                id: game_id,
                code: "ABCD".to_string(), // Mock code
                host_user_id: host_id,
                name: "New Monopoly Game".to_string(),
                status: "WAITING".to_string(),
                jackpot_balance: BigDecimal::from(0),
                created_at: None,
                ended_at: None,
            })));

        // 3. Expect find_by_game_id (idempotency check) -> Return empty list (not joined yet)
        mock_part_repo.expect_find_by_game_id()
            .with(eq(game_id))
            .times(1)
            .returning(|_| Ok(vec![]));

        mock_part_repo.expect_add_participant()
            .times(1)
            .returning(|p| Ok(p));

        let (tx, _rx) = tokio::sync::broadcast::channel(10);
        let service = GameService::new(Arc::new(mock_game_repo), Arc::new(mock_part_repo), tx);
        let result = service.create_game(host_id).await;

        assert!(result.is_ok());
        let created = result.unwrap();
        assert_eq!(created.name, "New Monopoly Game");
        assert_eq!(created.code.len(), 4);
    }

    #[tokio::test]
    async fn test_join_game_fails_if_active() {
        let mut mock_game_repo = MockGameRepository::new();
        let mock_part_repo = MockParticipantRepository::new();
        let game_id = Uuid::new_v4();

        // Expect find_by_id returning ACTIVE game
        mock_game_repo.expect_find_by_id()
            .with(eq(game_id))
            .returning(move |_| Ok(Some(GameSession {
                id: game_id,
                code: "ABCD".to_string(),
                host_user_id: Uuid::new_v4(),
                name: "Game".to_string(),
                status: "ACTIVE".to_string(),
                jackpot_balance: BigDecimal::from(0),
                created_at: None,
                ended_at: None,
                ended_at: None,
            })));

        let (tx, _rx) = tokio::sync::broadcast::channel(10);
        let service = GameService::new(Arc::new(mock_game_repo), Arc::new(mock_part_repo), tx);
        let result = service.join_game(game_id, Uuid::new_v4()).await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "Game is not open for joining");
    }

    #[tokio::test]
    async fn test_leave_game() {
        let mut mock_game_repo = MockGameRepository::new();
        let mut mock_part_repo = MockParticipantRepository::new();
        let game_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();

        mock_game_repo.expect_find_by_id()
            .with(eq(game_id))
            .returning(move |_| Ok(Some(GameSession {
                id: game_id,
                code: "ABCD".to_string(),
                host_user_id: Uuid::new_v4(),
                name: "Game".to_string(),
                status: "WAITING".to_string(),
                jackpot_balance: BigDecimal::from(0),
                created_at: None,
                ended_at: None,
            })));

        mock_part_repo.expect_remove_participant()
            .with(eq(game_id), eq(user_id))
            .returning(|_, _| Ok(()));

        let (tx, _rx) = tokio::sync::broadcast::channel(10);
        let service = GameService::new(Arc::new(mock_game_repo), Arc::new(mock_part_repo), tx);
        let result = service.leave_game(game_id, user_id).await;
        assert!(result.is_ok());
    }
}
