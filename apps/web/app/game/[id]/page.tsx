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
    useMediaQuery,
    Divider
} from '@mui/material';
import { useParams } from 'next/navigation';
import { useGetGame, useGetParticipants, useLeaveGame, useDeleteGame } from '@/hooks/useGame';
import { useGetTransactions, usePerformTransfer, useUndoTransaction } from '@/hooks/useTransactions';
import ParticipantList from '@/components/ParticipantList';
import TransactionHistory from '@/components/TransactionHistory';
import TransferDialog from '@/components/TransferDialog';
import { useState } from 'react';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // Bank Icon
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import DeleteIcon from '@mui/icons-material/Delete';
import { parseServerDate } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    DialogActions
} from '@mui/material';
import { useUpdateGame } from '@/hooks/useGame';
import { useEffect } from 'react';

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
    const { mutate: deleteGame } = useDeleteGame();
    const { mutate: leave } = useLeaveGame(id);
    const { mutate: updateGame } = useUpdateGame();

    const handleDeleteGame = () => {
        if (confirm('Are you sure you want to delete this game session? This cannot be undone.')) {
            deleteGame(id);
        }
    };


    // UI State

    const [transferType, setTransferType] = useState<'PAY' | 'CHARGE' | 'BANK_PAY' | 'BANK_RECEIVE' | null>(null);
    const [targetId, setTargetId] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [elapsedTime, setElapsedTime] = useState('00:00:00');

    // Find info
    const me = participants.find(p => p.user_id === user?.id);
    const target = participants.find(p => p.id === targetId);
    const theme = useTheme();
    const isHost = game?.host_user_id === user?.id;

    // Timer Effect
    // Timer Effect
    // Timer Effect
    useEffect(() => {
        if (!game?.created_at) return;
        const interval = setInterval(() => {
            const startDateTs = parseServerDate(game.created_at);
            if (!startDateTs) {
                setElapsedTime('00:00:00');
                return;
            }

            const now = new Date().getTime();
            const diff = Math.max(0, Math.floor((now - startDateTs) / 1000));

            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            setElapsedTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [game?.created_at]);

    // Sync Settings form
    useEffect(() => {
        if (game) {
            setEditName(game.name);
            setEditStatus(game.status);
        }
    }, [game]);

    const handleSaveSettings = () => {
        updateGame({ id, data: { name: editName, status: editStatus } });
        setSettingsOpen(false);
    };

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
            onSuccess: () => {
                setTransferType(null);
                // Play Cash Sound
                const audio = new Audio('/cash.mp3');
                audio.play().catch(e => console.error("Audio play failed", e));
            }
        });
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 10 }}>
            {/* Header Info */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
                <Box>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Button variant="outlined" startIcon={<ArrowForwardIcon style={{ transform: 'rotate(180deg)' }} />} onClick={() => window.location.href = '/history'}>
                            Main Menu
                        </Button>
                        <Divider orientation="vertical" flexItem />
                        <Typography variant="h4" fontWeight="900" color="primary.main">
                            {game?.name || 'Game Session'}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                        <Chip
                            label={`CODE: ${game?.code}`}
                            color="secondary"
                            variant="outlined"
                            onClick={() => navigator.clipboard.writeText(game?.code || '')}
                            icon={<ContentCopyIcon fontSize="small" />}
                            sx={{ fontWeight: 'bold', fontSize: '1.2rem', py: 2 }}
                        />
                        <Chip label={game?.status} size="small" color={game?.status === 'ACTIVE' ? 'success' : 'warning'} />
                        <Chip label={elapsedTime} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                    </Stack>
                </Box>

                <Stack direction="row" spacing={2}>
                    {isHost && (
                        <Button
                            variant="contained"
                            color="warning"
                            startIcon={<SettingsIcon />}
                            onClick={() => setSettingsOpen(true)}
                        >
                            Host Controls
                        </Button>
                    )}
                    <Button color="error" startIcon={<ExitToAppIcon />} onClick={() => leave()}>
                        Leave Game
                    </Button>
                </Stack>
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

            {/* Host Settings Dialog */}
            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
                <DialogTitle>Game Settings</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1, minWidth: 300 }}>
                        <TextField
                            label="Game Name"
                            fullWidth
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={editStatus}
                                label="Status"
                                onChange={(e) => setEditStatus(e.target.value)}
                            >
                                <MenuItem value="WAITING">WAITING (Lobby)</MenuItem>
                                <MenuItem value="ACTIVE">ACTIVE (Playing)</MenuItem>
                                <MenuItem value="PAUSED">PAUSED</MenuItem>
                                <MenuItem value="FINISHED">FINISHED</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
                    <Button
                        onClick={handleDeleteGame}
                        color="error"
                        startIcon={<DeleteIcon />}
                    >
                        Delete Session
                    </Button>
                    <Box>
                        <Button onClick={() => setSettingsOpen(false)} sx={{ mr: 1 }}>Cancel</Button>
                        <Button onClick={handleSaveSettings} variant="contained">Save</Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
