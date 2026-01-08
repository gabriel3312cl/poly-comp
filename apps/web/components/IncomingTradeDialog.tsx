import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Stack, Grid, Chip
} from '@mui/material';
import { Trade, useTradeActions } from '@/hooks/useTrades';
import { GameParticipant } from '@/hooks/useGame';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface IncomingTradeDialogProps {
    trade: Trade | null;
    gameId: string;
    userId: string; // My User ID to verify I am target
    participants: GameParticipant[];
    onClose: () => void; // local close merely hides it, but action is needed
}

export default function IncomingTradeDialog({ trade, gameId, userId, participants, onClose }: IncomingTradeDialogProps) {
    const { acceptTrade, rejectTrade } = useTradeActions(gameId);

    if (!trade || trade.status !== 'PENDING') return null;

    // Find Initiator
    const initiator = participants.find(p => p.id === trade.initiator_id);
    const initiatorName = initiator ? `${initiator.first_name} ${initiator.last_name}` : 'Unknown';

    // Parse content (properties are IDs, ideally we should map them to names if available, but for now we just show Count or raw ID if we don't have list handy. 
    // Ideally we pass full property list to this component OR fetch it.)
    // For simplicity V1: Show "X Properties" and cash amount.

    const handleAccept = () => {
        acceptTrade.mutate({ tradeId: trade.id, userId }, { onSuccess: onClose });
    };

    const handleReject = () => {
        rejectTrade.mutate({ tradeId: trade.id, userId }, { onSuccess: onClose });
    };

    return (
        <Dialog open={true} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                    <SwapHorizIcon />
                    <Typography variant="h6">Incoming Trade Proposal</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="subtitle1" align="center" gutterBottom>
                    <strong>{initiatorName}</strong> wants to trade with you!
                </Typography>

                <Grid container spacing={2} mt={1}>
                    <Grid size={{ xs: 6 }}>
                        <Box p={2} border="1px solid #ddd" borderRadius={2} textAlign="center">
                            <Typography variant="caption" color="text.secondary">THEY OFFER</Typography>
                            <Typography variant="h5" color="success.main">${trade.offer_cash.toLocaleString()}</Typography>
                            {trade.offer_properties && (
                                <Box mt={1}>
                                    <Chip label={`${trade.offer_properties[0].length} Properties`} size="small" />
                                </Box>
                            )}
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Box p={2} border="1px solid #ddd" borderRadius={2} textAlign="center">
                            <Typography variant="caption" color="text.secondary">THEY WANT</Typography>
                            <Typography variant="h5" color="error.main">${trade.request_cash.toLocaleString()}</Typography>
                            {trade.request_properties && (
                                <Box mt={1}>
                                    <Chip label={`${trade.request_properties[0].length} Properties`} size="small" />
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', p: 2 }}>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleReject}
                    startIcon={<CancelIcon />}
                >
                    Reject
                </Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={handleAccept}
                    startIcon={<CheckCircleIcon />}
                >
                    Accept Trade
                </Button>
            </DialogActions>
        </Dialog>
    );
}
