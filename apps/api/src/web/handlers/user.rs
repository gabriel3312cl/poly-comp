use crate::state::AppState;
use crate::web::extractors::AuthorizedUser;
use axum::{
    extract::{State, Json},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct RegisterUserRequest {
    pub username: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
}

#[derive(Deserialize)]
pub struct UpdateUserRequest {
    pub first_name: String,
    pub last_name: String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub token: String,
}

pub async fn login_user(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> impl IntoResponse {
     match state.user_service.login(payload.username, payload.password).await {
        Ok(user) => {
             match crate::shared::auth::Auth::generate_token(user.id, &state.config.jwt_secret) {
                Ok(token) => (StatusCode::OK, Json(LoginResponse { token })).into_response(),
                Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Token generation error").into_response(),
             }
        },
        Err(e) => (StatusCode::UNAUTHORIZED, e.to_string()).into_response(),
    }
}

pub async fn logout_user(
    State(state): State<AppState>,
    auth_user: AuthorizedUser,
) -> impl IntoResponse {
    match state.user_service.logout(auth_user.user_id).await {
        Ok(_) => (StatusCode::OK, "Logged out").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn register_user(
    State(state): State<AppState>,
    Json(payload): Json<RegisterUserRequest>,
) -> impl IntoResponse {
    match state.user_service.register(payload.username, payload.password, payload.first_name, payload.last_name).await {
        Ok(user) => (StatusCode::CREATED, Json(user)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e.to_string()).into_response(),
    }
}

pub async fn update_user(
    State(state): State<AppState>,
    auth_user: AuthorizedUser,
    Json(payload): Json<UpdateUserRequest>,
) -> impl IntoResponse {
    match state.user_service.update_profile(auth_user.user_id, payload.first_name, payload.last_name).await {
        Ok(user) => (StatusCode::OK, Json(user)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn delete_user(
    State(state): State<AppState>,
    auth_user: AuthorizedUser,
) -> impl IntoResponse {
    match state.user_service.delete_account(auth_user.user_id).await {
        Ok(_) => (StatusCode::NO_CONTENT, ()).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
