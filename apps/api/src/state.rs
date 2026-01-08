use std::sync::Arc;
use crate::application::{
    user_service::UserService,
    game_service::GameService,
    transaction_service::TransactionService,
    dice_service::DiceService, 
    roulette_service::RouletteService,
    special_dice_service::SpecialDiceService,
    card_service::CardService,
    property_service::PropertyService,
    auction_service::AuctionService,
    trade_service::TradeService,
};
use crate::config::Config;
use tokio::sync::broadcast;
use crate::domain::events::GameEvent;

#[derive(Clone)]
pub struct AppState {
    pub user_service: Arc<UserService>,
    pub game_service: Arc<GameService>,
    pub transaction_service: Arc<TransactionService>,
    pub dice_service: Arc<DiceService>, 
    pub roulette_service: Arc<RouletteService>,
    pub special_dice_service: Arc<SpecialDiceService>,
    pub card_service: Arc<CardService>,
    pub property_service: Arc<PropertyService>,
    pub auction_service: Arc<AuctionService>,
    pub trade_service: Arc<TradeService>,
    pub config: Config,
    pub tx: broadcast::Sender<GameEvent>,
}
