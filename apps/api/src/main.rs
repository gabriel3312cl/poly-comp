mod config;
mod domain;
mod infrastructure;
mod application;
mod shared;
mod web;
mod state;

use axum::{
    http,
    routing::get,
    Router,
};
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use crate::config::Config;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env()?;

    tracing::info!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await?;
    
    tracing::info!("Database connected successfully.");

    // Auto-Migrate Dice Rolls
    // Auto-Migrate Dice Rolls
    // 1. Create Table
    sqlx::query(r#"
    CREATE TABLE IF NOT EXISTS dice_rolls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        dice_count INT NOT NULL,
        dice_sides INT NOT NULL,
        results JSONB NOT NULL,
        total INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    "#).execute(&pool).await.unwrap_or_else(|e| {
        tracing::error!("Failed to create dice_rolls table: {}", e);
        Default::default()
    });

    // 2. Create Index
    sqlx::query(r#"
    CREATE INDEX IF NOT EXISTS idx_dice_rolls_game_id ON dice_rolls(game_id);
    "#).execute(&pool).await.unwrap_or_else(|e| {
        tracing::error!("Failed to create index for dice_rolls: {}", e);
        Default::default()
    });

    // Repositories
    let user_repo = std::sync::Arc::new(infrastructure::postgres::user_repository::PostgresUserRepository::new(pool.clone()));
    let game_repo = std::sync::Arc::new(infrastructure::postgres::game_repository::PostgresGameRepository::new(pool.clone()));
    let participant_repo = std::sync::Arc::new(infrastructure::postgres::participant_repository::PostgresParticipantRepository::new(pool.clone()));
    let transaction_repo = std::sync::Arc::new(infrastructure::postgres::transaction_repository::PostgresTransactionRepository::new(pool.clone()));
    let dice_repo = std::sync::Arc::new(infrastructure::postgres::dice_repository::PostgresDiceRepository::new(pool.clone()));

    // Services
    let user_service = std::sync::Arc::new(application::user_service::UserService::new(user_repo));
    let game_service = std::sync::Arc::new(application::game_service::GameService::new(game_repo, participant_repo.clone()));
    let transaction_service = std::sync::Arc::new(application::transaction_service::TransactionService::new(transaction_repo, participant_repo));
    let dice_service = std::sync::Arc::new(application::dice_service::DiceService::new(dice_repo));

    let app_state = state::AppState {
        user_service,
        game_service,
        transaction_service,
        dice_service,
        config: config.clone(),
    };

    // Routes
    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        // User Routes
        .route("/users/register", axum::routing::post(web::handlers::user::register_user))
        .route("/users/login", axum::routing::post(web::handlers::user::login_user))
        .route("/users/logout", axum::routing::post(web::handlers::user::logout_user))
        .route("/users/profile", axum::routing::get(web::handlers::user::get_current_user)
            .put(web::handlers::user::update_user)
            .delete(web::handlers::user::delete_user))
        .route("/users/password", axum::routing::put(web::handlers::user::update_password))
        .route("/users/games/hosted", axum::routing::get(web::handlers::user::get_hosted_games))
        .route("/users/games/played", axum::routing::get(web::handlers::user::get_played_games))
        // Game Routes
        .route("/games", axum::routing::post(web::handlers::game::create_game))
        .route("/games/join", axum::routing::post(web::handlers::game::join_game_by_code))
        .route("/games/:id", axum::routing::get(web::handlers::game::get_game)
            .put(web::handlers::game::update_game)
            .delete(web::handlers::game::delete_game))
        .route("/games/:id/join", axum::routing::post(web::handlers::game::join_game))
        .route("/games/:id/leave", axum::routing::post(web::handlers::game::leave_game))
        .route("/games/:id/participants", axum::routing::get(web::handlers::game::get_game_participants))
        // Transaction Routes
        .route("/games/:id/transactions", axum::routing::get(web::handlers::transaction::get_transactions)
            .post(web::handlers::transaction::perform_transfer))
        .route("/games/:id/transactions/:tx_id", axum::routing::delete(web::handlers::transaction::delete_transaction))
        .route("/games/:id/jackpot/claim", axum::routing::post(web::handlers::transaction::claim_jackpot))
        // Dice Routes
        .route("/games/:id/roll", axum::routing::post(web::handlers::dice::roll_dice))
        .route("/games/:id/rolls", axum::routing::get(web::handlers::dice::get_history))
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .layer(
            tower_http::cors::CorsLayer::new()
                .allow_origin(tower_http::cors::Any)
                .allow_methods([
                    http::Method::GET,
                    http::Method::POST,
                    http::Method::PUT,
                    http::Method::DELETE,
                    http::Method::OPTIONS,
                ])
                .allow_headers([
                    http::header::CONTENT_TYPE,
                    http::header::AUTHORIZATION,
                ]),
        )
        .with_state(app_state);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    tracing::info!("signal received, starting graceful shutdown");
}
