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
    Divider,
    Drawer,
    Collapse // Added
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Added
import ExpandLessIcon from '@mui/icons-material/ExpandLess'; // Added
import { useParams } from 'next/navigation';
import { useGetGame, useGetParticipants, useLeaveGame, useDeleteGame } from '@/hooks/useGame';
import { useGetTransactions, usePerformTransfer, useUndoTransaction } from '@/hooks/useTransactions';
import ParticipantList from '@/components/ParticipantList';
import TransactionHistory from '@/components/TransactionHistory';
import TransferDialog from '@/components/TransferDialog';
// import CalculatorTool from '@/components/CalculatorTool';
import RouletteTool from '@/components/RouletteTool';
import { useState, useRef } from 'react';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // Bank Icon
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import DeleteIcon from '@mui/icons-material/Delete';
import BackpackIcon from '@mui/icons-material/Backpack';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InventorySection from '@/components/InventorySection';
import BovedaMarket from '@/components/BovedaMarket';
import { parseServerDate } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import DiceSection, { DiceSectionHandle } from '@/components/DiceSection';
import GameBoard from '@/components/GameBoard';
// import SpecialDiceTool from '@/components/SpecialDiceTool';
import FloatingTools from '@/components/FloatingTools';
import SettingsIcon from '@mui/icons-material/Settings';
import StarIcon from '@mui/icons-material/Star'; // Added
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CardDrawer from '@/components/CardDrawer';
import MapIcon from '@mui/icons-material/Map';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    DialogActions,
    Alert // Added
} from '@mui/material';
import { useUpdateGame } from '@/hooks/useGame';
import { useEffect } from 'react';
import { useGameSocket } from '@/hooks/useGameSocket';
import { getSpaceName } from '@/utils/boardSpaces';
import { Snackbar, Alert as MuiAlert } from '@mui/material'; // Using MuiAlert
import { useQueryClient } from '@tanstack/react-query';
import { useGetDiceHistory } from '@/hooks/useDice';

