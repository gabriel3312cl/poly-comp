import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Stack, Grid,
    Select, MenuItem, FormControl, InputLabel,
    Checkbox, ListItemText, TextField, Divider,
    Avatar
} from '@mui/material';
import { useState, useMemo } from 'react';
import { GameParticipant } from '@/hooks/useGame';
import { ParticipantProperty } from '@/hooks/useProperties';
import { useTradeActions } from '@/hooks/useTrades';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

interface TradeModalProps {
    open: boolean;
    onClose: () => void;
    gameId: string;
    me: GameParticipant;
    opponent: GameParticipant;
    myProperties: ParticipantProperty[];
    opponentProperties: ParticipantProperty[];
}

export default function TradeModal({
    open, onClose, gameId,
    me, opponent,
    myProperties, opponentProperties
}: TradeModalProps) {
    const { createTrade } = useTradeActions(gameId);

    // Offer State
    const [offerCash, setOfferCash] = useState<number>(0);
    const [offerProps, setOfferProps] = useState<string[]>([]);

    // Request State
    const [reqCash, setReqCash] = useState<number>(0);
    const [reqProps, setReqProps] = useState<string[]>([]);

    const handlePropose = () => {
        const tradeData = {
            game_id: gameId,
            initiator_id: me.id,
            target_id: opponent.id,
            offer_cash: offerCash,
            offer_properties: offerProps.length > 0 ? { 0: offerProps } : null,
            offer_cards: null,
            request_cash: reqCash,
            request_properties: reqProps.length > 0 ? { 0: reqProps } : null,
            request_cards: null
        };
        createTrade.mutate(tradeData, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ textAlign: 'center', bgcolor: 'primary.dark', color: 'white' }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                    <Typography variant="h5">Propose Trade</Typography>
                    <SwapHorizIcon />
                    <Typography variant="subtitle1" color="grey.400">with {opponent.first_name}</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={4}>
                    {/* My Offer (Left) */}
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="h6" align="center" gutterBottom color="primary.main">
                            YOU OFFER
                        </Typography>
                        <Box p={2} bgcolor="background.paper" borderRadius={2} border="1px solid #ddd">
                            <Stack spacing={2}>
                                <TextField
                                    label="Cash Offer"
                                    type="number"
                                    size="small"
                                    value={offerCash}
                                    onChange={(e) => setOfferCash(Math.max(0, Number(e.target.value)))}
                                    helperText={`Max: $${me.balance}`}
                                />

                                <FormControl size="small">
                                    <InputLabel>Properties</InputLabel>
                                    <Select
                                        multiple
                                        value={offerProps}
                                        onChange={(e) => setOfferProps(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                        renderValue={(selected) => selected.length + ' selected'}
                                    >
                                        {myProperties.map((p) => (
                                            <MenuItem key={p.property_id} value={p.property_id}>
                                                <Checkbox checked={offerProps.indexOf(p.property_id) > -1} />
                                                <ListItemText primary={p.property_name || 'Property'} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>
                    </Grid>

                    {/* Their Offer (Right) */}
                    <Grid size={{ xs: 6 }}>
                        <Typography variant="h6" align="center" gutterBottom color="secondary.main">
                            YOU WANT
                        </Typography>
                        <Box p={2} bgcolor="background.paper" borderRadius={2} border="1px solid #ddd">
                            <Stack spacing={2}>
                                <TextField
                                    label="Cash Request"
                                    type="number"
                                    size="small"
                                    value={reqCash}
                                    onChange={(e) => setReqCash(Math.max(0, Number(e.target.value)))}
                                    helperText={`Max: $${opponent.balance}`}
                                />

                                <FormControl size="small">
                                    <InputLabel>Properties</InputLabel>
                                    <Select
                                        multiple
                                        value={reqProps}
                                        onChange={(e) => setReqProps(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                        renderValue={(selected) => selected.length + ' selected'}
                                    >
                                        {opponentProperties.map((p) => (
                                            <MenuItem key={p.property_id} value={p.property_id}>
                                                <Checkbox checked={reqProps.indexOf(p.property_id) > -1} />
                                                <ListItemText primary={p.property_name || 'Property'} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button
                    onClick={handlePropose}
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={createTrade.isPending}
                    startIcon={<SwapHorizIcon />}
                >
                    Propose Trade
                </Button>
            </DialogActions>
        </Dialog>
    );
}
