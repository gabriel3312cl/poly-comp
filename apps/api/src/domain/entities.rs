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
    #[sqlx(default)]
    pub jackpot_balance: BigDecimal,
    pub created_at: Option<OffsetDateTime>,
    pub ended_at: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Participant {
    pub id: Uuid,
    pub user_id: Uuid,
    pub game_id: Uuid,
    pub balance: BigDecimal,
    pub created_at: Option<OffsetDateTime>,
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
    #[serde(with = "time::serde::rfc3339::option")]
    pub created_at: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DiceRoll {
    pub id: Uuid,
    pub game_id: Uuid,
    pub user_id: Uuid,
    pub dice_count: i32,
    pub dice_sides: i32,
    pub results: sqlx::types::Json<Vec<i32>>,
    pub total: i32,
    #[serde(with = "time::serde::rfc3339::option")]
    pub created_at: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DiceRollHistory {
    pub id: Uuid,
    pub game_id: Uuid,
    pub user_id: Uuid,
    pub dice_count: i32,
    pub dice_sides: i32,
    pub results: sqlx::types::Json<Vec<i32>>,
    pub total: i32,
    #[serde(with = "time::serde::rfc3339::option")]
    pub created_at: Option<OffsetDateTime>,
    // Joined fields
    pub first_name: String,
    pub last_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct RouletteSpin {
    pub id: Uuid,
    pub game_id: Uuid,
    pub user_id: Uuid,
    pub result_label: String,
    pub result_value: i32,
    pub result_type: String, // 'red' or 'green'
    #[serde(with = "time::serde::rfc3339::option")]
    pub created_at: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct RouletteSpinHistory {
    pub id: Uuid,
    pub game_id: Uuid,
    pub user_id: Uuid,
    pub result_label: String,
    pub result_value: i32,
    pub result_type: String,
    #[serde(with = "time::serde::rfc3339::option")]
    pub created_at: Option<OffsetDateTime>,
    // Joined fields
    pub first_name: String,
    pub last_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SpecialDiceRoll {
    pub id: Uuid,
    pub game_id: Uuid,
    pub user_id: Uuid,
    pub die_name: String,
    pub die_id: String,
    pub face_label: String,
    pub face_value: Option<i32>,
    pub face_action: Option<String>,
    #[serde(with = "time::serde::rfc3339::option")]
    pub created_at: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SpecialDiceRollHistory {
    pub id: Uuid,
    pub game_id: Uuid,
    pub user_id: Uuid,
    pub die_name: String,
    pub die_id: String,
    pub face_label: String,
    pub face_value: Option<i32>,
    pub face_action: Option<String>,
    #[serde(with = "time::serde::rfc3339::option")]
    pub created_at: Option<OffsetDateTime>,
    // Joined fields
    pub first_name: String,
    pub last_name: String,
}
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Card {
    pub id: Uuid,
    pub type_: String, // 'type' is keyword, mapped to 'type' column
    pub title: String,
    pub description: String,
    pub cost: Option<BigDecimal>,
    pub color: Option<String>,
    pub action_type: Option<String>,
    pub action_value: Option<BigDecimal>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ParticipantCard {
    pub id: Uuid,
    pub participant_id: Uuid,
    pub card_id: Uuid,
    pub is_active: bool,
    #[serde(with = "time::serde::rfc3339::option")]
    pub acquired_at: Option<OffsetDateTime>,
    // Joined
    pub title: Option<String>,
    pub description: Option<String>,
    pub type_: Option<String>,
    pub color: Option<String>,
    pub action_type: Option<String>,
    pub action_value: Option<BigDecimal>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct GameBovedaMarket {
    pub game_id: Uuid,
    pub slot_index: i32,
    pub card_id: Uuid,
    // Joined
    pub title: Option<String>,
    pub description: Option<String>,
    pub cost: Option<BigDecimal>,
    pub color: Option<String>,
    pub type_: Option<String>,
    pub action_type: Option<String>,
    pub action_value: Option<BigDecimal>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CardUsageHistory {
    pub id: Uuid,
    pub game_id: Uuid,
    pub participant_id: Uuid,
    pub card_id: Uuid,
    pub action_description: Option<String>,
    #[serde(with = "time::serde::rfc3339::option")]
    pub used_at: Option<OffsetDateTime>,
    // Joined
    pub first_name: Option<String>,
    pub card_title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParticipantCardWithUser {
    pub user_id: Uuid,
    pub user_name: String,
    pub card: ParticipantCard,
}