export default function GameSessionPage() {
    const { id } = useParams() as { id: string };
    const user = useAuthStore(state => state.user);
    const queryClient = useQueryClient();

    // Movement Notification
    const [moveToast, setMoveToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

    // WebSocket Connection
    // WebSocket Connection
    useGameSocket(id, (event: any) => {
        if (event.type === 'ParticipantUpdated') {
            const p = event.payload;
            queryClient.invalidateQueries({ queryKey: ['participants', id] });

            // Show toast if position changed (we don't have old position here easily, so just show current)
            const spaceName = getSpaceName(p.position);
            // Ideally we want user name, but payload is Participant struct which has user_id, not name.
            // We can find name from current list (which might be stale, but good enough)
            const pName = participants.find((old: any) => old.user_id === p.user_id)?.first_name || 'Player';
            setMoveToast({ open: true, message: `${pName} landed on ${spaceName}` });
        }
    });

    // Queries
    const { data: game } = useGetGame(id);
    const { data: participants = [] } = useGetParticipants(id);
    const { data: transactions = [] } = useGetTransactions(id);
    const { data: diceHistory = [] } = useGetDiceHistory(id);

    // Mutations
    const myParticipant = participants.find((p: any) => p.user_id === user?.id);
    const { mutate: transfer, isPending: transferring } = usePerformTransfer();

    // Ref for remotely triggering dice roll
    // Add import { useRef } from 'react'; if missing, but it is imported as 'react' default or named
    // Actually imports are: import { useState } from 'react'; in lines 28.
    // I need to add useRef to imports too.
    const diceSectionRef = useRef<DiceSectionHandle>(null);

    // Sound Effect for Incoming Payments
    useEffect(() => {
        if (transactions.length > 0 && myParticipant) {
            const latest = transactions[0]; // Assuming sorted by date DESC (backend usually does this)
            // Check if I am the receiver and it's a recent update (simplistic check: we rely on data refresh)
            // Better approach: track the ID of the last seen transaction.
        }
    }, [transactions, myParticipant]);

    // Actually, to do this correctly, I need state to track the last known top transaction ID.
    const [lastTxId, setLastTxId] = useState<string | null>(null);

    useEffect(() => {
        if (transactions.length > 0 && myParticipant) {
            const latest = transactions[0];

            // Debug logs
            // console.log('Latest TX:', latest.id, 'Last TX:', lastTxId);

            // Initial load
            if (lastTxId === null) {
                setLastTxId(latest.id);
                return;
            }

            if (latest.id !== lastTxId) {
                // New transaction detected
                setLastTxId(latest.id);

                // Check if I am the receiver AND it's from another user
                if (latest.to_participant_id === myParticipant.id && latest.from_participant_id) {
                    // Verify it's recent (created within last minute) to avoid playing on stale data revalidations?
                    // Actually, if ID changed, it IS new because query is sorted DESC.

                    console.log('Playing notification sound for TX:', latest.id);
                    new Audio('/notification.mp3').play().catch(e => console.error('Error playing notification:', e));
                }
            }
        }
    }, [transactions, myParticipant, lastTxId]);

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

    const [manualDrawerOpen, setManualDrawerOpen] = useState(false);
    const [manualCardType, setManualCardType] = useState<'arca' | 'fortuna' | 'bonificacion'>('arca');
    const [inventoryOpen, setInventoryOpen] = useState(false);
    const [decksOpen, setDecksOpen] = useState(false);
    const [marketOpen, setMarketOpen] = useState(false); // Market collapsible state
    const [boardOpen, setBoardOpen] = useState(true); // Board collapsible state
    const [viewedResults, setViewedResults] = useState(false); // Game Over Modal tracking

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
    const handleQuickSalary = () => {
        if (!game || !me) return;

        transfer({
            gameId: id,
            amount: 200,
            description: "Salary (GO)",
            from_participant_id: null,
            to_participant_id: me.id
        }, {
            onSuccess: () => {
                const audio = new Audio('/cash.mp3');
                audio.play().catch(e => console.error(e));
            }
        });
    };

    const handleFloatingRoll = () => {
        if (diceSectionRef.current) {
            diceSectionRef.current.openRollDialog();
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 10 }}>
            {/* Game Over Banner */}
            {game?.status === 'FINISHED' && (
                <Alert
                    severity="error"
                    variant="filled"
                    sx={{ mb: 4, fontWeight: 'bold' }}
                    action={
                        <Button color="inherit" size="small" onClick={() => setViewedResults(false)}>
                            Show Result Screen
                        </Button>
                    }
                >
                    GAME OVER - This session has ended.
                </Alert>
            )}

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
                                color="info" // Distinct color
                                startIcon={<AccountBalanceIcon />}
                                onClick={handleQuickSalary}
                                sx={{ flexGrow: 1 }}
                            >
                                Quick Salary ($200)
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

                    {/* Game Board (Visual) */}
                    <Box mt={4} mb={4} bgcolor="rgba(255,255,255,0.05)" borderRadius={4} border="1px dashed #555" overflow="hidden">
                        <Box
                            p={3}
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            onClick={() => setBoardOpen(!boardOpen)}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <MapIcon color="secondary" />
                                <Typography variant="h6" fontWeight="bold" color="secondary.main">
                                    Interactive Board
                                </Typography>
                            </Stack>
                            {boardOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </Box>
                        <Collapse in={boardOpen}>
                            <Box p={3} pt={0}>
                                <GameBoard participants={participants} diceHistory={diceHistory} />
                            </Box>
                        </Collapse>
                    </Box>

                    {/* Dice Roller */}
                    <DiceSection gameId={id} ref={diceSectionRef} />

                    {/* Special Dice */}
                    {/* Special Dice Removed (Moved to Float) */}
                </Grid>

                {/* History Column */}
                <Grid size={{ xs: 12, md: 4 }}>
                    {/* Decks / Draw Cards Widget */}
                    <Box mb={2} overflow="hidden" bgcolor="rgba(0,0,0,0.2)" borderRadius={2} border="1px solid rgba(255,255,255,0.1)">
                        <Box
                            p={2}
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            onClick={() => setDecksOpen(!decksOpen)}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                        >
                            <Typography variant="h6" color="primary.light">Decks</Typography>
                            {decksOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </Box>
                        <Collapse in={decksOpen}>
                            <Box p={2} pt={0}>
                                <Stack direction="row" spacing={2}>
                                    <Button
                                        variant="contained"
                                        color="info"
                                        onClick={() => { setManualCardType('arca'); setManualDrawerOpen(true); }}
                                        fullWidth
                                        startIcon={<AccountBalanceIcon />}
                                    >
                                        Arca
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={() => { setManualCardType('fortuna'); setManualDrawerOpen(true); }}
                                        fullWidth
                                        startIcon={<AutoFixHighIcon />}
                                    >
                                        Fortuna
                                    </Button>
                                    <Button
                                        variant="contained"
                                        sx={{ bgcolor: '#9C27B0', '&:hover': { bgcolor: '#7B1FA2' } }}
                                        onClick={() => { setManualCardType('bonificacion'); setManualDrawerOpen(true); }}
                                        fullWidth
                                        startIcon={<StarIcon />}
                                    >
                                        Bonif.
                                    </Button>
                                </Stack>
                            </Box>
                        </Collapse>
                    </Box>

                    {/* Boveda Market Widget */}
                    <Box mb={3} overflow="hidden" bgcolor="rgba(0,0,0,0.2)" borderRadius={2} border="1px solid rgba(255,255,255,0.1)">
                        <Box
                            p={2}
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            onClick={() => setMarketOpen(!marketOpen)}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <StorefrontIcon color="warning" />
                                <Typography variant="h6" color="warning.main">Bóveda Market</Typography>
                            </Stack>
                            {marketOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </Box>
                        <Collapse in={marketOpen}>
                            <Box p={2} pt={0}>
                                <BovedaMarket gameId={id} mode="view" />
                            </Box>
                        </Collapse>
                    </Box>

                    <RouletteTool
                        gameId={id as string}
                        myParticipantId={myParticipant?.id}
                        myUserId={myParticipant?.user_id}
                        jackpotBalance={Number(game?.jackpot_balance || 0)}
                    />
                    {/* Calculator Removed (Moved to Float) */}

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

            {/* Manual Card Drawer */}
            <CardDrawer
                open={manualDrawerOpen}
                onClose={() => setManualDrawerOpen(false)}
                gameId={id}
                type={manualCardType}
            />

            {/* Inventory FAB */}
            <Fab
                color="secondary"
                aria-label="inventory"
                sx={{ position: 'fixed', bottom: 32, right: 32 }}
                onClick={() => setInventoryOpen(true)}
            >
                <BackpackIcon />
            </Fab>

            {/* Inventory Drawer */}
            <Drawer
                anchor="right"
                open={inventoryOpen}
                onClose={() => setInventoryOpen(false)}
            >
                <Box sx={{ width: 350, p: 2 }}>
                    <Typography variant="h5" gutterBottom fontWeight="bold">
                        My Inventory
                    </Typography>
                    <InventorySection
                        gameId={id}
                    />
                </Box>
            </Drawer>

            {/* Game Over Dialog */}
            <Dialog
                open={game?.status === 'FINISHED' && !viewedResults}
                fullScreen
                PaperProps={{
                    style: {
                        backgroundColor: 'rgba(0,0,0,0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }
                }}
            >
                <Box textAlign="center" p={4}>
                    <Typography variant="h1" color="error" fontWeight="900" sx={{ textShadow: '0 0 20px red' }}>
                        GAME OVER
                    </Typography>
                    <Typography variant="h4" color="white" mt={2}>
                        The game has ended!
                    </Typography>
                    <Typography variant="h6" color="gray" mt={4}>
                        A victory condition was met.
                    </Typography>

                    <Stack direction="row" spacing={4} justifyContent="center" mt={8}>
                        <Button
                            variant="contained"
                            size="large"
                            color="warning"
                            onClick={() => window.location.href = '/history'}
                        >
                            Return to Menu
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            sx={{ color: 'white', borderColor: 'white' }}
                            onClick={() => setViewedResults(true)}
                        >
                            View Board (Read-Only)
                        </Button>
                    </Stack>
                </Box>
            </Dialog>


            {/* Global Movement Toast */}
            <Snackbar
                open={moveToast.open}
                autoHideDuration={4000}
                onClose={() => setMoveToast({ ...moveToast, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <MuiAlert severity="info" variant="filled" onClose={() => setMoveToast({ ...moveToast, open: false })}>
                    {moveToast.message}
                </MuiAlert>
            </Snackbar>
            {/* UI Layer */}
            <FloatingTools
                gameId={game?.id || ''}
                myParticipantId={myParticipant?.id}
                myUserId={myParticipant?.user_id}
                onRollDice={handleFloatingRoll}
            />

        </Container >
    );
}
