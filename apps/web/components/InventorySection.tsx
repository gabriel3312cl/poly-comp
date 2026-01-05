import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid } from '@mui/material';
import { useCards } from '@/hooks/useCards';
import BovedaCard from './BovedaCard';
import { useState } from 'react';

interface InventorySectionProps {
    gameId: string;
}

export default function InventorySection({ gameId }: InventorySectionProps) {
    const { inventory, inventoryLoading, useCardMutation } = useCards(gameId);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    if (inventoryLoading) return <Typography variant="caption">Loading cards...</Typography>;

    if (!inventory || inventory.length === 0) {
        return (
            <Box p={2} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                    You have no saved cards.
                </Typography>
            </Box>
        );
    }

    // Group active vs passive? 
    // Filter active: Yellow (passive) vs Red/Arca/Fortuna (one-time).
    // For now list all by date.

    const handleUseClick = (id: string) => {
        setSelectedCardId(id);
    };

    const handleConfirmUse = () => {
        if (selectedCardId) {
            useCardMutation.mutate(selectedCardId, {
                onSuccess: () => setSelectedCardId(null)
            });
        }
    };

    return (
        <Box sx={{ p: 2, overflowY: 'auto', maxHeight: '100%' }}>
            <Typography variant="h6" gutterBottom>
                My Cards ({inventory.length})
            </Typography>

            <Grid container spacing={2} direction="column">
                {inventory.map((card) => (
                    <Grid item key={card.id}>
                        <BovedaCard
                            title={card.title}
                            description={card.description}
                            color={card.color || (card.type_ === 'arca' ? 'blue' : 'orange')}
                            useable={true}
                            onUse={() => handleUseClick(card.id)}
                            disabled={useCardMutation.isPending}
                        />
                    </Grid>
                ))}
            </Grid>

            {/* Confirmation Dialog */}
            <Dialog open={!!selectedCardId} onClose={() => setSelectedCardId(null)}>
                <DialogTitle>Use Card?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to use this card?
                        Some cards are one-time use and will be discarded.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedCardId(null)}>Cancel</Button>
                    <Button onClick={handleConfirmUse} variant="contained" color="success">
                        Confirm Use
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
