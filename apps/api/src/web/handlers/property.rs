use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;
use crate::state::AppState;
use crate::domain::entities::{Property, ParticipantProperty};

pub async fn get_all_properties(
    State(state): State<AppState>,
) -> Result<Json<Vec<Property>>, String> {
    state.property_service.get_all_properties().await
        .map(Json)
        .map_err(|e| e.to_string())
}

pub async fn get_game_properties(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
) -> Result<Json<Vec<ParticipantProperty>>, String> {
    state.property_service.get_game_ownership(game_id).await
        .map(Json)
        .map_err(|e| e.to_string())
}

#[derive(serde::Deserialize)]
pub struct BuyPropertyRequest {
    pub user_id: Uuid,
}

pub async fn buy_property(
    State(state): State<AppState>,
    Path((game_id, property_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<BuyPropertyRequest>,
) -> Result<Json<ParticipantProperty>, String> {
    state.property_service.buy_property(game_id, payload.user_id, property_id).await
        .map(Json)
        .map_err(|e| e.to_string())
}

#[derive(serde::Deserialize)]
pub struct MortgageRequest {
    pub user_id: Uuid,
}

pub async fn mortgage_property(
    State(state): State<AppState>,
    Path((game_id, property_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<MortgageRequest>,
) -> Result<Json<ParticipantProperty>, String> {
    state.property_service.mortgage_property(game_id, payload.user_id, property_id).await
        .map(Json)
        .map_err(|e| e.to_string())
}

pub async fn unmortgage_property(
    State(state): State<AppState>,
    Path((game_id, property_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<MortgageRequest>,
) -> Result<Json<ParticipantProperty>, String> {
    state.property_service.unmortgage_property(game_id, payload.user_id, property_id).await
        .map(Json)
        .map_err(|e| e.to_string())
}
