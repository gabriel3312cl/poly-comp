import { Box, Grid, Typography, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import BovedaCard from './BovedaCard';
import { useCards } from '@/hooks/useCards';

interface BovedaMarketProps {
    gameId: string;
    mode: 'view' | 'buy' | 'exchange'; // Controls what buttons are shown
    onActionComplete?: () => void;
}

export default function BovedaMarket({ gameId, mode, onActionComplete }: BovedaMarketProps) {
    const { market, marketLoading, buyMarketCardMutation, exchangeMarketCardMutation } = useCards(gameId);

    if (marketLoading) {
        return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
    }

    if (!market || market.length === 0) {
        return <Typography align="center">El mercado está vacío o cargando...</Typography>;
    }

    const handleBuy = (slotIndex: number) => {
        // Validation could go here (check balance)
        buyMarketCardMutation.mutate(slotIndex, {
            onSuccess: () => onActionComplete && onActionComplete()
        });
    };

    const handleExchange = (slotIndex: number) => {
        exchangeMarketCardMutation.mutate(slotIndex, {
            onSuccess: () => onActionComplete && onActionComplete()
        });
    };

    return (
        <Grid container spacing={2}>
            <AnimatePresence mode="popLayout">
                {[0, 1, 2].map((slotIndex) => {
                    const card = market.find(m => m.slot_index === slotIndex);
                    if (!card) return (
                        <Grid size={{ xs: 12 }} key={`empty-${slotIndex}`}>
                            <Box sx={{ height: 180, bgcolor: 'action.hover', borderRadius: 2, border: '1px dashed rgba(255,255,255,0.1)' }} />
                        </Grid>
                    );

                    return (
                        <Grid size={{ xs: 12 }} key={card.card_id || slotIndex}>
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            >
                                <BovedaCard
                                    title={card.title}
                                    description={card.description}
                                    cost={card.cost}
                                    color={card.color}
                                    purchasable={mode === 'buy'}
                                    canExchange={mode === 'exchange'}
                                    onBuy={() => handleBuy(slotIndex)}
                                    onExchange={() => handleExchange(slotIndex)}
                                    disabled={buyMarketCardMutation.isPending || exchangeMarketCardMutation.isPending}
                                />
                            </motion.div>
                        </Grid>
                    );
                })}
            </AnimatePresence>
        </Grid>
    );
}
