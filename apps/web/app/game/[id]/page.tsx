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
import { useGetGame, useGetParticipants, useLeaveGame, useDeleteGame, useEndTurn } from '@/hooks/useGame';
import { toast } from 'react-hot-toast';
import { useGetTransactions, usePerformTransfer, useUndoTransaction } from '@/hooks/useTransactions';
import ParticipantList from '@/components/ParticipantList';
import TransactionHistory from '@/components/TransactionHistory';
import TransferDialog from '@/components/TransferDialog';
// import CalculatorTool from '@/components/CalculatorTool';
import RouletteTool from '@/components/RouletteTool';
import { useState, useRef, useMemo } from 'react';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // Bank Icon
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
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
import PropertyActionModal from '@/components/PropertyActionModal';
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
    Alert, // Added
    Tooltip // Added
} from '@mui/material';
import { useUpdateGame } from '@/hooks/useGame';
import { useEffect } from 'react';
import { useGameSocket } from '@/hooks/useGameSocket';
import { getSpaceName } from '@/utils/boardSpaces';
import { Snackbar, Alert as MuiAlert } from '@mui/material'; // Using MuiAlert
import { useQueryClient } from '@tanstack/react-query';
import { useGetDiceHistory } from '@/hooks/useDice';
import BankTracker from '@/components/BankTracker';
import AIAdvisor from '@/components/AIAdvisor';
import GlobalPropertyView from '@/components/GlobalPropertyView';

import AuctionModal from '@/components/AuctionModal';
import { Auction, useGetActiveAuction } from '@/hooks/useAuctions';
import TradeModal from '@/components/TradeModal';
import IncomingTradeDialog from '@/components/IncomingTradeDialog';
import { Trade, useGetActiveTrades } from '@/hooks/useTrades';
import { useGetGameProperties } from '@/hooks/useProperties';
import InitiativeModal from '@/components/InitiativeModal';

