use axum::{
    extract::{Path, State},
    Json,
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
) -> Result<Json<Auction>, String> {
    state.auction_service.start_auction(game_id, payload.property_id).await
        .map(Json)
        .map_err(|e| e.to_string())
}

#[derive(serde::Deserialize)]
pub struct PlaceBidRequest {
    pub user_id: Uuid, // Bidder
    pub amount: BigDecimal,
}

pub async fn place_bid(
    State(state): State<AppState>,
    Path((_game_id, auction_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<PlaceBidRequest>,
) -> Result<Json<Auction>, String> {
    state.auction_service.place_bid(auction_id, payload.user_id, payload.amount).await
        .map(Json)
        .map_err(|e| e.to_string())
}

// End Auction (Usually triggered automatically or by host, but maybe exposure needed)
pub async fn end_auction(
    State(state): State<AppState>,
    Path((_game_id, auction_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Auction>, String> {
    state.auction_service.end_auction(auction_id).await
        .map(Json)
        .map_err(|e| e.to_string())
}
