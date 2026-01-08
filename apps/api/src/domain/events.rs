use serde::{Deserialize, Serialize};
use crate::domain::entities::{Transaction, DiceRoll, RouletteSpin, SpecialDiceRoll, Participant};
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum GameEvent {
    TransactionCreated(Transaction),
    DiceRolled(DiceRoll),
    RouletteSpun(RouletteSpin),
    SpecialDiceRolled(SpecialDiceRoll),
    ParticipantUpdated(Participant),
    GameUpdated { id: Uuid, status: String }, // For status changes
    MarketUpdated { game_id: Uuid },
    AuctionUpdated(crate::domain::entities::Auction),
    TradeUpdated(crate::domain::entities::Trade),
    TurnUpdated { game_id: Uuid, current_turn_user_id: Uuid },
}

impl GameEvent {
    pub fn game_id(&self) -> Uuid {
        match self {
            GameEvent::TransactionCreated(t) => t.game_id,
            GameEvent::DiceRolled(d) => d.game_id,
            GameEvent::RouletteSpun(r) => r.game_id,
            GameEvent::SpecialDiceRolled(s) => s.game_id,
            GameEvent::ParticipantUpdated(p) => p.game_id,
            GameEvent::GameUpdated { id, .. } => *id,
            GameEvent::MarketUpdated { game_id } => *game_id,
            GameEvent::AuctionUpdated(a) => a.game_id,
            GameEvent::TradeUpdated(t) => t.game_id,
            GameEvent::TurnUpdated { game_id, .. } => *game_id,
        }
    }
}
