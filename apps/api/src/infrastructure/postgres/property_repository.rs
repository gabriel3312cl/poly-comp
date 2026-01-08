use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::{
    entities::{Property, ParticipantProperty},
    repositories::PropertyRepository,
};

pub struct PostgresPropertyRepository {
    pool: PgPool,
}

impl PostgresPropertyRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl PropertyRepository for PostgresPropertyRepository {
    async fn find_all_properties(&self) -> Result<Vec<Property>, anyhow::Error> {
        let properties = sqlx::query_as::<_, Property>(
            "SELECT * FROM properties ORDER BY board_position ASC"
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(properties)
    }

    async fn find_property_by_id(&self, id: Uuid) -> Result<Option<Property>, anyhow::Error> {
        let property = sqlx::query_as::<_, Property>(
            "SELECT * FROM properties WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;
        Ok(property)
    }

    async fn find_ownership_by_game(&self, game_id: Uuid) -> Result<Vec<ParticipantProperty>, anyhow::Error> {
        let ownership = sqlx::query_as::<_, ParticipantProperty>(
            r#"
            SELECT pp.*, p.name as property_name, p.group_color
            FROM participant_properties pp
            JOIN properties p ON pp.property_id = p.id
            WHERE pp.game_id = $1
            "#
        )
        .bind(game_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(ownership)
    }

    async fn find_participant_properties(&self, game_id: Uuid, participant_id: Uuid) -> Result<Vec<ParticipantProperty>, anyhow::Error> {
        let ownership = sqlx::query_as::<_, ParticipantProperty>(
            r#"
            SELECT pp.*, p.name as property_name, p.group_color
            FROM participant_properties pp
            JOIN properties p ON pp.property_id = p.id
            WHERE pp.game_id = $1 AND pp.participant_id = $2
            "#
        )
        .bind(game_id)
        .bind(participant_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(ownership)
    }

    async fn assign_property(&self, pp: ParticipantProperty) -> Result<ParticipantProperty, anyhow::Error> {
        let created = sqlx::query_as::<_, ParticipantProperty>(
            r#"
            INSERT INTO participant_properties (game_id, participant_id, property_id, is_mortgaged, house_count, hotel_count)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            "#
        )
        .bind(pp.game_id)
        .bind(pp.participant_id)
        .bind(pp.property_id)
        .bind(pp.is_mortgaged)
        .bind(pp.house_count)
        .bind(pp.hotel_count)
        .fetch_one(&self.pool)
        .await?;
        Ok(created)
    }

    async fn update_property_ownership(&self, pp: ParticipantProperty) -> Result<ParticipantProperty, anyhow::Error> {
        let updated = sqlx::query_as::<_, ParticipantProperty>(
            r#"
            UPDATE participant_properties
            SET is_mortgaged = $1, house_count = $2, hotel_count = $3
            WHERE id = $4
            RETURNING *
            "#
        )
        .bind(pp.is_mortgaged)
        .bind(pp.house_count)
        .bind(pp.hotel_count)
        .bind(pp.id)
        .fetch_one(&self.pool)
        .await?;
        Ok(updated)
    }

    async fn transfer_property(&self, game_id: Uuid, property_id: Uuid, new_participant_id: Uuid) -> Result<(), anyhow::Error> {
        sqlx::query(
            "UPDATE participant_properties SET participant_id = $1 WHERE game_id = $2 AND property_id = $3"
        )
        .bind(new_participant_id)
        .bind(game_id)
        .bind(property_id)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
