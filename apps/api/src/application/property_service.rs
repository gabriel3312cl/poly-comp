use std::sync::Arc;
use uuid::Uuid;
use crate::domain::{
    entities::{Property, ParticipantProperty},
    repositories::{PropertyRepository, ParticipantRepository},
    events::GameEvent,
};
use crate::application::transaction_service::TransactionService;

pub struct PropertyService {
    property_repo: Arc<dyn PropertyRepository + Send + Sync>,
    participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
    transaction_service: Arc<TransactionService>,
    _tx: tokio::sync::broadcast::Sender<GameEvent>,
}

impl PropertyService {
    pub fn new(
        property_repo: Arc<dyn PropertyRepository + Send + Sync>,
        participant_repo: Arc<dyn ParticipantRepository + Send + Sync>,
        transaction_service: Arc<TransactionService>,
        _tx: tokio::sync::broadcast::Sender<GameEvent>,
    ) -> Self {
        Self { property_repo, participant_repo, transaction_service, _tx }
    }

    pub async fn get_all_properties(&self) -> Result<Vec<Property>, anyhow::Error> {
        self.property_repo.find_all_properties().await
    }

    pub async fn get_game_ownership(&self, game_id: Uuid) -> Result<Vec<ParticipantProperty>, anyhow::Error> {
        self.property_repo.find_ownership_by_game(game_id).await
    }

    pub async fn buy_property(&self, game_id: Uuid, user_id: Uuid, property_id: Uuid) -> Result<ParticipantProperty, anyhow::Error> {
        // 1. Get Property Details
        let property = self.property_repo.find_property_by_id(property_id).await?
            .ok_or_else(|| anyhow::anyhow!("Property not found"))?;

        // 2. Get Participant
        let participants = self.participant_repo.find_by_game_id(game_id).await?;
        let participant = participants.iter().find(|p| p.user_id == user_id)
            .ok_or_else(|| anyhow::anyhow!("Participant not found"))?;

        // 3. Check if already owned
        let ownership = self.property_repo.find_ownership_by_game(game_id).await?;
        if ownership.iter().any(|p| p.property_id == property_id) {
             return Err(anyhow::anyhow!("Property is already owned"));
        }

        // 4. Deduct Balance (Pay Bank)
        self.transaction_service.transfer(
            game_id,
            Some(participant.id),
            None, // Bank
            property.price.clone(),
            Some(format!("Bought {}", property.name))
        ).await?;

        // 5. Assign Property
        let pp = ParticipantProperty {
            id: Uuid::new_v4(),
            game_id,
            participant_id: participant.id,
            property_id,
            is_mortgaged: false,
            house_count: 0,
            hotel_count: 0,
            property_name: Some(property.name.clone()),
            group_color: Some(property.group_color.clone()),
        };

        let stored = self.property_repo.assign_property(pp).await?;

        // 6. Broadcast Event (Ideally PropertyUpdated event)
        // For now, client refreshes or we add new event type.
        // I will rely on polling or generic refresh.
        // Better: self.tx.send(GameEvent::PropertyUpdated(stored.clone())); 
        // I need to add PropertyUpdated to GameEvent enum.

        Ok(stored)
    }

    // Mortgage
    pub async fn mortgage_property(&self, game_id: Uuid, user_id: Uuid, property_id: Uuid) -> Result<ParticipantProperty, anyhow::Error> {
        let property = self.property_repo.find_property_by_id(property_id).await?
            .ok_or_else(|| anyhow::anyhow!("Property not found"))?;

        // Verify ownership
        let participants = self.participant_repo.find_by_game_id(game_id).await?;
        let participant = participants.iter().find(|p| p.user_id == user_id)
             .ok_or_else(|| anyhow::anyhow!("Participant not found"))?;

        let owned_list = self.property_repo.find_participant_properties(game_id, participant.id).await?;
        let mut owned = owned_list.iter().find(|p| p.property_id == property_id)
            .ok_or_else(|| anyhow::anyhow!("You do not own this property"))?
            .clone();

        if owned.is_mortgaged {
            return Err(anyhow::anyhow!("Already mortgaged"));
        }
        
        if owned.house_count > 0 || owned.hotel_count > 0 {
             return Err(anyhow::anyhow!("Must sell buildings first"));
        }

        // Mortgage it
        owned.is_mortgaged = true;
        self.property_repo.update_property_ownership(owned.clone()).await?;

        // Give Cash
        self.transaction_service.transfer(
            game_id,
            None, // Bank
            Some(participant.id),
            property.mortgage_value.clone(),
            Some(format!("Mortgaged {}", property.name))
        ).await?;

        Ok(owned)
    }

    pub async fn unmortgage_property(&self, game_id: Uuid, user_id: Uuid, property_id: Uuid) -> Result<ParticipantProperty, anyhow::Error> {
        let property = self.property_repo.find_property_by_id(property_id).await?
            .ok_or_else(|| anyhow::anyhow!("Property not found"))?;

        let participants = self.participant_repo.find_by_game_id(game_id).await?;
        let participant = participants.iter().find(|p| p.user_id == user_id)
             .ok_or_else(|| anyhow::anyhow!("Participant not found"))?;

        let owned_list = self.property_repo.find_participant_properties(game_id, participant.id).await?;
        let mut owned = owned_list.iter().find(|p| p.property_id == property_id)
            .ok_or_else(|| anyhow::anyhow!("You do not own this property"))?
            .clone();

        if !owned.is_mortgaged {
            return Err(anyhow::anyhow!("Property is not mortgaged"));
        }

        // Pay Bank
        self.transaction_service.transfer(
            game_id,
            Some(participant.id),
            None,
            property.unmortgage_cost.clone(),
            Some(format!("Unmortgaged {}", property.name))
        ).await?;

        owned.is_mortgaged = false;
        self.property_repo.update_property_ownership(owned.clone()).await?;

        Ok(owned)
    }

