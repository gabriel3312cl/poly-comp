'use client';

import {
    Card,
    CardContent,
    Typography,
    Avatar,
    Stack,
    IconButton,
    Box,
    Grid,
    Tooltip
} from '@mui/material';
import { GameParticipant } from '@/hooks/useGame';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; // Use as Pay Icon
import CallReceivedIcon from '@mui/icons-material/CallReceived'; // Use as Request?
import SendIcon from '@mui/icons-material/Send';
import { useAuthStore } from '@/store/authStore';

interface ParticipantListProps {
    participants: GameParticipant[];
    onTransfer: (targetId: string, type: 'PAY' | 'CHARGE') => void;
}

export default function ParticipantList({ participants, onTransfer }: ParticipantListProps) {
    const user = useAuthStore((state) => state.user);

    // Sort: Me first, then others
    const sorted = [...participants].sort((a, b) => {
        if (a.user_id === user?.id) return -1;
        if (b.user_id === user?.id) return 1;
        return 0;
    });

    return (
        <Grid container spacing={2}>
            {sorted.map((p) => {
                const isMe = p.user_id === user?.id;

                return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
                        <Card
                            sx={{
                                borderRadius: 4,
                                border: isMe ? '2px solid #7c4dff' : '1px solid #333',
                                bgcolor: 'background.paper',
                                position: 'relative',
                                overflow: 'visible'
                            }}
                        >
                            {isMe && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: -10,
                                        right: 16,
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        px: 1,
                                        borderRadius: 1,
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    YOU
                                </Box>
                            )}

                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{ bgcolor: isMe ? 'primary.main' : 'secondary.main', width: 56, height: 56 }}>
                                        {p.first_name[0]}
                                    </Avatar>

                                    <Box flexGrow={1}>
                                        <Typography variant="h6" fontWeight="bold">
                                            {p.first_name} {p.last_name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            @{p.username}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Box mt={3} mb={1}>
                                    <Typography variant="h4" fontWeight="800" color={p.balance >= 0 ? 'success.light' : 'error.main'}>
                                        ${p.balance.toLocaleString()}
                                    </Typography>
                                </Box>

                                {/* Actions: Only show for others. If it's me, I can't pay myself. */}
                                {!isMe && (
                                    <Stack direction="row" spacing={1} mt={2}>
                                        <Tooltip title="Pay this player">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                sx={{ border: '1px solid', borderColor: 'error.main', borderRadius: 2 }}
                                                onClick={() => onTransfer(p.id, 'PAY')}
                                            >
                                                <SendIcon fontSize="small" /> <Typography variant="caption" ml={0.5}>PAY</Typography>
                                            </IconButton>
                                        </Tooltip>

                                        {/* "Charge" implies I take their money (e.g. they landed on my property) */}
                                        <Tooltip title="Charge this player (Receive)">
                                            <IconButton
                                                size="small"
                                                color="success"
                                                sx={{ border: '1px solid', borderColor: 'success.main', borderRadius: 2 }}
                                                onClick={() => onTransfer(p.id, 'CHARGE')}
                                            >
                                                <CallReceivedIcon fontSize="small" /> <Typography variant="caption" ml={0.5}>CHARGE</Typography>
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                );
            })}
        </Grid>
    );
}
