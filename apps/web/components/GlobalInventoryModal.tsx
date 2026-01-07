import { Dialog, DialogTitle, DialogContent, Box, Typography, Card, CardContent, Divider, Button, Chip, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { getAllInventories, executeSpecialAction } from '../utils/api';
import { useAuthStore } from '../store/authStore';

// Types (should ideally be shared or imported, defining locally for speed)
interface ParticipantCardWithUser {
    user_id: string;
    user_name: string;
    card: {
        id: string; // Inventory ID
        participant_id: string;
        card_id: string;
        title: string;
        description: string;
        color?: string;
        type_?: string;
    };
}

interface GlobalInventoryModalProps {
    open: boolean;
    onClose: () => void;
    gameId: string;
    hasDadoDeCompra: boolean; // Permission to act
    myInventory: any[]; // To select card for exchange
}

export default function GlobalInventoryModal({ open, onClose, gameId, hasDadoDeCompra, myInventory }: GlobalInventoryModalProps) {
    const [items, setItems] = useState<ParticipantCardWithUser[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();
    const [exchangeMode, setExchangeMode] = useState<{ targetId: string } | null>(null);

    const fetchInventories = async () => {
        setLoading(true);
        try {
            const data = await getAllInventories(gameId);
            setItems(data);
        } catch (e) {
            console.error("Failed to fetch inventories", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchInventories();
        }
    }, [open, gameId]);

    const handleAction = async (action: string, targetInvId: string, myCardId?: string) => {
        try {
            await executeSpecialAction(gameId, action, targetInvId, myCardId);
            // Refresh
            fetchInventories();
            if (action === 'exchange') setExchangeMode(null);
            alert(`Action ${action} successful!`);
        } catch (e) {
            console.error(e);
            alert("Action failed");
        }
    };

    // Group by User
    const grouped = items.reduce((acc, item) => {
        if (!acc[item.user_name]) acc[item.user_name] = [];
        acc[item.user_name].push(item);
        return acc;
    }, {} as Record<string, ParticipantCardWithUser[]>);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>All Inventories {hasDadoDeCompra && <Chip label="Dado de Compra Active" color="warning" size="small" />}</DialogTitle>
            <DialogContent>
                {loading && <Typography>Loading...</Typography>}

                {Object.entries(grouped).map(([userName, cards]) => (
                    <Box key={userName} mb={3}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {userName} {user?.username === userName ? "(You)" : ""}
                        </Typography>
                        <Divider />
                        <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                            {cards.map((item) => {
                                const isMine = item.user_id === user?.id;
                                return (
                                    <Card key={item.card.id} variant="outlined" sx={{ width: 220, m: 1, position: 'relative' }}>
                                        <CardContent>
                                            <Typography variant="subtitle2" noWrap title={item.card.title}>
                                                {item.card.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', height: 40, overflow: 'hidden' }}>
                                                {item.card.description}
                                            </Typography>

                                            {/* Actions */}
                                            {!isMine && hasDadoDeCompra && (
                                                <Box mt={1} display="flex" flexDirection="column" gap={0.5}>
                                                    <Button size="small" variant="outlined" color="primary" onClick={() => handleAction('buy', item.card.id)}>
                                                        Steal/Buy
                                                    </Button>
                                                    <Button size="small" variant="outlined" color="error" onClick={() => handleAction('destroy', item.card.id)}>
                                                        Destroy
                                                    </Button>
                                                    {exchangeMode?.targetId === item.card.id ? (
                                                        <Box bgcolor="grey.100" p={1}>
                                                            <Typography variant="caption">Select your card to swap:</Typography>
                                                            {myInventory.map(my => (
                                                                <Button key={my.id} size="small" onClick={() => handleAction('exchange', item.card.id, my.id)}>
                                                                    {my.title}
                                                                </Button>
                                                            ))}
                                                            <Button size="small" onClick={() => setExchangeMode(null)}>Cancel</Button>
                                                        </Box>
                                                    ) : (
                                                        <Button size="small" variant="outlined" color="info" onClick={() => setExchangeMode({ targetId: item.card.id })}>
                                                            Exchange
                                                        </Button>
                                                    )}
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Stack>
                    </Box>
                ))}
            </DialogContent>
        </Dialog>
    );
}
