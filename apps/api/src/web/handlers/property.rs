use axum::{
    extract::{Path, State},
    Json,
    response::IntoResponse,
    http::StatusCode,
};
use uuid::Uuid;
use crate::state::AppState;
use crate::domain::entities::{Property, ParticipantProperty};

pub async fn get_all_properties(
    State(state): State<AppState>,
) -> impl IntoResponse {
    match state.property_service.get_all_properties().await {
        Ok(props) => (StatusCode::OK, Json(props)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_game_properties(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
) -> impl IntoResponse {
    match state.property_service.get_game_ownership(game_id).await {
        Ok(props) => (StatusCode::OK, Json(props)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

#[derive(serde::Deserialize)]
pub struct BuyPropertyRequest {
    pub user_id: Uuid,
}

pub async fn buy_property(
    State(state): State<AppState>,
    Path((game_id, property_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<BuyPropertyRequest>,
) -> impl IntoResponse {
    match state.property_service.buy_property(game_id, payload.user_id, property_id).await {
        Ok(pp) => (StatusCode::OK, Json(pp)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}

#[derive(serde::Deserialize)]
pub struct MortgageRequest {
    pub user_id: Uuid,
}

pub async fn mortgage_property(
    State(state): State<AppState>,
    Path((game_id, property_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<MortgageRequest>,
) -> impl IntoResponse {
    match state.property_service.mortgage_property(game_id, payload.user_id, property_id).await {
        Ok(pp) => (StatusCode::OK, Json(pp)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}

pub async fn unmortgage_property(
    State(state): State<AppState>,
    Path((game_id, property_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<MortgageRequest>,
) -> impl IntoResponse {
    match state.property_service.unmortgage_property(game_id, payload.user_id, property_id).await {
        Ok(pp) => (StatusCode::OK, Json(pp)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}

pub async fn buy_building(
    State(state): State<AppState>,
    Path((game_id, property_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<MortgageRequest>,
) -> impl IntoResponse {
    match state.property_service.buy_building(game_id, payload.user_id, property_id).await {
        Ok(pp) => (StatusCode::OK, Json(pp)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}

pub async fn sell_building(
    State(state): State<AppState>,
    Path((game_id, property_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<MortgageRequest>,
) -> impl IntoResponse {
    match state.property_service.sell_building(game_id, payload.user_id, property_id).await {
        Ok(pp) => (StatusCode::OK, Json(pp)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}
