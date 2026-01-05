'use client';

import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    Card,
    CardActionArea,
    CardContent
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // Arca
import TokenIcon from '@mui/icons-material/Token';
import SecurityIcon from '@mui/icons-material/Security'; // Boveda
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'; // Fortuna
import LoopIcon from '@mui/icons-material/Loop'; // Intercambiar
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle'; // Quitar
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'; // Comprar
import LocalPoliceIcon from '@mui/icons-material/LocalPolice'; // Policia
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; // Ganar
import PanToolIcon from '@mui/icons-material/PanTool'; // Tomar tarjeta
import { usePerformTransfer } from '@/hooks/useTransactions';
import ConfirmDialog from './ConfirmDialog';
import { useGetSpecialDiceHistory, useRecordSpecialDiceRoll } from '@/hooks/useSpecialDice';
import { parseServerDate } from '@/utils/formatters';
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { List, ListItem, ListItemText, Collapse } from '@mui/material';

// Define Die Interfaces
interface DieFace {
    label: string;
    value?: number; // For auto-pay logic
    action?: 'PAY_PLAYER' | 'JAIL' | 'CARD';
    icon?: React.ReactNode;
}

interface SpecialDie {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: 'primary' | 'secondary' | 'warning' | 'info' | 'success' | 'error';
    faces: DieFace[];
}

const DIES: SpecialDie[] = [
    {
        id: 'boveda',
        name: 'Dado Bóveda',
        icon: <SecurityIcon fontSize="large" />,
        color: 'warning',
        faces: [
            { label: 'Intercambiar', icon: <LoopIcon sx={{ fontSize: 60 }} /> },
            { label: 'Intercambiar', icon: <LoopIcon sx={{ fontSize: 60 }} /> },
            { label: 'Quitar tarjeta', icon: <RemoveCircleIcon sx={{ fontSize: 60 }} /> },
            { label: 'Comprar', icon: <ShoppingCartIcon sx={{ fontSize: 60 }} /> },
            { label: 'Comprar', icon: <ShoppingCartIcon sx={{ fontSize: 60 }} /> },
            { label: 'Comprar', icon: <ShoppingCartIcon sx={{ fontSize: 60 }} /> },
        ]
    },
    {
        id: 'arca',
        name: 'Dado Arca Comunal',
        icon: <AccountBalanceIcon fontSize="large" />,
        color: 'info',
        faces: [
            { label: 'Ve a la cárcel', action: 'JAIL', icon: <LocalPoliceIcon sx={{ fontSize: 60 }} /> },
            { label: 'Ve a la cárcel', action: 'JAIL', icon: <LocalPoliceIcon sx={{ fontSize: 60 }} /> },
            { label: 'Gana 100', value: 100, action: 'PAY_PLAYER', icon: <AttachMoneyIcon sx={{ fontSize: 60 }} /> },
            { label: 'Gana 200', value: 200, action: 'PAY_PLAYER', icon: <AttachMoneyIcon sx={{ fontSize: 60 }} /> },
            { label: 'Gana 50', value: 50, action: 'PAY_PLAYER', icon: <AttachMoneyIcon sx={{ fontSize: 60 }} /> },
            { label: 'Gana 50', value: 50, action: 'PAY_PLAYER', icon: <AttachMoneyIcon sx={{ fontSize: 60 }} /> },
        ]
    },
    {
        id: 'fortuna',
        name: 'Dado Fortuna',
        icon: <AutoFixHighIcon fontSize="large" />,
        color: 'secondary',
        faces: [
            { label: 'Ve a la cárcel', action: 'JAIL', icon: <LocalPoliceIcon sx={{ fontSize: 60 }} /> },
            { label: 'Ve a la cárcel', action: 'JAIL', icon: <LocalPoliceIcon sx={{ fontSize: 60 }} /> },
            { label: 'Ve a la cárcel', action: 'JAIL', icon: <LocalPoliceIcon sx={{ fontSize: 60 }} /> },
            { label: 'Toma 1 tarjeta de corrupción', action: 'CARD', icon: <PanToolIcon sx={{ fontSize: 60 }} /> },
            { label: 'Toma 1 tarjeta de corrupción', action: 'CARD', icon: <PanToolIcon sx={{ fontSize: 60 }} /> },
            { label: 'Toma 2 tarjetas de corrupción', action: 'CARD', icon: <PanToolIcon sx={{ fontSize: 60 }} /> },
        ]
    }
];

interface SpecialDiceToolProps {
    gameId: string;
    myParticipantId?: string;
    myUserId?: string;
}

