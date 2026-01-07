import { Dialog, DialogContent, Box, Typography, Button, keyframes } from '@mui/material';
import { useState } from 'react';
import BovedaCard from './BovedaCard';
import { useCards, Card } from '@/hooks/useCards';

// Flip animation
const flipIn = keyframes`
  from { transform: rotateY(90deg); opacity: 0; }
  to { transform: rotateY(0deg); opacity: 1; }
`;

interface CardDrawerProps {
    open: boolean;
    onClose: () => void;
    gameId: string;
    type: 'arca' | 'fortuna' | 'bonificacion';
}

export default function CardDrawer({ open, onClose, gameId, type }: CardDrawerProps) {
    const { drawCardMutation } = useCards(gameId);
    const [card, setCard] = useState<Card | null>(null);
    const [drawn, setDrawn] = useState(false);

    const handleDraw = () => {
        drawCardMutation.mutate({ type }, {
            onSuccess: (data) => {
                setCard(data);
                setDrawn(true);
            }
        });
    };

    const handleClose = () => {
        setCard(null);
        setDrawn(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogContent sx={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, bgcolor: '#f5f5f5' }}>
                {!drawn ? (
                    <Box textAlign="center">
                        <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                            {type} Deck
                        </Typography>
                        <Box
                            onClick={handleDraw}
                            sx={{
                                width: 200, height: 280,
                                bgcolor: type === 'arca' ? '#1976D2' : type === 'fortuna' ? '#FFA000' : '#9C27B0',
                                borderRadius: 3,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white',
                                cursor: 'pointer',
                                boxShadow: 6,
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.05)' }
                            }}
                        >
                            <Typography variant="h3">?</Typography>
                        </Box>
                        <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                            Tap to Draw
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ animation: `${flipIn} 0.6s ease-out`, width: '100%', maxWidth: 350 }}>
                        {card && (
                            <BovedaCard
                                title={card.title}
                                description={card.description}
                                color={type === 'arca' ? 'blue' : type === 'fortuna' ? 'orange' : 'purple'}
                            // Action is automated or informational
                            />
                        )}
                        <Button onClick={handleClose} fullWidth variant="contained" sx={{ mt: 3 }}>
                            Okay
                        </Button>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
