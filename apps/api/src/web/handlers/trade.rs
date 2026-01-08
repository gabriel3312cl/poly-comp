use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;
use crate::state::AppState;
use crate::domain::entities::Trade;

// Re-using Trade entity for create request for simplicity, 
// or define a specific DTO if needed.
// Usually client sends a JSON matching Trade struct fields (without ID/Status/Dates).
// For now, let's assume client sends mostly complete Trade object minus ID.
#[derive(serde::Deserialize)]
pub struct CreateTradeRequest {
    pub initiator_id: Uuid,
    pub target_id: Uuid,
    pub offer_cash: bigdecimal::BigDecimal,
    pub offer_properties: Option<sqlx::types::Json<Vec<Uuid>>>,
    pub offer_cards: Option<sqlx::types::Json<Vec<Uuid>>>,
    pub request_cash: bigdecimal::BigDecimal,
    pub request_properties: Option<sqlx::types::Json<Vec<Uuid>>>,
    pub request_cards: Option<sqlx::types::Json<Vec<Uuid>>>,
}

pub async fn create_trade(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    Json(payload): Json<CreateTradeRequest>,
) -> Result<Json<Trade>, String> {
    let trade = Trade {
        id: Uuid::new_v4(),
        game_id,
        initiator_id: payload.initiator_id,
        target_id: payload.target_id,
        offer_cash: payload.offer_cash,
        offer_properties: payload.offer_properties,
        offer_cards: payload.offer_cards,
        request_cash: payload.request_cash,
        request_properties: payload.request_properties,
        request_cards: payload.request_cards,
        status: "PENDING".to_string(),
        created_at: Some(time::OffsetDateTime::now_utc()),
    };

    state.trade_service.create_trade(trade).await
        .map(Json)
        .map_err(|e| e.to_string())
}

#[derive(serde::Deserialize)]
pub struct RespondTradeRequest {
    pub user_id: Uuid,
}

pub async fn accept_trade(
    State(state): State<AppState>,
    Path((_game_id, trade_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<RespondTradeRequest>,
) -> Result<Json<Trade>, String> {
    state.trade_service.accept_trade(trade_id, payload.user_id).await
        .map(Json)
        .map_err(|e| e.to_string())
}

pub async fn reject_trade(
    State(state): State<AppState>,
    Path((_game_id, trade_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<RespondTradeRequest>,
) -> Result<Json<Trade>, String> {
    state.trade_service.reject_trade(trade_id, payload.user_id).await
        .map(Json)
        .map_err(|e| e.to_string())
}
