use axum::{
    extract::{State, Json, Path},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize};
use uuid::Uuid;
use bigdecimal::BigDecimal;
use crate::state::AppState;
use crate::web::extractors::AuthorizedUser;

#[derive(Deserialize)]
pub struct TransferRequest {
    pub from_participant_id: Option<Uuid>,
    pub to_participant_id: Option<Uuid>,
    pub amount: BigDecimal,
    pub description: Option<String>,
}

pub async fn perform_transfer(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    _auth_user: AuthorizedUser, // Ensure user is authenticated, though we don't use the ID yet for permission check
    Json(payload): Json<TransferRequest>,
) -> impl IntoResponse {
    match state.transaction_service.transfer(
        game_id, 
        payload.from_participant_id, 
        payload.to_participant_id, 
        payload.amount, 
        payload.description
    ).await {
        Ok(tx) => (StatusCode::CREATED, Json(tx)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn delete_transaction(
    State(state): State<AppState>,
    Path((_game_id, tx_id)): Path<(Uuid, Uuid)>, // game_id in path for REST structure, but unneeded for logic
    _auth_user: AuthorizedUser,
) -> impl IntoResponse {
    match state.transaction_service.delete_transaction(tx_id).await {
        Ok(_) => (StatusCode::NO_CONTENT, ()).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_transactions(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    _auth_user: AuthorizedUser,
) -> impl IntoResponse {
     match state.transaction_service.get_transactions(game_id).await {
        Ok(txs) => (StatusCode::OK, Json(txs)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn claim_jackpot(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    auth_user: AuthorizedUser,
) -> impl IntoResponse {
    match state.transaction_service.claim_jackpot(game_id, auth_user.user_id).await {
        Ok(tx) => (StatusCode::OK, Json(tx)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
