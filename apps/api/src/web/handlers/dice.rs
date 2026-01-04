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
pub struct RollRequest {
    pub sides: i32,
    pub count: i32,
}

pub async fn roll_dice(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    auth_user: AuthorizedUser,
    Json(payload): Json<RollRequest>,
) -> impl IntoResponse {
    if payload.count < 1 || payload.count > 8 {
        return (StatusCode::BAD_REQUEST, "Dice count must be between 1 and 8").into_response();
    }
    match state.dice_service.roll_dice(game_id, auth_user.user_id, payload.sides, payload.count).await {
        Ok(roll) => (StatusCode::CREATED, Json(roll)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_history(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    _auth_user: AuthorizedUser,
) -> impl IntoResponse {
    match state.dice_service.get_history(game_id).await {
        Ok(history) => {
            // Transform DiceRollHistory to the desired JSON structure for frontend
            // Frontend expects: { roll: DiceRoll, user_name: "First Last" }
            let response: Vec<_> = history.into_iter().map(|item| {
                // Construct the DiceRoll part manually or use serde_json::to_value if needed,
                // but better to reconstruct the struct or just flattening it?
                // The frontend DiceHistoryItem interface has { roll: DiceRoll, user_name: string }
                // So we need to separate it again.
                // Or we can just use the item as is?
                // Let's stick to the previous contract to minimize frontend changes.
                
                // Reconstruct DiceRoll from history item
                let roll = crate::domain::entities::DiceRoll {
                    id: item.id,
                    game_id: item.game_id,
                    user_id: item.user_id,
                    dice_count: item.dice_count,
                    dice_sides: item.dice_sides,
                    results: item.results,
                    total: item.total,
                    created_at: item.created_at,
                };

                serde_json::json!({
                    "roll": roll,
                    "user_name": format!("{} {}", item.first_name, item.last_name),
                })
            }).collect();
            (StatusCode::OK, Json(response)).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
