use axum::{
    extract::{State, Json, Path},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;
use uuid::Uuid;
use crate::state::AppState;
use crate::web::extractors::AuthorizedUser;

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

#[derive(Deserialize)]
pub struct JoinGameByCodeRequest {
    pub code: String,
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

pub async fn join_game_by_code(
    State(state): State<AppState>,
    auth_user: AuthorizedUser,
    Json(payload): Json<JoinGameByCodeRequest>,
) -> impl IntoResponse {
    match state.game_service.join_game_with_code(payload.code, auth_user.user_id).await {
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

pub async fn get_game(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    _auth_user: AuthorizedUser,
) -> impl IntoResponse {
    match state.game_service.get_game(game_id).await {
        Ok(game) => (StatusCode::OK, Json(game)).into_response(),
        Err(e) => (StatusCode::NOT_FOUND, e.to_string()).into_response(),
    }
}

pub async fn get_participants(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    _auth_user: AuthorizedUser,
) -> impl IntoResponse {
    match state.game_service.get_participants(game_id).await {
         Ok(participants) => (StatusCode::OK, Json(participants)).into_response(),
         Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
