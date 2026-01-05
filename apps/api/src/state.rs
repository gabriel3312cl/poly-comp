use std::sync::Arc;
use crate::application::{
    user_service::UserService,
    game_service::GameService,
    transaction_service::TransactionService,
    dice_service::DiceService, 
    roulette_service::RouletteService,
    special_dice_service::SpecialDiceService,
};
use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub user_service: Arc<UserService>,
    pub game_service: Arc<GameService>,
    pub transaction_service: Arc<TransactionService>,
    pub dice_service: Arc<DiceService>, 
    pub roulette_service: Arc<RouletteService>,
    pub special_dice_service: Arc<SpecialDiceService>,
    pub config: Config,
}
