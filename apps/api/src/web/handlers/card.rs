use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use uuid::Uuid;
use serde::Deserialize;
use crate::state::AppState;
use crate::web::extractors::AuthorizedUser;

// -- DTOs --
#[derive(Deserialize)]
pub struct DrawCardRequest {
    pub card_type: String, // "arca" | "fortuna"
}

#[derive(Deserialize)]
pub struct BuyMarketCardRequest {
    pub slot_index: i32,
}

#[derive(Deserialize)]
pub struct ExchangeMarketCardRequest {
    pub slot_index: i32,
}

#[derive(Deserialize)]
pub struct UseCardRequest {
    pub inventory_id: Uuid,
}

// -- Handlers --

pub async fn draw_card(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    auth_user: AuthorizedUser,
    Json(payload): Json<DrawCardRequest>,
) -> impl IntoResponse {
    match state.card_service.draw_card(game_id, auth_user.user_id, &payload.card_type).await {
        Ok(card) => (StatusCode::OK, Json(card)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_market(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    _auth_user: AuthorizedUser,
) -> impl IntoResponse {
    match state.card_service.get_market(game_id).await {
        Ok(market) => (StatusCode::OK, Json(market)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn buy_market_card(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    auth_user: AuthorizedUser,
    Json(payload): Json<BuyMarketCardRequest>,
) -> impl IntoResponse {
    match state.card_service.buy_market_card(game_id, auth_user.user_id, payload.slot_index).await {
        Ok(card) => (StatusCode::OK, Json(card)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn exchange_market_card(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    _auth_user: AuthorizedUser,
    Json(payload): Json<ExchangeMarketCardRequest>,
) -> impl IntoResponse {
    // Exchange requires validation? Generally driven by Special Dice.
    match state.card_service.exchange_market_card(game_id, payload.slot_index).await {
        Ok(market) => (StatusCode::OK, Json(market)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_inventory(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    auth_user: AuthorizedUser,
) -> impl IntoResponse {
    match state.card_service.get_inventory(game_id, auth_user.user_id).await {
        Ok(inventory) => (StatusCode::OK, Json(inventory)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn use_card(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    auth_user: AuthorizedUser,
    Json(payload): Json<UseCardRequest>,
) -> impl IntoResponse {
    match state.card_service.use_card(game_id, auth_user.user_id, payload.inventory_id).await {
        Ok(_) => (StatusCode::OK, Json("Success")).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn discard_card(
    State(state): State<AppState>,
    Path((game_id, inventory_id)): Path<(Uuid, Uuid)>,
    auth_user: AuthorizedUser,
) -> impl IntoResponse {
    match state.card_service.discard_card(game_id, auth_user.user_id, inventory_id).await {
        Ok(_) => (StatusCode::OK, Json("Success")).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

// --- Special Actions ---

pub async fn get_all_inventories(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    _auth_user: AuthorizedUser,
) -> impl IntoResponse {
    match state.card_service.get_all_inventories(game_id).await {
        Ok(inv) => (StatusCode::OK, Json(inv)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

#[derive(Deserialize)]
pub struct SpecialActionRequest {
    pub action: String, // "buy" | "destroy" | "exchange"
    pub target_inventory_id: Uuid,
    pub my_card_id: Option<Uuid>,
}

pub async fn execute_special_action(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    auth_user: AuthorizedUser,
    Json(payload): Json<SpecialActionRequest>,
) -> impl IntoResponse {
    match state.card_service.execute_special_action(
        game_id, 
        auth_user.user_id, 
        &payload.action, 
        payload.target_inventory_id, 
        payload.my_card_id
    ).await {
        Ok(_) => (StatusCode::OK, Json("Success")).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
