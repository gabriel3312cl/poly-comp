use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::{entities::Transaction, repositories::TransactionRepository};

pub struct PostgresTransactionRepository {
    pool: PgPool,
}

impl PostgresTransactionRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl TransactionRepository for PostgresTransactionRepository {
    async fn find_by_game(&self, game_id: Uuid) -> Result<Vec<Transaction>, anyhow::Error> {
        let transactions = sqlx::query_as::<_, Transaction>(
            r#"
            SELECT * FROM transactions WHERE game_id = $1 ORDER BY created_at DESC
            "#
        )
        .bind(game_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(transactions)
    }

    async fn delete(&self, id: Uuid) -> Result<(), anyhow::Error> {
        let mut tx = self.pool.begin().await?;

        // 1. Fetch transaction details to know what to reverse
        let transaction: Option<Transaction> = sqlx::query_as("SELECT * FROM transactions WHERE id = $1 FOR UPDATE")
            .bind(id)
            .fetch_optional(&mut *tx)
            .await?;

        let transaction = match transaction {
            Some(t) => t,
            None => return Ok(()) // Already deleted or not found
        };

        // 2. Reverse effects
        // Refund Sender (Add back)
        if let Some(from_id) = transaction.from_participant_id {
             sqlx::query("UPDATE game_participants SET balance = balance + $1 WHERE id = $2")
                 .bind(&transaction.amount)
                 .bind(from_id)
                 .execute(&mut *tx)
                 .await?;
        }

        // Reclaim from Receiver (Deduct)
        if let Some(to_id) = transaction.to_participant_id {
             // We allow negative balance here? Typically user wants undo, so yes, we force deduction even if it goes negative (debt).
             sqlx::query("UPDATE game_participants SET balance = balance - $1 WHERE id = $2")
                 .bind(&transaction.amount)
                 .bind(to_id)
                 .execute(&mut *tx)
                 .await?;
        }

        // 3. Delete Record
        sqlx::query("DELETE FROM transactions WHERE id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;

        tx.commit().await?;
        Ok(())
    }

    async fn execute_transfer(
        &self, 
        transaction: Transaction
    ) -> Result<Transaction, anyhow::Error> {
        let mut tx = self.pool.begin().await?;

        // Set Isolation Level
        sqlx::query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ").execute(&mut *tx).await?;

        // 1. Handle Sender (Deduct)
        if let Some(from_id) = transaction.from_participant_id {
             // Check Balance and Lock Row
             let balance_row: Option<(bigdecimal::BigDecimal,)> = sqlx::query_as(
                "SELECT balance FROM game_participants WHERE id = $1 FOR UPDATE"
             )
             .bind(from_id)
             .fetch_optional(&mut *tx)
             .await?;

             if let Some((_balance,)) = balance_row {
                 // Allow negative balance, so no check here.
                 
                 // Deduct
                 sqlx::query("UPDATE game_participants SET balance = balance - $1 WHERE id = $2")
                     .bind(&transaction.amount)
                     .bind(from_id)
                     .execute(&mut *tx)
                     .await?;

             } else {
                 return Err(anyhow::anyhow!("Sender participant not found for ID: {}", from_id));
             }
         }

        // 2. Handle Receiver (Add)
        if let Some(to_id) = transaction.to_participant_id {
             sqlx::query("UPDATE game_participants SET balance = balance + $1 WHERE id = $2")
                 .bind(&transaction.amount)
                 .bind(to_id)
                 .execute(&mut *tx)
                 .await?;
        }

        // 3. Create Transaction Record
        let rec = sqlx::query_as::<_, Transaction>(
            r#"
            INSERT INTO transactions (id, game_id, from_participant_id, to_participant_id, amount, description, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#
        )
        .bind(transaction.id)
        .bind(transaction.game_id)
        .bind(transaction.from_participant_id)
        .bind(transaction.to_participant_id)
        .bind(&transaction.amount) // Use ref for consistency, though Copy works for some types
        .bind(transaction.description)
        .bind(transaction.created_at)
        .fetch_one(&mut *tx)
        .await?;

        // 4. Jackpot Logic: If paying to Bank (from_id=Some, to_id=None), add to jackpot
        if transaction.from_participant_id.is_some() && transaction.to_participant_id.is_none() {
             sqlx::query("UPDATE game_sessions SET jackpot_balance = jackpot_balance + $1 WHERE id = $2")
                 .bind(&transaction.amount)
                 .bind(transaction.game_id)
                 .execute(&mut *tx)
                 .await?;
        }

        tx.commit().await?;

        Ok(rec)
    }

    async fn claim_jackpot(&self, game_id: Uuid, user_id: Uuid) -> Result<Transaction, anyhow::Error> {
        let mut tx = self.pool.begin().await?;

        // 1. Get Jackpot Balance lock
        let row: (bigdecimal::BigDecimal,) = sqlx::query_as("SELECT jackpot_balance FROM game_sessions WHERE id = $1 FOR UPDATE")
            .bind(game_id)
            .fetch_one(&mut *tx)
            .await?;
        
        let amount = row.0;

        if amount <= bigdecimal::BigDecimal::from(0) {
            return Err(anyhow::anyhow!("Jackpot is empty"));
        }

        // 2. Find Participant ID for User
        let participant_row: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM game_participants WHERE game_id = $1 AND user_id = $2")
             .bind(game_id)
             .bind(user_id)
             .fetch_optional(&mut *tx)
             .await?;
        
        let to_pid = match participant_row {
            Some(r) => r.0,
            None => return Err(anyhow::anyhow!("User is not a participant")),
        };

        // 3. Transfer to User
        sqlx::query("UPDATE game_participants SET balance = balance + $1 WHERE id = $2")
            .bind(&amount)
            .bind(to_pid)
            .execute(&mut *tx)
            .await?;
        
        // 4. Reset Jackpot
        sqlx::query("UPDATE game_sessions SET jackpot_balance = 0 WHERE id = $1")
            .bind(game_id)
            .execute(&mut *tx)
            .await?;

        // 5. Record Transaction
        let rec = sqlx::query_as::<_, Transaction>(
            r#"
            INSERT INTO transactions (id, game_id, from_participant_id, to_participant_id, amount, description, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#
        )
        .bind(Uuid::new_v4())
        .bind(game_id)
        .bind(None::<Uuid>) // From Bank (or Jackpot)
        .bind(Some(to_pid))
        .bind(&amount)
        .bind("Jackpot Win!".to_string())
        .bind(time::OffsetDateTime::now_utc())
        .fetch_one(&mut *tx)
        .await?;

        tx.commit().await?;

        Ok(rec)
    }
}