export default function SpecialDiceTool({ gameId, myParticipantId, myUserId }: SpecialDiceToolProps) {
    const { mutate: transfer } = usePerformTransfer();

    // History Hooks
    const { data: history = [] } = useGetSpecialDiceHistory(gameId);
    const recordRollMutation = useRecordSpecialDiceRoll();

    // Result State
    const [resultOpen, setResultOpen] = useState(false);
    const [rolledDie, setRolledDie] = useState<SpecialDie | null>(null);
    const [resultFace, setResultFace] = useState<DieFace | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [showHistory, setShowHistory] = useState(false); // Added for history collapse

    // Confirmation State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedDie, setSelectedDie] = useState<SpecialDie | null>(null);

    const playSound = (path: string) => {
        new Audio(path).play().catch(e => console.error(e));
    };

    const handleRollClick = (die: SpecialDie) => {
        setSelectedDie(die);
        setConfirmOpen(true);
    };

    const handleConfirmRoll = () => {
        if (!selectedDie) return;
        const die = selectedDie;

        setIsRolling(true);
        playSound('/dice.mp3');

        // Simulate roll delay
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * die.faces.length);
            const face = die.faces[randomIndex];

            setRolledDie(die);
            setResultFace(face);
            setIsRolling(false);
            setResultOpen(true);

            // Play reveal sound
            playSound('/notification.mp3');

            // Handle Auto-Actions
            if (face.action === 'PAY_PLAYER' && face.value && myParticipantId) {
                // Auto-pay from Bank to Player
                transfer({
                    gameId,
                    amount: face.value,
                    description: `${die.name}: ${face.label}`,
                    from_participant_id: null, // Bank
                    to_participant_id: myParticipantId
                }, {
                    onSuccess: () => {
                        // Delay cash sound slightly so it doesn't overlap perfectly with notification if needed
                        setTimeout(() => playSound('/cash.mp3'), 500);
                    }
                });
            } else if (face.action === 'JAIL') {
                playSound('/fail.mp3'); // Optional sound for Jail
            }

            // Record History
            if (myUserId) {
                recordRollMutation.mutate({
                    gameId,
                    userId: myUserId,
                    dieName: die.name,
                    dieId: die.id,
                    faceLabel: face.label,
                    faceValue: face.value,
                    faceAction: face.action
                });
            }
        }, 800);

        setConfirmOpen(false);
    };

    const handleClose = () => {
        setResultOpen(false);
        setRolledDie(null);
        setResultFace(null);
    };

    return (
        <Paper sx={{ mt: 4, p: 3, borderRadius: 3, mb: 4 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <CasinoIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Special Dice</Typography>
            </Box>

            <Grid container spacing={2}>
                {DIES.map((die) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={die.id}>
                        <Card
                            variant="outlined"
                            sx={{
                                height: '100%',
                                border: '1px dashed rgba(255,255,255,0.2)',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-4px)', borderColor: `${die.color}.main` }
                            }}
                        >
                            <CardActionArea
                                onClick={() => handleRollClick(die)}
                                sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
                                disabled={isRolling}
                            >
                                <Box color={`${die.color}.main`}>
                                    {die.icon}
                                </Box>
                                <Typography fontWeight="bold" align="center">{die.name}</Typography>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* History Section */}
            <Box width="100%" mt={3}>
                <Stack
                    direction="row"
                    alignItems="center"
                    gap={1}
                    mb={1}
                    onClick={() => setShowHistory(!showHistory)}
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                >
                    <HistoryIcon fontSize="small" color="disabled" />
                    <Typography variant="caption" color="text.secondary">Dice History</Typography>
                    {showHistory ? <ExpandLessIcon fontSize="small" color="disabled" /> : <ExpandMoreIcon fontSize="small" color="disabled" />}
                </Stack>
                <Collapse in={showHistory}>
                    <Box maxHeight={200} overflow="auto" border="1px solid rgba(255,255,255,0.1)" borderRadius={1}>
                        <List dense disablePadding>
                            {history.length === 0 && <Box p={1}><Typography variant="body2" color="text.disabled">No rolls yet.</Typography></Box>}
                            {history.map((item) => {
                                const ts = parseServerDate(item.created_at);
                                const timeStr = ts ? new Date(ts).toLocaleTimeString() : '';
                                return (
                                    <ListItem key={item.id} divider>
                                        <ListItemText
                                            primaryTypographyProps={{ component: 'div', variant: 'body2' }}
                                            secondaryTypographyProps={{ component: 'div', variant: 'caption' }}
                                            primary={
                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography fontWeight="bold">{item.first_name}</Typography>
                                                    <Typography fontWeight="bold">{item.die_name}</Typography>
                                                </Stack>
                                            }
                                            secondary={
                                                <Stack direction="row" justifyContent="space-between" mt={0.5}>
                                                    <Typography variant="caption" color="text.secondary">{item.face_label}</Typography>
                                                    <Typography variant="caption">{timeStr}</Typography>
                                                </Stack>
                                            }
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    </Box>
                </Collapse>
            </Box>

            {/* Result Dialog */}
            <Dialog open={resultOpen} onClose={handleClose} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight="bold" textAlign="center" sx={{ pt: 4 }}>
                    {rolledDie?.name} Result
                </DialogTitle>
                <DialogContent>
                    <Box
                        sx={{
                            py: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2
                        }}
                    >
                        {resultFace?.icon ? (
                            <Box sx={{ color: `${rolledDie?.color}.main`, mb: 1 }}>
                                {resultFace.icon}
                            </Box>
                        ) : (
                            rolledDie?.icon && (
                                <Box sx={{ transform: 'scale(1.5)', color: `${rolledDie.color}.main`, mb: 1 }}>
                                    {rolledDie.icon}
                                </Box>
                            )
                        )}
                        <Typography variant="h4" fontWeight="900" textAlign="center" color="text.primary">
                            {resultFace?.label}
                        </Typography>

                        {resultFace?.action === 'PAY_PLAYER' && (
                            <Typography variant="caption" color="success.main" sx={{ bgcolor: 'rgba(0,255,0,0.1)', px: 1, borderRadius: 1 }}>
                                Auto-paid ${resultFace.value} to you!
                            </Typography>
                        )}
                        {resultFace?.action === 'JAIL' && (
                            <Typography variant="caption" color="error.main">
                                Go directly to Jail!
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button onClick={handleClose} variant="contained" size="large" fullWidth sx={{ maxWidth: 200 }}>
                        OK
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={confirmOpen}
                title="Roll Special Die?"
                description={`Are you sure you want to roll ${selectedDie?.name}?`}
                onConfirm={handleConfirmRoll}
                onClose={() => setConfirmOpen(false)}
                confirmText="Roll"
                severity="info"
            />
        </Paper >
    );
}
