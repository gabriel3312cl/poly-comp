use serde::{Serialize, Deserialize};
use uuid::Uuid;
use time::OffsetDateTime;
use sqlx::FromRow;
use bigdecimal::BigDecimal;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub first_name: String,
    pub last_name: String,
    #[serde(skip)]
    pub password_hash: String,
    pub created_at: Option<OffsetDateTime>,
    pub last_logout_at: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum GameStatus {
    WAITING,
    ACTIVE,
    PAUSED,
    FINISHED,
    CANCELLED,
}

impl ToString for GameStatus {
    fn to_string(&self) -> String {
        match self {
            GameStatus::WAITING => "WAITING".to_string(),
            GameStatus::ACTIVE => "ACTIVE".to_string(),
            GameStatus::PAUSED => "PAUSED".to_string(),
            GameStatus::FINISHED => "FINISHED".to_string(),
            GameStatus::CANCELLED => "CANCELLED".to_string(),
        }
    }
}

// Helper to map string from DB to Enum
impl From<String> for GameStatus {
    fn from(s: String) -> Self {
        match s.as_str() {
            "ACTIVE" => GameStatus::ACTIVE,
            "PAUSED" => GameStatus::PAUSED,
            "FINISHED" => GameStatus::FINISHED,
            "CANCELLED" => GameStatus::CANCELLED,
            _ => GameStatus::WAITING,
        }
    }
}


#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct GameSession {
    pub id: Uuid,
    pub code: String,
    pub host_user_id: Uuid,
    pub name: String,
    pub status: String, // Kept as string for SQLx matching flexibility, or can be mapped
    pub created_at: Option<OffsetDateTime>,
    pub ended_at: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct GameParticipant {
    pub id: Uuid,
    pub game_id: Uuid,
    pub user_id: Uuid,
    pub balance: BigDecimal,
    pub joined_at: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ParticipantDetail {
    pub id: Uuid,
    pub game_id: Uuid,
    pub user_id: Uuid,
    pub balance: BigDecimal,
    pub username: String,
    pub first_name: String,
    pub last_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Transaction {
    pub id: Uuid,
    pub game_id: Uuid,
    pub from_participant_id: Option<Uuid>,
    pub to_participant_id: Option<Uuid>,
    pub amount: BigDecimal,
    pub description: Option<String>,
    pub created_at: Option<OffsetDateTime>,
}
