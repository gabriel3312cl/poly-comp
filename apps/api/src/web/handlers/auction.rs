use axum::{
    extract::{Path, State},
    Json,
    response::IntoResponse,
    http::StatusCode,
};
use uuid::Uuid;
use crate::state::AppState;
use crate::domain::entities::Auction;
use bigdecimal::BigDecimal;

#[derive(serde::Deserialize)]
pub struct StartAuctionRequest {
    pub property_id: Uuid,
}

pub async fn start_auction(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    Json(payload): Json<StartAuctionRequest>,
) -> impl IntoResponse {
    match state.auction_service.start_auction(game_id, payload.property_id).await {
        Ok(auction) => (StatusCode::OK, Json(auction)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}

pub async fn get_active_auction(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
) -> impl IntoResponse {
    match state.auction_service.get_active_auction(game_id).await {
        Ok(auction) => (StatusCode::OK, Json(auction)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

#[derive(serde::Deserialize)]
pub struct PlaceBidRequest {
    #[serde(rename = "bidder_user_id")]
    pub user_id: Uuid, // Bidder
    pub amount: BigDecimal,
}

pub async fn place_bid(
    State(state): State<AppState>,
    Path((_game_id, auction_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<PlaceBidRequest>,
) -> impl IntoResponse {
    match state.auction_service.place_bid(auction_id, payload.user_id, payload.amount).await {
        Ok(auction) => (StatusCode::OK, Json(auction)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}

// End Auction (Usually triggered automatically or by host, but maybe exposure needed)
pub async fn end_auction(
    State(state): State<AppState>,
    Path((_game_id, auction_id)): Path<(Uuid, Uuid)>,
) -> impl IntoResponse {
    match state.auction_service.end_auction(auction_id).await {
        Ok(auction) => (StatusCode::OK, Json(auction)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}
