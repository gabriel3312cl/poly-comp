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
    transaction_service: Arc<crate::application::transaction_service::TransactionService>,
    tx: tokio::sync::broadcast::Sender<crate::domain::events::GameEvent>,
}

impl GameService {
    pub fn new(
        game_repo: Arc<dyn GameRepository + Send + Sync>,
        participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
        transaction_service: Arc<crate::application::transaction_service::TransactionService>,
        tx: tokio::sync::broadcast::Sender<crate::domain::events::GameEvent>,
    ) -> Self {
        Self { game_repo, participant_repo, transaction_service, tx }
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
            current_turn_user_id: None,
            turn_order: None,
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
            balance: BigDecimal::from(0), // Start with 0, then transfer 1500
            position: 0,
            joined_at: None,
        };

        let p = self.participant_repo.add_participant(participant).await?;

        // Initial Funding Transaction
        let _ = self.transaction_service.transfer(
            game_id,
            None, // From Bank
            Some(p.id),
            BigDecimal::from(1500),
            Some("Initial Funding".to_string())
        ).await?;

        // Broadcast Event
        let event_p = crate::domain::entities::Participant {
            id: p.id,
            user_id: p.user_id,
            game_id: p.game_id,
            balance: BigDecimal::from(1500), // Optimistic update for event? Or fetch fresh?
            // Actually, transfer updates underlying repo, but `p` is stale.
            // Let's assume frontend handles it via Transaction created event or we send updated P.
            // For now, let's send 1500 explicitly in event so UI shows it immediately.
            position: p.position,
            created_at: p.joined_at,
        };
        let _ = self.tx.send(crate::domain::events::GameEvent::ParticipantUpdated(event_p));

        Ok(p)
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
             // Handle Game Start
             if s == "ACTIVE" && game.status != "ACTIVE" {
                 // 1. Get Participants
                 let participants = self.participant_repo.find_by_game_id(game_id).await?;
                 if participants.is_empty() {
                     return Err(anyhow::anyhow!("Cannot start game with no participants"));
                 }

                 // 2. Roll Initiative
                 let mut initiatives: Vec<(Uuid, i32)> = Vec::new();
                 for p in &participants {
                     let roll = rng().random_range(2..=12); // rand 0.9 syntax? or gen_range? 
                     // 'rng()' returns ThreadRng. 'Rng' trait provides gen_range.
                     // Newer rand uses random_range or gen_range. Assuming gen_range based on imports.
                     // Actually let's restrict to standard gen_range(2..=12).
                     // Wait, 'use rand::{rng, Rng};' 
                     // If it's rand 0.8, rng() is not the constructor usually, it's thread_rng().
                     // Line 4 says 'use rand::{rng, Rng}'.
                     // Line 30 uses 'rng().sample_iter'.
                     // This suggests 'rng' is a function.
                     initiatives.push((p.user_id, roll));
                 }
                 
                 // Sort descending by roll
                 initiatives.sort_by(|a, b| b.1.cmp(&a.1));
                 
                 let turn_order: Vec<Uuid> = initiatives.iter().map(|(uid, _)| *uid).collect();
                 
                 game.turn_order = Some(sqlx::types::Json(turn_order.clone()));
                 game.current_turn_user_id = Some(turn_order[0]);
                 
                 // Broadcast Turn Update immediately (or let GameUpdated handle it)
                 // Start event?
                 let _ = self.tx.send(crate::domain::events::GameEvent::TurnUpdated { 
                     game_id, 
                     current_turn_user_id: turn_order[0]
                 });
             }
             
             game.status = s;
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

    pub async fn end_turn(&self, game_id: Uuid, user_id: Uuid) -> Result<GameSession, anyhow::Error> {
        let mut game = self.game_repo.find_by_id(game_id).await?
            .ok_or_else(|| anyhow::anyhow!("Game not found"))?;
        
        if game.current_turn_user_id != Some(user_id) {
             return Err(anyhow::anyhow!("It is not your turn!"));
        }
        
        let order = game.turn_order.clone().ok_or_else(|| anyhow::anyhow!("No turn order defined"))?;
        let list = &order.0; // access inner vec via .0 (Json wrapper)
        
        let idx = list.iter().position(|u| *u == user_id)
            .ok_or_else(|| anyhow::anyhow!("User not in turn order"))?;
            
        let next_idx = (idx + 1) % list.len();
        let next_user = list[next_idx];
        
        game.current_turn_user_id = Some(next_user);
        
        let updated = self.game_repo.update(game).await?;
        
        // Broadcast
        let _ = self.tx.send(crate::domain::events::GameEvent::TurnUpdated { 
            game_id, 
            current_turn_user_id: next_user 
        });
        
        Ok(updated)
    }
}

