use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State, Query,
    },
    response::IntoResponse,
};

use serde::Deserialize;
use crate::state::AppState;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct WsParams {
    game_id: Uuid,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Query(params): Query<WsParams>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state, params.game_id))
}

async fn handle_socket(mut socket: WebSocket, state: AppState, game_id: Uuid) {
    let mut rx = state.tx.subscribe();

    // Loop to receive messages from the broadcast channel
    while let Ok(event) = rx.recv().await {
        // Only send events related to the connected game
        if event.game_id() == game_id {
            if let Ok(msg_json) = serde_json::to_string(&event) {
                if socket.send(Message::Text(msg_json)).await.is_err() {
                    // Client disconnected
                    break;
                }
            }
        }
    }
}
