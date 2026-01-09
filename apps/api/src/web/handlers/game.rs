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
    pub initiative_rolls: Option<std::collections::HashMap<Uuid, i32>>,
}

#[derive(Deserialize)]
pub struct UpdatePositionRequest {
    pub position: i32,
    pub user_id: Uuid, // Target user to update (only host usually? or self?)
    // Actually, "Corregir en donde esta el token" implies modifying OWN position or ANYONE's if host.
    // For simplicity, let's allow modifying ANYONE if you are in the game or Host?
    // Let's passed target user_id in body.
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
    match state.game_service.update_game(game_id, auth_user.user_id, payload.name, payload.status, payload.initiative_rolls).await {
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

pub async fn get_game_participants(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    _auth: AuthorizedUser,
) -> impl IntoResponse {
    match state.game_service.get_participants_with_details(game_id).await {
        Ok(participants) => (StatusCode::OK, Json(participants)).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch participants".to_string()).into_response(),
    }
}

pub async fn update_participant_position(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    _auth: AuthorizedUser, // Could check if host/admin
    Json(payload): Json<UpdatePositionRequest>,
) -> impl IntoResponse {
    match state.game_service.update_participant_position(game_id, payload.user_id, payload.position).await {
        Ok(_) => (StatusCode::OK, "Position updated").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn end_turn(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    auth_user: AuthorizedUser,
) -> impl IntoResponse {
    match state.game_service.end_turn(game_id, auth_user.user_id).await {
        Ok(game) => (StatusCode::OK, Json(game)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}