#[cfg(test)]
#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::repositories::{MockGameRepository, MockParticipantRepository, MockTransactionRepository, MockCardRepository};
    use crate::application::transaction_service::TransactionService;
    use mockall::predicate::*;

    #[tokio::test]
    async fn test_create_game_success() {
        let mut mock_game_repo = MockGameRepository::new();
        let mut mock_part_repo = MockParticipantRepository::new();
        let mut mock_tx_repo = MockTransactionRepository::new();
        let mut mock_card_repo = MockCardRepository::new();

        let host_id = Uuid::new_v4();
        let game_id = Uuid::new_v4();
        let participant_id = Uuid::new_v4();

        // 1. Expect create game
        mock_game_repo.expect_create()
            .times(1)
            .returning(move |mut g| {
                g.id = game_id;
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
                current_turn_user_id: None,
                turn_order: None,
            })));

        // 3. Expect find_by_game_id (idempotency check)
        mock_part_repo.expect_find_by_game_id()
            .with(eq(game_id))
            .times(1)
            .returning(|_| Ok(vec![]));

        mock_part_repo.expect_add_participant()
            .times(1)
            .returning(move |mut p| {
                p.id = participant_id; 
                Ok(p)
            });

        // 4. Expect Card Repo check for Bank Owner (called by TransactionService::transfer)
        mock_card_repo.expect_find_owner_of_card_title()
            .with(eq(game_id), eq("El Banco"))
            .times(1)
            .returning(|_, _| Ok(None));

        // 5. Expect Transfer (Initial Funding)
        mock_tx_repo.expect_execute_transfer()
             .times(1)
             .returning(|t| Ok(t));

        let (tx, _rx) = tokio::sync::broadcast::channel(10);
        
        let tx_service = Arc::new(TransactionService::new(
            Arc::new(mock_tx_repo),
            Arc::new(MockParticipantRepository::new()), // Used by TxService internally, irrelevant for this test path? 
                                                       // Wait, TxService::transfer might use it? 
                                                       // transfer() uses card_repo for Bank Owner check.
                                                       // transfer() does NOT use participant_repo (it uses _participant_repo).
            Arc::new(mock_card_repo),
            tx.clone()
        ));

        let service = GameService::new(Arc::new(mock_game_repo), Arc::new(mock_part_repo), tx_service, tx);
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
        let mock_tx_repo = MockTransactionRepository::new();
        let mock_card_repo = MockCardRepository::new();

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
                current_turn_user_id: None,
                turn_order: None,
            })));

        let (tx, _rx) = tokio::sync::broadcast::channel(10);
        let tx_service = Arc::new(TransactionService::new(
            Arc::new(mock_tx_repo),
            Arc::new(MockParticipantRepository::new()),
            Arc::new(mock_card_repo),
            tx.clone()
        ));

        let service = GameService::new(Arc::new(mock_game_repo), Arc::new(mock_part_repo), tx_service, tx);
        let result = service.join_game(game_id, Uuid::new_v4()).await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "Game is not open for joining");
    }

    #[tokio::test]
    async fn test_leave_game() {
        let mut mock_game_repo = MockGameRepository::new();
        let mut mock_part_repo = MockParticipantRepository::new();
        
        // Transaction Service not needed for leave_game, but needed for constructor
        let mock_tx_repo = MockTransactionRepository::new();
        let mock_card_repo = MockCardRepository::new();

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
                current_turn_user_id: None,
                turn_order: None,
            })));

        mock_part_repo.expect_remove_participant()
            .with(eq(game_id), eq(user_id))
            .returning(|_, _| Ok(()));

        let (tx, _rx) = tokio::sync::broadcast::channel(10);
        let tx_service = Arc::new(TransactionService::new(
            Arc::new(mock_tx_repo),
            Arc::new(MockParticipantRepository::new()),
            Arc::new(mock_card_repo),
            tx.clone()
        ));

        let service = GameService::new(Arc::new(mock_game_repo), Arc::new(mock_part_repo), tx_service, tx);
        let result = service.leave_game(game_id, user_id).await;
        assert!(result.is_ok());
    }
}
