
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
    Fab,
    Tooltip,
    Collapse,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino'; // Using Casino for main icon or something unique?
import StarIcon from '@mui/icons-material/Star'; // Special Dice Icon
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // Arca
import SecurityIcon from '@mui/icons-material/Security'; // Boveda
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'; // Fortuna
import LoopIcon from '@mui/icons-material/Loop'; // Intercambiar
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle'; // Quitar
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'; // Comprar
import LocalPoliceIcon from '@mui/icons-material/LocalPolice'; // Policia
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; // Ganar
import PanToolIcon from '@mui/icons-material/PanTool'; // Tomar tarjeta
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import { usePerformTransfer } from '@/hooks/useTransactions';
import ConfirmDialog from './ConfirmDialog';
import { useGetSpecialDiceHistory, useRecordSpecialDiceRoll } from '@/hooks/useSpecialDice';
import { parseServerDate } from '@/utils/formatters';
import CardDrawer from './CardDrawer';
import BovedaMarket from './BovedaMarket';
import { useCards } from '@/hooks/useCards';

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

interface FloatingSpecialDiceProps {
    gameId: string;
    myParticipantId?: string;
    myUserId?: string;
}

export default function FloatingSpecialDice({ gameId, myParticipantId, myUserId }: FloatingSpecialDiceProps) {
    const { mutate: transfer } = usePerformTransfer();

    // History Hooks
    const { data: history = [] } = useGetSpecialDiceHistory(gameId);
    const { inventory } = useCards(gameId);
    const recordRollMutation = useRecordSpecialDiceRoll();

    // UI State
    const [menuOpen, setMenuOpen] = useState(false);
    const [resultOpen, setResultOpen] = useState(false);
    const [manualSelectionOpen, setManualSelectionOpen] = useState(false);
    const [rolledDie, setRolledDie] = useState<SpecialDie | null>(null);
    const [resultFace, setResultFace] = useState<DieFace | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Confirmation State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedDie, setSelectedDie] = useState<SpecialDie | null>(null);

    // Card/Market State
    const [cardDrawerOpen, setCardDrawerOpen] = useState(false);
    const [cardType, setCardType] = useState<'arca' | 'fortuna' | 'bonificacion'>('arca');
    const [bovedaMarketOpen, setBovedaMarketOpen] = useState(false);
    const [bovedaMode, setBovedaMode] = useState<'buy' | 'exchange'>('buy');
    const [marketMessage, setMarketMessage] = useState<string>('');

    const playSound = (path: string) => {
        new Audio(path).play().catch(e => console.error(e));
    };

    const handleRollClick = (die: SpecialDie) => {
        setSelectedDie(die);
        setConfirmOpen(true);
    };

    const handleConfirmRoll = () => {

        if (!selectedDie) return;
        setMenuOpen(false); // Close the selection menu
        const die = selectedDie;

        // Check ownership for "Dado Bóveda" (Dado de Compra)
        // Assume card title contains "Dado de Compra" or similar based on ID 'boveda'
        // Actually, let's allow manual choice if they have ANY 'boveda' type card that grants this power?
        // Or specific title. Let's assume ownership of the card matching the die allows it.
        // For 'boveda', the card is likely "Dado de Compra" or similar.
        // Let's look for a card with type 'boveda' in inventory?
        // The user request said "the user who possesses that card".

        const hasControlCard = inventory?.some(c => c.title.toLowerCase().includes('compra') || c.type_ === 'boveda');

        if (die.id === 'boveda' && hasControlCard) {
            // Manual Selection Mode
            setManualSelectionOpen(true);
            setConfirmOpen(false);
            return;
        }

        performRoll(die);
        setConfirmOpen(false);
    };

    const performRoll = (die: SpecialDie, manualFace?: DieFace) => {
        setIsRolling(true);
        playSound('/dice.mp3');

        // Simulate roll delay (shorter if manual)
        setTimeout(() => {
            let face: DieFace;

            if (manualFace) {
                face = manualFace;
            } else {
                const randomIndex = Math.floor(Math.random() * die.faces.length);
                face = die.faces[randomIndex];
            }

            setRolledDie(die);
            setResultFace(face);
            setIsRolling(false);
            setResultOpen(true);

            // Play reveal sound
            playSound('/notification.mp3');

            // Handle Auto-Actions
            if (face.action === 'PAY_PLAYER' && face.value && myParticipantId) {
                transfer({
                    gameId,
                    amount: face.value,
                    description: `${die.name}: ${face.label}`,
                    from_participant_id: null,
                    to_participant_id: myParticipantId
                }, {
                    onSuccess: () => {
                        setTimeout(() => playSound('/cash.mp3'), 500);
                    }
                });
            } else if (face.action === 'JAIL') {
                playSound('/fail.mp3');
            } else if (face.action === 'CARD') {
                setCardType('fortuna');
                setTimeout(() => setCardDrawerOpen(true), 1000);
            }

            // Boveda Logic - Auto Close & Open Market
            if (die.id === 'boveda') {
                if (face.label.includes('Comprar')) {
                    setBovedaMode('buy');
                    setMarketMessage(manualFace ? 'Selected "Buy"' : 'You rolled "Buy" - Select a card to take');
                    setTimeout(() => {
                        setResultOpen(false); // Close result
                        setBovedaMarketOpen(true); // Open market
                    }, 1500);
                } else if (face.label.includes('Intercambiar')) {
                    setBovedaMode('exchange');
                    setMarketMessage(manualFace ? 'Selected "Exchange"' : 'You rolled "Exchange" - Swap a card');
                    setTimeout(() => {
                        setResultOpen(false); // Close result
                        setBovedaMarketOpen(true); // Open market
                    }, 1500);
                }
            }
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
    };

    // ... existing handleCloseResult ...

    // Add Manual Selection Dialog in render


    const handleCloseResult = () => {
        setResultOpen(false);
        setRolledDie(null);
        setResultFace(null);
    };

    return (
        <>
            <Tooltip title="Special Dice">
                <Fab
                    color="secondary"
                    onClick={() => setMenuOpen(true)}
                    size="medium"
                >
                    <StarIcon />
                </Fab>
            </Tooltip>

            {/* Selection Menu Dialog */}
            <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle textAlign="center" fontWeight="bold">Select Special Dice</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {DIES.map((die) => (
                            <Grid size={{ xs: 4 }} key={die.id}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        height: '100%',
                                        border: '1px dashed rgba(255,255,255,0.2)',
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'translateY(-4px)', borderColor: `${die.color}.main`, bgcolor: 'action.hover' }
                                    }}
                                >
                                    <CardActionArea
                                        onClick={() => handleRollClick(die)}
                                        sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}
                                        disabled={isRolling}
                                    >
                                        <Box color={`${die.color}.main`}>
                                            {die.icon}
                                        </Box>
                                        <Typography variant="body2" fontWeight="bold" align="center" lineHeight={1.2}>
                                            {die.name.replace('Dado ', '')}
                                        </Typography>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* History Section inside Menu */}
                    <Box width="100%" mt={3} borderTop="1px solid rgba(255,255,255,0.1)" pt={2}>
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
                            <Box maxHeight={150} overflow="auto" bgcolor="rgba(0,0,0,0.2)" borderRadius={1}>
                                <List dense disablePadding>
                                    {history.length === 0 && <Box p={1}><Typography variant="body2" color="text.disabled">No rolls yet.</Typography></Box>}
                                    {history.map((item: any) => {
                                        const ts = parseServerDate(item.created_at);
                                        const timeStr = ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                                        return (
                                            <ListItem key={item.id} divider>
                                                <ListItemText
                                                    primaryTypographyProps={{ component: 'div', variant: 'body2', fontSize: '0.8rem' }}
                                                    secondaryTypographyProps={{ component: 'div', variant: 'caption', fontSize: '0.7rem' }}
                                                    primary={
                                                        <Stack direction="row" justifyContent="space-between">
                                                            <Typography fontWeight="bold" fontSize="inherit">{item.first_name}</Typography>
                                                            <Typography fontWeight="bold" color="secondary.main" fontSize="inherit">{item.die_name}</Typography>
                                                        </Stack>
                                                    }
                                                    secondary={
                                                        <Stack direction="row" justifyContent="space-between" mt={0.5}>
                                                            <Typography variant="caption" color="text.secondary" fontSize="inherit">{item.face_label}</Typography>
                                                            <Typography variant="caption" fontSize="inherit">{timeStr}</Typography>
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

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMenuOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Manual Selection Dialog */}
            <Dialog open={manualSelectionOpen} onClose={() => setManualSelectionOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight="bold" textAlign="center" sx={{ bgcolor: 'warning.main', color: 'black' }}>
                    Control "Dado Bóveda"
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography textAlign="center" gutterBottom>
                        Tienes la tarjeta de control. ¡Elige el resultado!
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {selectedDie?.faces.map((face, index) => (
                            <Grid size={{ xs: 4 }} key={index}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        position: 'relative',
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'action.hover', borderColor: 'warning.main' }
                                    }}
                                    onClick={() => {
                                        setManualSelectionOpen(false);
                                        performRoll(selectedDie, face);
                                    }}
                                >
                                    <Box p={2} display="flex" flexDirection="column" alignItems="center" gap={1}>
                                        <Box color="warning.main">{face.icon}</Box>
                                        <Typography variant="caption" align="center" fontWeight="bold">
                                            {face.label}
                                        </Typography>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setManualSelectionOpen(false)}>Cancelar</Button>
                </DialogActions>
            </Dialog>

            {/* Result Dialog */}
            <Dialog open={resultOpen} onClose={handleCloseResult} maxWidth="xs" fullWidth>
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
                        {/* Show auto-redirect message if applicable */}
                        {rolledDie?.id === 'boveda' && resultFace && (resultFace.label.includes('Comprar') || resultFace.label.includes('Intercambiar')) && (
                            <Typography variant="body2" color="warning.main" sx={{ mt: 2, fontStyle: 'italic' }}>
                                Opening Market...
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button onClick={handleCloseResult} variant="contained" size="large" fullWidth sx={{ maxWidth: 200 }}>
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

            {/* Card Drawer (Arca/Fortuna) */}
            <CardDrawer
                open={cardDrawerOpen}
                onClose={() => setCardDrawerOpen(false)}
                gameId={gameId}
                type={cardType}
            />

            {/* Boveda Market Dialog */}
            <Dialog open={bovedaMarketOpen} onClose={() => setBovedaMarketOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {bovedaMode === 'buy' ? 'Boveda Market - Buy Card' : 'Boveda Market - Exchange Card'}
                </DialogTitle>
                <DialogContent>
                    {marketMessage && <Typography color="info.main" gutterBottom>{marketMessage}</Typography>}
                    <BovedaMarket
                        gameId={gameId}
                        mode={bovedaMode}
                        onActionComplete={() => {
                            setBovedaMarketOpen(false);
                            playSound('/success.mp3');
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBovedaMarketOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

        </>
    );
}
