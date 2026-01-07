
import { Box, Stack } from '@mui/material';

import FloatingSpecialDice from './FloatingSpecialDice';
import FloatingCalculator from './FloatingCalculator';

interface FloatingToolsProps {
    gameId: string;
    myParticipantId?: string;
    myUserId?: string;
}

export default function FloatingTools({ gameId, myParticipantId, myUserId }: FloatingToolsProps) {
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

            </Stack>
        </Box>
    );
}
