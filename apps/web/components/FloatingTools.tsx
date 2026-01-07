import { Box, Stack, Fab, Tooltip } from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';

import FloatingSpecialDice from './FloatingSpecialDice';
import FloatingCalculator from './FloatingCalculator';

interface FloatingToolsProps {
    gameId: string;
    myParticipantId?: string;
    myUserId?: string;
    onRollDice?: () => void;
}

export default function FloatingTools({ gameId, myParticipantId, myUserId, onRollDice }: FloatingToolsProps) {
    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 32,
                left: 32,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                zIndex: 1000
            }}
        >
            <Stack spacing={2}>
                <FloatingCalculator />
                <FloatingSpecialDice gameId={gameId} myParticipantId={myParticipantId} myUserId={myUserId} />
                {onRollDice && (
                    <Tooltip title="Roll Dice (Shortcut)">
                        <Fab
                            color="error"
                            onClick={onRollDice}
                            size="medium"
                            sx={{
                                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                                boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                            }}
                        >
                            <CasinoIcon />
                        </Fab>
                    </Tooltip>
                )}
            </Stack>
        </Box>
    );
}
