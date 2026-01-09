import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Stack, Avatar
} from '@mui/material';
import { Auction, useAuctionActions } from '@/hooks/useAuctions';
import { GameParticipant } from '@/hooks/useGame';
import { useAuthStore } from '@/store/authStore';
import { useGetAllProperties } from '@/hooks/useProperties';
import GavelIcon from '@mui/icons-material/Gavel';
import { toast } from 'react-hot-toast';

interface AuctionModalProps {
    auction: Auction | null;
    participants: GameParticipant[];
    isHost: boolean;
}

export default function AuctionModal({ auction, participants, isHost }: AuctionModalProps) {
    const user = useAuthStore(s => s.user);
    const { data: properties } = useGetAllProperties();
    const { placeBid, endAuction } = useAuctionActions(auction?.game_id || '');

    if (!auction || auction.status !== 'ACTIVE') return null;

    const property = properties?.find(p => p.id === auction.property_id);
    const highestBidder = participants.find(p => p.id === auction.highest_bidder_id);
    const currentBid = Number(auction.current_bid);

    const handleBid = (amount: number) => {
        if (!user) return;
        placeBid.mutate({ auctionId: auction.id, userId: user.id, amount }, {
            onError: (e: any) => toast.error(e.response?.data || e.message || 'Error al pujar')
        });
    };

    const handleEnd = () => {
        endAuction.mutate({ auctionId: auction.id }, {
            onSuccess: () => toast.success('¡Subasta finalizada!'),
            onError: (e: any) => toast.error(e.response?.data || e.message || 'Error al finalizar subasta')
        });
    };

    return (
        <Dialog open={true} maxWidth="sm" fullWidth disableEscapeKeyDown>
            <DialogTitle sx={{ textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                    <GavelIcon />
                    <Typography variant="h5" fontWeight="bold">SUBASTA EN CURSO</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Box textAlign="center" py={2}>
                    <Typography variant="h6" gutterBottom>{property?.name || 'Propiedad Desconocida'}</Typography>
                    {property?.group_color && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Grupo: {property.group_color}
                        </Typography>
                    )}

                    <Box my={3} p={2} bgcolor="background.defaut" borderRadius={2} border="1px solid" borderColor="divider">
                        <Typography variant="subtitle2" color="text.secondary">Oferta más alta actual</Typography>
                        <Typography variant="h3" color="success.main" fontWeight="bold">
                            ${currentBid.toLocaleString()}
                        </Typography>
                        {highestBidder ? (
                            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} mt={1}>
                                <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{highestBidder.first_name[0]}</Avatar>
                                <Typography fontWeight="medium">{highestBidder.first_name} {highestBidder.last_name}</Typography>
                            </Stack>
                        ) : (
                            <Typography variant="caption" color="text.disabled">Sin ofertas aún</Typography>
                        )}
                    </Box>

                    <Stack spacing={2}>
                        <Stack direction="row" spacing={1} justifyContent="center">
                            {[10, 50, 100].map(inc => (
                                <Button
                                    key={inc}
                                    variant="outlined"
                                    onClick={() => handleBid(currentBid + inc)}
                                    disabled={placeBid.isPending}
                                >
                                    +${inc}
                                </Button>
                            ))}
                        </Stack>

                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            fullWidth
                            onClick={() => handleBid(currentBid + 10)}
                            disabled={placeBid.isPending}
                        >
                            PUJAR ${(currentBid + 10).toLocaleString()}
                        </Button>
                    </Stack>
                </Box>
            </DialogContent>
            {isHost && (
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleEnd}
                        disabled={endAuction.isPending}
                    >
                        ¡VENDIDO! (Finalizar Subasta)
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
}