export default function GameSessionPage() {
    const { id } = useParams() as { id: string };
    const user = useAuthStore(state => state.user);
    const token = useAuthStore(state => state.token);
    const queryClient = useQueryClient();

    // Auction State
    const [activeAuction, setActiveAuction] = useState<Auction | null>(null);

    // Trade State
    const [tradeModalOpen, setTradeModalOpen] = useState(false);
    const [tradePartnerId, setTradePartnerId] = useState<string | null>(null);
    const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
    const [incomingTrade, setIncomingTrade] = useState<Trade | null>(null);

    // Movement Notification
    const [moveToast, setMoveToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
    const [currentTurnUserId, setCurrentTurnUserId] = useState<string | null>(null);
    const [initiativeModalOpen, setInitiativeModalOpen] = useState(false);
    const [globalPropertiesOpen, setGlobalPropertiesOpen] = useState(false);

    // WebSocket Connection
    useGameSocket(id, (event: any) => {
        if (event.type === 'ParticipantUpdated') {
            const p = event.payload;
            queryClient.invalidateQueries({ queryKey: ['participants', id] });

            const spaceName = getSpaceName(p.position);
            const pName = participants.find((old: any) => old.user_id === p.user_id)?.first_name || 'Jugador';
            setMoveToast({ open: true, message: `${pName} cayó en ${spaceName}` });
        } else if (event.type === 'AuctionUpdated') {
            const auction = event.payload as Auction;
            if (auction.status === 'ACTIVE') {
                setActiveAuction(auction);
            } else {
                setActiveAuction(null);
                queryClient.invalidateQueries({ queryKey: ['gameProperties', id] });
                queryClient.invalidateQueries({ queryKey: ['participants', id] });
            }
        } else if (event.type === 'TradeUpdated') {
            const trade = event.payload as Trade;
            queryClient.invalidateQueries({ queryKey: ['trades', id] });

            // If I am target and it's pending, show incoming
            if (trade.target_id === myParticipant?.id && trade.status === 'PENDING') {
                setIncomingTrade(trade);
                // Play notification sound
                new Audio('/notification.mp3').play().catch(() => { });
            }
            // If it was accepted/rejected/cancelled, clear internal state if matches
            if (['ACCEPTED', 'REJECTED', 'CANCELLED'].includes(trade.status)) {
                if (incomingTrade?.id === trade.id) setIncomingTrade(null);
                if (activeTrade?.id === trade.id) setActiveTrade(null);
                // If accepted, refresh data
                if (trade.status === 'ACCEPTED') {
                    queryClient.invalidateQueries({ queryKey: ['gameProperties', id] });
                    queryClient.invalidateQueries({ queryKey: ['participants', id] });
                }
            }
        } else if (event.type === 'TurnUpdated') {
            const nextUserId = event.payload.current_turn_user_id;
            const nextPlayer = participants.find((p: any) => p.user_id === nextUserId);
            if (nextPlayer) {
                toast(`Es el turno de ${nextPlayer.first_name}`, { icon: '🎲' });
                if (nextUserId === user?.id) {
                    new Audio('/your-turn.mp3').play().catch(() => { });
                }
            }
            queryClient.invalidateQueries({ queryKey: ['game', id] });
        } else if (event.type === 'GameUpdated') {
            queryClient.invalidateQueries({ queryKey: ['game', id] });
            if (event.payload.status === 'FINISHED') {
                setViewedResults(false);
            }
        }
    });

    const { mutate: endTurn } = useEndTurn(id);
    const { data: game } = useGetGame(id);

    useEffect(() => {
        if (game?.current_turn_user_id) {
            setCurrentTurnUserId(game.current_turn_user_id);
        }
    }, [game]);

    const { data: participants = [] } = useGetParticipants(id);
    const { data: transactions = [] } = useGetTransactions(id);
    const { data: diceHistory = [] } = useGetDiceHistory(id);

    // Mutations
    const myParticipant = participants.find((p: any) => p.user_id === user?.id);

    // Fetch active trades to check if I have any pending on load
    // Fetch active trades to check if I have any pending on load
    const { data: trades = [] } = useGetActiveTrades(id);

    // Effect to set incoming trade on load if any
    useEffect(() => {
        if (myParticipant && trades.length > 0) {
            const pendingForMe = trades.find((t: Trade) => t.target_id === myParticipant.id && t.status === 'PENDING');
            if (pendingForMe) setIncomingTrade(pendingForMe);
        }
    }, [trades, myParticipant]);

    const { data: gameProperties = [] } = useGetGameProperties(id);
    const { data: initialAuction } = useGetActiveAuction(id);

    // Sync initial auction
    useEffect(() => {
        if (initialAuction && !activeAuction) {
            setActiveAuction(initialAuction);
        } else if (!initialAuction && activeAuction) {
            // If the query says there is no active auction anymore, clear local state
            setActiveAuction(null);
        }
    }, [initialAuction]);

    // Calculate Bank Balance for AI Context
    const bankBalance = useMemo(() => {
        let balance = 20580;
        transactions.forEach(tx => {
            if (!tx.from_participant_id && tx.to_participant_id) balance -= Number(tx.amount);
            else if (tx.from_participant_id && !tx.to_participant_id) balance += Number(tx.amount);
        });
        return balance;
    }, [transactions]);

    // Mutations
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
        if (confirm('¿Estás seguro de que deseas eliminar esta sesión de juego? Esto no se puede deshacer.')) {
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
        // If changing status to ACTIVE and it wasn't ACTIVE before, trigger initiative
        if (editStatus === 'ACTIVE' && game?.status === 'WAITING') {
            setSettingsOpen(false);
            setInitiativeModalOpen(true);
            return;
        }

        updateGame({ id, data: { name: editName, status: editStatus } });
        setSettingsOpen(false);
    };

    const handleConfirmInitiative = (rolls: Record<string, number>) => {
        updateGame({
            id,
            data: {
                name: editName,
                status: 'ACTIVE',
                initiative_rolls: rolls
            }
        });
        setInitiativeModalOpen(false);
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

    const handleTradeClick = (pId: string) => {
        setTradePartnerId(pId);
        setTradeModalOpen(true);
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
                            Mostrar Pantalla de Resultados
                        </Button>
                    }
                >
                    JUEGO TERMINADO - Esta sesión ha finalizado.
                </Alert>
            )}

            {/* Header Info */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
                <Box>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Button variant="outlined" startIcon={<ArrowForwardIcon style={{ transform: 'rotate(180deg)' }} />} onClick={() => window.location.href = '/history'}>
                            Menú Principal
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

                {/* Turn Banner */}
                {game?.status === 'ACTIVE' && currentTurnUserId && (
                    <Box sx={{ width: '100%', mb: 2, textAlign: 'center', p: 1, bgcolor: currentTurnUserId === user?.id ? 'success.dark' : 'background.paper', borderRadius: 1 }}>
                        <Typography variant="h5" fontWeight="bold" color={currentTurnUserId === user?.id ? 'white' : 'text.secondary'}>
                            {currentTurnUserId === user?.id ? "¡ES TU TURNO!" : `Esperando a ${participants.find((p: any) => p.user_id === currentTurnUserId)?.first_name || 'Jugador'}...`}
                        </Typography>
                    </Box>
                )}

                <Stack direction="row" spacing={2}>
                    {isHost && (
                        <Button
                            variant="contained"
                            color="warning"
                            startIcon={<SettingsIcon />}
                            onClick={() => setSettingsOpen(true)}
                        >
                            Controles de Host
                        </Button>
                    )}
                    <Button color="error" startIcon={<ExitToAppIcon />} onClick={() => leave()}>
                        Salir del Juego
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
                        isInDebt={(myParticipant?.balance ?? 0) < 0}
                        onTrade={(id) => handleTradeClick(id)}
                    />

                    {/* Bank Controls */}
                    <Box mt={4}>
                        <BankTracker
                            transactions={transactions}
                            onAction={handleBankClick}
                            onQuickSalary={handleQuickSalary}
                            isInDebt={(myParticipant?.balance ?? 0) < 0}
                        />
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

                    {/* Global Properties View */}
                    <Box mb={4} bgcolor="rgba(255,255,255,0.02)" borderRadius={4} border="1px solid rgba(255,255,255,0.1)" overflow="hidden">
                        <Box
                            p={3}
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            onClick={() => setGlobalPropertiesOpen(!globalPropertiesOpen)}
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <AccountBalanceWalletIcon color="primary" />
                                <Typography variant="h6" fontWeight="bold" color="primary.main">
                                    Propiedades de Jugadores
                                </Typography>
                            </Stack>
                            {globalPropertiesOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </Box>
                        <Collapse in={globalPropertiesOpen}>
                            <Box p={3} pt={0}>
                                <GlobalPropertyView gameId={id} participants={participants} />
                            </Box>
                        </Collapse>
                    </Box>

                    {/* Dice Roller */}
                    <DiceSection
                        gameId={id}
                        ref={diceSectionRef}
                        isInDebt={(myParticipant?.balance ?? 0) < 0}
                        isMyTurn={currentTurnUserId === user?.id}
                        onEndTurn={() => endTurn()}
                    />

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
                <DialogTitle>Ajustes del Juego</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1, minWidth: 300 }}>
                        <TextField
                            label="Nombre del Juego"
                            fullWidth
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                value={editStatus}
                                label="Estado"
                                onChange={(e) => setEditStatus(e.target.value)}
                            >
                                <MenuItem value="WAITING">ESPERANDO (Lobby)</MenuItem>
                                <MenuItem value="ACTIVE">ACTIVO (Jugando)</MenuItem>
                                <MenuItem value="PAUSED">PAUSADO</MenuItem>
                                <MenuItem value="FINISHED">FINALIZADO</MenuItem>
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
                        Eliminar Sesión
                    </Button>
                    <Box>
                        <Button onClick={() => setSettingsOpen(false)} sx={{ mr: 1 }}>Cancelar</Button>
                        <Button onClick={handleSaveSettings} variant="contained">Guardar</Button>
                    </Box>
                </DialogActions>
            </Dialog>

            <InitiativeModal
                open={initiativeModalOpen}
                onClose={() => setInitiativeModalOpen(false)}
                participants={participants}
                onConfirm={handleConfirmInitiative}
            />

            {/* Manual Card Drawer */}
            <CardDrawer
                open={manualDrawerOpen}
                onClose={() => setManualDrawerOpen(false)}
                gameId={id}
                type={manualCardType}
            />

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
                        myParticipantId={myParticipant?.id}
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
            {/* Right Side Floating Buttons Stack */}
            <Box sx={{ position: 'fixed', bottom: 32, right: 32, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', zIndex: 1000 }}>
                {/* AI Advisor Button */}
                <AIAdvisor
                    participants={participants}
                    diceHistory={diceHistory}
                    bankBalance={bankBalance}
                    transactions={transactions}
                />

                {/* Inventory FAB */}
                <Tooltip title="Inventario" placement="left">
                    <Fab
                        color="secondary"
                        aria-label="inventory"
                        onClick={() => setInventoryOpen(true)}
                        sx={{ bgcolor: 'secondary.main' }}
                    >
                        <BackpackIcon />
                    </Fab>
                </Tooltip>
            </Box>

            {/* UI Layer */}
            {myParticipant && <PropertyActionModal gameId={game?.id || ''} myPosition={myParticipant.position} myParticipantId={myParticipant.id} />}

            <AuctionModal
                auction={activeAuction}
                participants={participants}
                isHost={game?.host_user_id === user?.id}
            />

            {myParticipant && (
                <>
                    <TradeModal
                        open={tradeModalOpen}
                        onClose={() => setTradeModalOpen(false)}
                        gameId={id}
                        me={myParticipant}
                        opponent={participants.find((p: any) => p.id === tradePartnerId) || myParticipant} // Fallback to avoid crash, logically shouldn't happen
                        myProperties={gameProperties.filter((p: any) => p.participant_id === myParticipant.id)}
                        opponentProperties={gameProperties.filter((p: any) => p.participant_id === tradePartnerId)}
                    />

                    <IncomingTradeDialog
                        trade={incomingTrade}
                        gameId={id}
                        userId={user?.id || ''}
                        participants={participants}
                        onClose={() => setIncomingTrade(null)}
                    />
                </>
            )}

            <FloatingTools
                gameId={game?.id || ''}
                myParticipantId={myParticipant?.id}
                myUserId={myParticipant?.user_id}
                onRollDice={handleFloatingRoll}
                isInDebt={(myParticipant?.balance ?? 0) < 0}
                isMyTurn={currentTurnUserId === user?.id}
            />

        </Container >
    );
}
