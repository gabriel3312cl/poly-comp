import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid } from '@mui/material';
import { useCards } from '@/hooks/useCards';
import BovedaCard from './BovedaCard';
import { useState } from 'react';
import GlobalInventoryModal from './GlobalInventoryModal';

interface InventorySectionProps {
    gameId: string;
}

export default function InventorySection({ gameId }: InventorySectionProps) {
    const { inventory, inventoryLoading, useCardMutation, discardCardMutation } = useCards(gameId);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [confirmDiscardId, setConfirmDiscardId] = useState<string | null>(null);
    const [globalModalOpen, setGlobalModalOpen] = useState(false);

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

    const handleDiscardClick = (id: string) => {
        setConfirmDiscardId(id);
    };

    const handleConfirmDiscard = () => {
        if (confirmDiscardId) {
            discardCardMutation.mutate(confirmDiscardId, {
                onSuccess: () => setConfirmDiscardId(null)
            });
        }
    };

    // Check for Dado de Compra
    const hasDadoDeCompra = inventory?.some((c: any) => c.title === "Dado de Compra") ?? false;

    if (inventoryLoading) return <Typography variant="caption">Loading cards...</Typography>;

    return (
        <Box sx={{ p: 2, overflowY: 'auto', maxHeight: '100%' }}>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                    My Cards ({inventory?.length || 0})
                </Typography>
                <Button variant="outlined" size="small" onClick={() => setGlobalModalOpen(true)}>
                    View All {hasDadoDeCompra && "(Special Action)"}
                </Button>
            </Box>

            {!inventory || inventory.length === 0 ? (
                <Box p={2} textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                        You have no saved cards.
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={2} direction="column">
                    {inventory.map((card) => {
                        const isPassive = card.color === 'yellow';
                        // Determine display color if missing
                        const displayColor = card.color || (card.type_ === 'arca' ? 'blue' : 'orange');

                        return (
                            <Grid size={{ xs: 12 }} key={card.id}>
                                <BovedaCard
                                    title={card.title}
                                    description={card.description}
                                    color={displayColor}
                                    useable={!isPassive}
                                    discardable={true}
                                    onUse={() => handleUseClick(card.id)}
                                    onDiscard={() => handleDiscardClick(card.id)}
                                    disabled={useCardMutation.isPending || discardCardMutation.isPending}
                                />
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Use Confirmation Dialog */}
            <Dialog open={!!selectedCardId} onClose={() => setSelectedCardId(null)}>
                <DialogTitle>Use Card?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to use this card?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedCardId(null)}>Cancel</Button>
                    <Button onClick={handleConfirmUse} variant="contained" color="success">
                        Confirm Use
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Discard Confirmation Dialog */}
            <Dialog open={!!confirmDiscardId} onClose={() => setConfirmDiscardId(null)}>
                <DialogTitle>Discard Card?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to discard this card?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDiscardId(null)}>Cancel</Button>
                    <Button onClick={handleConfirmDiscard} variant="contained" color="error">
                        Discard
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Global Inventory Modal */}
            <GlobalInventoryModal
                open={globalModalOpen}
                onClose={() => setGlobalModalOpen(false)}
                gameId={gameId}
                hasDadoDeCompra={hasDadoDeCompra}
                myInventory={inventory || []}
            />
        </Box>
    );
}
