use axum::{
    extract::{State, Json, Path},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::state::AppState;
use crate::web::extractors::AuthorizedUser;

#[derive(Deserialize)]
pub struct CreateGameRequest {
    // We don't need host_user_id here, we get it from token
}

#[derive(Deserialize)]
pub struct JoinGameRequest {
    // We don't need user_id here, we get it from token
}

#[derive(Deserialize)]
pub struct UpdateGameRequest {
    pub name: Option<String>,
    pub status: Option<String>,
}

pub async fn create_game(
    State(state): State<AppState>,
    auth_user: AuthorizedUser,
    // Json(payload): Json<CreateGameRequest>, // Optional if we have other fields
) -> impl IntoResponse {
    match state.game_service.create_game(auth_user.user_id).await {
        Ok(game) => (StatusCode::CREATED, Json(game)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn join_game(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    auth_user: AuthorizedUser,
) -> impl IntoResponse {
    match state.game_service.join_game(game_id, auth_user.user_id).await {
        Ok(participant) => (StatusCode::OK, Json(participant)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}

pub async fn leave_game(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    auth_user: AuthorizedUser,
) -> impl IntoResponse {
    match state.game_service.leave_game(game_id, auth_user.user_id).await {
        Ok(_) => (StatusCode::OK, "Left game").into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}

pub async fn update_game(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    auth_user: AuthorizedUser,
    Json(payload): Json<UpdateGameRequest>,
) -> impl IntoResponse {
    match state.game_service.update_game(game_id, auth_user.user_id, payload.name, payload.status).await {
        Ok(game) => (StatusCode::OK, Json(game)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}

pub async fn delete_game(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    auth_user: AuthorizedUser,
) -> impl IntoResponse {
     match state.game_service.delete_game(game_id, auth_user.user_id).await {
        Ok(_) => (StatusCode::NO_CONTENT, ()).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}
