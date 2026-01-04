use std::sync::Arc;
use crate::application::{
    user_service::UserService,
    game_service::GameService,
    transaction_service::TransactionService,
    dice_service::DiceService, // Added this line
};
use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub user_service: Arc<UserService>,
    pub game_service: Arc<GameService>,
    pub transaction_service: Arc<TransactionService>,
    pub dice_service: Arc<DiceService>, // Added this line
    pub config: Config,
}
