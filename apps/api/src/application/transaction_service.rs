use std::sync::Arc;
use uuid::Uuid;
use bigdecimal::BigDecimal;
use crate::domain::{
    entities::Transaction,
    repositories::{TransactionRepository, ParticipantRepository},
};

pub struct TransactionService {
    transaction_repo: Arc<dyn TransactionRepository + Send + Sync>,
    _participant_repo: Arc<dyn ParticipantRepository + Send + Sync>, 
}

impl TransactionService {
    pub fn new(
        transaction_repo: Arc<dyn TransactionRepository + Send + Sync>,
        participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
    ) -> Self {
        Self { transaction_repo, _participant_repo: participant_repo }
    }

    pub async fn transfer(&self, game_id: Uuid, from_pid: Option<Uuid>, to_pid: Option<Uuid>, amount: BigDecimal, description: Option<String>) -> Result<Transaction, anyhow::Error> {
        // TODO: Validate balance if from_pid is not None (Bank has infinite money)
        
        let tx = Transaction {
            id: Uuid::new_v4(),
            game_id,
            from_participant_id: from_pid,
            to_participant_id: to_pid,
            amount,
            description,
            created_at: None,
        };

        self.transaction_repo.execute_transfer(tx).await
    }

    pub async fn delete_transaction(&self, tx_id: Uuid) -> Result<(), anyhow::Error> {
        // Just delete for now.
        self.transaction_repo.delete(tx_id).await
    }
    pub async fn get_transactions(&self, game_id: Uuid) -> Result<Vec<Transaction>, anyhow::Error> {
        self.transaction_repo.find_by_game(game_id).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::repositories::{MockTransactionRepository, MockParticipantRepository};
    use mockall::predicate::*;

    #[tokio::test]
    async fn test_transfer_success() {
        let mut mock_tx_repo = MockTransactionRepository::new();
        let mock_part_repo = MockParticipantRepository::new();

        mock_tx_repo.expect_execute_transfer()
            .times(1)
            .returning(|tx| Ok(tx));

        let service = TransactionService::new(Arc::new(mock_tx_repo), Arc::new(mock_part_repo));
        let result = service.transfer(
            Uuid::new_v4(), 
            Some(Uuid::new_v4()), 
            Some(Uuid::new_v4()), 
            BigDecimal::from(100), 
            Some("Rent".to_string())
        ).await;

        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_delete_transaction() {
        let mut mock_tx_repo = MockTransactionRepository::new();
        let mock_part_repo = MockParticipantRepository::new();
        let tx_id = Uuid::new_v4();

        mock_tx_repo.expect_delete()
            .with(eq(tx_id))
            .times(1)
            .returning(|_| Ok(()));

        let service = TransactionService::new(Arc::new(mock_tx_repo), Arc::new(mock_part_repo));
        let result = service.delete_transaction(tx_id).await;
        assert!(result.is_ok());
    }
}
