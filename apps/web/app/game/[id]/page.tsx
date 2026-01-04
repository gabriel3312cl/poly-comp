'use client';

import {
    Container,
    Grid,
    Typography,
    Box,
    Button,
    Stack,
    Chip,
    Fab,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { useParams } from 'next/navigation';
import { useGetGame, useGetParticipants, useLeaveGame } from '@/hooks/useGame';
import { useGetTransactions, usePerformTransfer, useUndoTransaction } from '@/hooks/useTransactions';
import ParticipantList from '@/components/ParticipantList';
import TransactionHistory from '@/components/TransactionHistory';
import TransferDialog from '@/components/TransferDialog';
import { useState } from 'react';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // Bank Icon
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useAuthStore } from '@/store/authStore';

export default function GameSessionPage() {
    const { id } = useParams() as { id: string };
    const user = useAuthStore(state => state.user);

    // Queries
    const { data: game } = useGetGame(id);
    const { data: participants = [] } = useGetParticipants(id);
    const { data: transactions = [] } = useGetTransactions(id);

    // Mutations
    const { mutate: transfer, isPending: transferring } = usePerformTransfer();
    const { mutate: undo } = useUndoTransaction();
    const { mutate: leave } = useLeaveGame(id);

    // UI State
    const [transferType, setTransferType] = useState<'PAY' | 'CHARGE' | 'BANK_PAY' | 'BANK_RECEIVE' | null>(null);
    const [targetId, setTargetId] = useState<string | null>(null);

    // Find info
    const me = participants.find(p => p.user_id === user?.id);
    const target = participants.find(p => p.id === targetId);
    const theme = useTheme();
    // const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleTransferClick = (tId: string, type: 'PAY' | 'CHARGE') => {
        setTargetId(tId);
        setTransferType(type);
    };

    const handleBankClick = (type: 'BANK_PAY' | 'BANK_RECEIVE') => {
        setTargetId(null); // Bank is null ID in our logic usually, or requires special handling
        setTransferType(type);
    };

    const handleConfirmTransfer = (amount: number, description: string) => {
        if (!transferType) return;
        if (!game) return;

        const payload: any = { gameId: id, amount, description };

        if (transferType === 'PAY') {
            // Me -> Target
            payload.from_participant_id = me?.id;
            payload.to_participant_id = targetId;
        } else if (transferType === 'CHARGE') {
            // Target -> Me
            payload.from_participant_id = targetId;
            payload.to_participant_id = me?.id;
        } else if (transferType === 'BANK_PAY') {
            // Me -> Bank
            payload.from_participant_id = me?.id;
            payload.to_participant_id = null;
        } else if (transferType === 'BANK_RECEIVE') {
            // Bank -> Me
            payload.from_participant_id = null;
            payload.to_participant_id = me?.id;
        }

        transfer(payload, {
            onSuccess: () => setTransferType(null)
        });
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 10 }}>
            {/* Header Info */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h4" fontWeight="900" color="primary.main">
                        {game?.name || 'Game Session'}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                            label={`CODE: ${game?.code}`}
                            color="secondary"
                            variant="outlined"
                            onClick={() => navigator.clipboard.writeText(game?.code || '')}
                            icon={<ContentCopyIcon fontSize="small" />}
                            sx={{ fontWeight: 'bold', fontSize: '1.2rem', py: 2 }}
                        />
                        <Chip label={game?.status} size="small" />
                    </Stack>
                </Box>

                <Button color="error" startIcon={<ExitToAppIcon />} onClick={() => leave()}>
                    Leave Game
                </Button>
            </Box>

            {/* Main Grid */}
            <Grid container spacing={4}>
                {/* Participants Column */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <ParticipantList
                        participants={participants}
                        onTransfer={handleTransferClick}
                    />

                    {/* Bank Controls (Floating or Block) */}
                    <Box mt={4} p={3} bgcolor="rgba(255,255,255,0.05)" borderRadius={4} border="1px dashed #555">
                        <Typography variant="h6" gutterBottom color="text.secondary"> Bank Actions </Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<AccountBalanceIcon />}
                                onClick={() => handleBankClick('BANK_RECEIVE')}
                                sx={{ flexGrow: 1 }}
                            >
                                Receive (Go, Salary)
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<AccountBalanceIcon />}
                                onClick={() => handleBankClick('BANK_PAY')}
                                sx={{ flexGrow: 1 }}
                            >
                                Pay (Tax, Fines)
                            </Button>
                        </Stack>
                    </Box>
                </Grid>

                {/* History Column */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                        Short History
                    </Typography>
                    <TransactionHistory
                        transactions={transactions}
                        participants={participants}
                        onUndo={(txId) => undo({ gameId: id, txId })}
                    />
                </Grid>
            </Grid>

            {/* Transfer Dialog */}
            <TransferDialog
                open={!!transferType}
                onClose={() => setTransferType(null)}
                onConfirm={handleConfirmTransfer}
                type={transferType || 'PAY'}
                targetName={target ? target.first_name : 'Bank'}
                loading={transferring}
            />
        </Container>
    );
}