    pub async fn buy_building(&self, game_id: Uuid, user_id: Uuid, property_id: Uuid) -> Result<ParticipantProperty, anyhow::Error> {
        // 1. Get Property
        let property = self.property_repo.find_property_by_id(property_id).await?
            .ok_or_else(|| anyhow::anyhow!("Property not found"))?;

        // 2. Verify it's buildable
        let house_cost = property.house_cost.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Cannot build on this property"))?;
        let hotel_cost = property.hotel_cost.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Cannot build on this property"))?;

        // 3. Get Participant
        let participants = self.participant_repo.find_by_game_id(game_id).await?;
        let participant = participants.iter().find(|p| p.user_id == user_id)
             .ok_or_else(|| anyhow::anyhow!("Participant not found"))?;

        // 4. Verify Ownership and Monopoly
        let all_props = self.property_repo.find_all_properties().await?;
        let group_props: Vec<&Property> = all_props.iter().filter(|p| p.group_color == property.group_color).collect();
        
        // My owned properties
        let owned_list = self.property_repo.find_participant_properties(game_id, participant.id).await?;
        
        // Check if I own ALL properties in this group
        for gp in group_props.iter() {
            if !owned_list.iter().any(|op| op.property_id == gp.id) {
                return Err(anyhow::anyhow!("You must own all properties of this color group to build!"));
            }
            // Also check if any is mortgaged? Rules usually say yes.
            let my_prop = owned_list.iter().find(|op| op.property_id == gp.id).unwrap();
            if my_prop.is_mortgaged {
                 return Err(anyhow::anyhow!("Cannot build if any property in group is mortgaged"));
            }
        }

        // 5. Get current ownership record for target
        let mut target_own = owned_list.iter().find(|p| p.property_id == property_id)
            .cloned() // Clone to modify
            .unwrap();

        // 6. Check Limits and Even Build (Optional strict rule: diff max 1. Skipping strict even build for simplicity V1, but checking max cap)
        // Max 4 houses, then Hotel (which is 0 houses, 1 hotel).
        
        let mut cost = house_cost;
        let is_hotel_upgrade = target_own.house_count == 4;

        if target_own.hotel_count > 0 {
            return Err(anyhow::anyhow!("Maximum buildings reached (Hotel)"));
        }

        if is_hotel_upgrade {
            cost = hotel_cost; // Use hotel cost
        }

        // 7. Pay
        self.transaction_service.transfer(
            game_id,
            Some(participant.id),
            None,
            cost.clone(),
            Some(format!("Bought Building for {}", property.name))
        ).await?;

        // 8. Update State
        if is_hotel_upgrade {
            target_own.house_count = 0;
            target_own.hotel_count = 1;
        } else {
            target_own.house_count += 1;
        }

        let updated = self.property_repo.update_property_ownership(target_own).await?;
        Ok(updated)
    }

    pub async fn sell_building(&self, game_id: Uuid, user_id: Uuid, property_id: Uuid) -> Result<ParticipantProperty, anyhow::Error> {
        let property = self.property_repo.find_property_by_id(property_id).await?
            .ok_or_else(|| anyhow::anyhow!("Property not found"))?;
        
        let house_cost = property.house_cost.as_ref()
             .ok_or_else(|| anyhow::anyhow!("No buildings allowed"))?;
        // Half price
        use bigdecimal::Zero;
        use std::ops::Div;
        let refund = house_cost.div(bigdecimal::BigDecimal::from(2)); // simplistic half

        let participants = self.participant_repo.find_by_game_id(game_id).await?;
        let participant = participants.iter().find(|p| p.user_id == user_id)
             .ok_or_else(|| anyhow::anyhow!("Participant not found"))?;
        
        let owned_list = self.property_repo.find_participant_properties(game_id, participant.id).await?;
        let mut target_own = owned_list.iter().find(|p| p.property_id == property_id)
            .cloned().unwrap();

        if target_own.hotel_count > 0 {
            // Sell Hotel -> 4 Houses
            // Actually, usually you sell 1 building at a time. Hotel -> 4 houses adds value?
            // "Selling a hotel gives you half price of hotel cost, and returns 4 houses."
            // Detailed rules: "Hotels can be sold back... for 4 houses."
            // Simplified V1: DOWNGRADE. Hotel -> 4 Houses. Refund (HotelCost / 2).
            let h_refund = property.hotel_cost.as_ref().unwrap().div(bigdecimal::BigDecimal::from(2));
             
            self.transaction_service.transfer(
                game_id,
                None,
                Some(participant.id),
                h_refund,
                Some(format!("Sold Hotel on {}", property.name))
            ).await?;

            target_own.hotel_count = 0;
            target_own.house_count = 4;
        } else if target_own.house_count > 0 {
            // Sell House
             self.transaction_service.transfer(
                game_id,
                None,
                Some(participant.id),
                refund,
                Some(format!("Sold House on {}", property.name))
            ).await?;
            target_own.house_count -= 1;
        } else {
             return Err(anyhow::anyhow!("No buildings to sell"));
        }

        let updated = self.property_repo.update_property_ownership(target_own).await?;
        Ok(updated)
    }
}
