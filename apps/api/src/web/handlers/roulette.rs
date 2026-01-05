use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use crate::state::AppState;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct SpinRequest {
    pub user_id: Uuid,
    pub result_label: String,
    pub result_value: i32,
    pub result_type: String,
}

pub async fn record_spin(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    Json(payload): Json<SpinRequest>,
) -> Result<impl axum::response::IntoResponse, (StatusCode, String)> {
    let spin = state
        .roulette_service
        .record_spin(game_id, payload.user_id, payload.result_label, payload.result_value, payload.result_type)
        .await
        .map_err(|e: anyhow::Error| {
            tracing::error!("Failed to record roulette spin: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        })?;

    Ok(Json(spin))
}

pub async fn get_history(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
) -> Result<impl axum::response::IntoResponse, (StatusCode, String)> {
    let history = state
        .roulette_service
        .get_history(game_id)
        .await
        .map_err(|e: anyhow::Error| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(history))
}
