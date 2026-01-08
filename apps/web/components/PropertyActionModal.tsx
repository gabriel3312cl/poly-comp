import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { useGetGameProperties, useGetAllProperties, usePropertyActions } from '@/hooks/useProperties';
import { useAuctionActions } from '@/hooks/useAuctions';
import { BOARD_SPACES } from '@/utils/boardSpaces';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';

interface PropertyActionModalProps {
    gameId: string;
    myPosition: number;
    open?: boolean; // Optional override
}

export default function PropertyActionModal({ gameId, myPosition }: PropertyActionModalProps) {
    const user = useAuthStore(state => state.user);
    const { data: allProperties = [] } = useGetAllProperties();
    const { data: ownership = [] } = useGetGameProperties(gameId);
    const { buyProperty } = usePropertyActions(gameId);
    const { startAuction } = useAuctionActions(gameId);

    const [open, setOpen] = useState(false);

    // Determine current space
    const currentSpace = BOARD_SPACES[myPosition];
    const propertyDef = allProperties.find(p => p.board_position === myPosition);

    // Check ownership
    const owner = propertyDef ? ownership.find(o => o.property_id === propertyDef.id) : null;
    const isUnowned = propertyDef && !owner;
    const isMine = owner?.participant_id === user?.id;

    // Open logic: If I land on a property that is Unowned, prompt to buy.
    // Ideally this triggers only ONCE when position changes.
    // For now, let's show a small permanent floating action or a modal if we just arrived?
    // "Just arrived" requires tracking previous position, which we don't have easily here.
    // Instead, if I am on an unowned property, I should simply have the OPTION to buy.
    // So let's return a floating button or a partial modal that doesn't block but suggests action.

    // Or better: Use a minimal "Action Card" that appears.

    if (!propertyDef || !isUnowned) return null; // Only handle Buy for now. Paying rent is auto/backend typically.

    return (
        <Dialog open={true} maxWidth="xs" fullWidth hideBackdrop sx={{ pointerEvents: 'none', '& .MuiDialog-paper': { pointerEvents: 'auto', position: 'absolute', bottom: 20, left: 20, m: 0 } }}>
            <DialogTitle sx={{ bgcolor: propertyDef.group_color || 'grey', color: 'white', py: 1 }}>
                {propertyDef.name}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <Typography variant="body2">
                    This property is unowned.
                </Typography>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                    Price: ${propertyDef.price}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    onClick={() => user && buyProperty.mutate({ propertyId: propertyDef.id, userId: user.id })}
                    disabled={buyProperty.isPending}
                >
                    Buy Property
                </Button>
                <Button
                    variant="outlined"
                    color="warning"
                    fullWidth
                    onClick={() => startAuction.mutate({ propertyId: propertyDef.id })}
                >
                    Auction
                </Button>
            </DialogActions>
        </Dialog>
    );
}
