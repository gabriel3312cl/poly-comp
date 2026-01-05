import { Card, Box, Typography, Button, IconButton, Chip } from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface BovedaCardProps {
    title: string;
    description: string;
    cost?: number;
    color?: string; // yellow, red, green
    type?: string;
    actionType?: string;

    // Actions
    onBuy?: () => void;
    onExchange?: () => void;
    onUse?: () => void;

    // UI State
    purchasable?: boolean;
    canExchange?: boolean;
    useable?: boolean;
    disabled?: boolean;
}

const getColorHex = (color?: string) => {
    switch (color) {
        case 'yellow': return '#FBC02D'; // Passives / Abilities
        case 'red': return '#D32F2F'; // Instant Actions / Attack
        case 'green': return '#388E3C'; // Win Conditions
        default: return '#757575';
    }
}

export default function BovedaCard({
    title, description, cost, color, type, actionType,
    onBuy, onExchange, onUse,
    purchasable, canExchange, useable, disabled
}: BovedaCardProps) {
    const borderColor = getColorHex(color);

    return (
        <Card sx={{
            width: '100%',
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            border: `2px solid ${borderColor}`,
            position: 'relative',
            bgcolor: 'background.paper',
            transition: 'transform 0.2s',
            '&:hover': {
                transform: !disabled ? 'translateY(-2px)' : 'none',
                boxShadow: !disabled ? 4 : 1
            }
        }}>
            {/* Header / Cost */}
            <Box sx={{
                bgcolor: borderColor,
                color: 'white',
                p: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: '70%' }}>
                    {title}
                </Typography>
                {cost !== undefined && (
                    <Chip
                        label={`$${cost}`}
                        size="small"
                        sx={{ bgcolor: 'rgba(0,0,0,0.2)', color: 'white', fontWeight: 'bold' }}
                    />
                )}
            </Box>

            {/* Content */}
            <Box sx={{ p: 2, flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    {description}
                </Typography>
            </Box>

            {/* Actions */}
            <Box sx={{ p: 1, display: 'flex', gap: 1, justifyContent: 'center', borderTop: '1px solid #eee' }}>
                {purchasable && onBuy && (
                    <Button
                        startIcon={<MonetizationOnIcon />}
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={onBuy}
                        disabled={disabled}
                        fullWidth
                    >
                        Buy
                    </Button>
                )}

                {canExchange && onExchange && (
                    <Button
                        startIcon={<SwapHorizIcon />}
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={onExchange}
                        disabled={disabled}
                        fullWidth
                    >
                        Swap
                    </Button>
                )}

                {useable && onUse && (
                    <Button
                        startIcon={<PlayArrowIcon />}
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={onUse}
                        disabled={disabled}
                        fullWidth
                    >
                        Use
                    </Button>
                )}
            </Box>
        </Card>
    );
}
