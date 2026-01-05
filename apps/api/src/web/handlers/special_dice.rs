use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::state::AppState;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct RollRequest {
    pub user_id: Uuid,
    pub die_name: String,
    pub die_id: String,
    pub face_label: String,
    pub face_value: Option<i32>,
    pub face_action: Option<String>,
}

pub async fn record_roll(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    Json(payload): Json<RollRequest>,
) -> Result<impl axum::response::IntoResponse, (StatusCode, String)> {
    let roll = state
        .special_dice_service
        .record_roll(
            game_id, 
            payload.user_id, 
            payload.die_name, 
            payload.die_id, 
            payload.face_label, 
            payload.face_value, 
            payload.face_action
        )
        .await
        .map_err(|e: anyhow::Error| {
            tracing::error!("Failed to record special dice roll: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        })?;

    Ok(Json(roll))
}

pub async fn get_history(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
) -> Result<impl axum::response::IntoResponse, (StatusCode, String)> {
    let history = state
        .special_dice_service
        .get_history(game_id)
        .await
        .map_err(|e: anyhow::Error| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(history))
}
