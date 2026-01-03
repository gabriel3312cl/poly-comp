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
        sqlx::query("DELETE FROM transactions WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
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

             if let Some((balance,)) = balance_row {
                 if balance < transaction.amount {
                     return Err(anyhow::anyhow!("Insufficient funds"));
                 }
                 
                 // Deduct
                 sqlx::query("UPDATE game_participants SET balance = balance - $1 WHERE id = $2")
                     .bind(&transaction.amount)
                     .bind(from_id)
                     .execute(&mut *tx)
                     .await?;

             } else {
                 return Err(anyhow::anyhow!("Sender participant not found"));
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
        .bind(transaction.amount)
        .bind(transaction.description)
        .bind(transaction.created_at)
        .fetch_one(&mut *tx)
        .await?;

        tx.commit().await?;

        Ok(rec)
    }
}
