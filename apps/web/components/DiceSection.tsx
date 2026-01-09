import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
    Box,
    Typography,
    Button,
    Stack,
    toggleButtonClasses,
    ToggleButton,
    ToggleButtonGroup,
    Slider,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Chip,
    Divider,
    Paper,

    Collapse,
    FormControlLabel,
    Checkbox,
    Snackbar,
    Alert,
    Tooltip
} from '@mui/material';
import { getSpaceName } from '@/utils/boardSpaces';
import CasinoIcon from '@mui/icons-material/Casino';
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useRollDice, useGetDiceHistory, DiceHistoryItem } from '@/hooks/useDice';
import { parseServerDate } from '@/utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from './ConfirmDialog';

interface DiceSectionProps {
    gameId: string;
    isInDebt?: boolean;
    isMyTurn?: boolean;
    onEndTurn?: () => void;
}

export interface DiceSectionHandle {
    openRollDialog: () => void;
}

const DiceSection = forwardRef<DiceSectionHandle, DiceSectionProps>(({ gameId, isInDebt, isMyTurn, onEndTurn }, ref) => {
    const [sides, setSides] = useState<number>(6);
    const [count, setCount] = useState<number>(2);
    const [showConfig, setShowConfig] = useState<boolean>(false);
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [autoSalary, setAutoSalary] = useState<boolean>(true);
    const [notification, setNotification] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
    const [hasRolledThisTurn, setHasRolledThisTurn] = useState<boolean>(false);

    const { mutate: roll, isPending: rolling, data: lastRoll } = useRollDice(gameId);
    const { data: history = [] } = useGetDiceHistory(gameId);

    const [confirmRollOpen, setConfirmRollOpen] = useState(false);

    // Expose handle for external triggering
    useImperativeHandle(ref, () => ({
        openRollDialog: () => {
            if (isInDebt) {
                setNotification({ open: true, message: '¡No puedes tirar mientras estés en deuda!' });
                return;
            }
            setConfirmRollOpen(true);
        }
    }));

    // Reset roll state when it becomes my turn
    useEffect(() => {
        if (isMyTurn) {
            setHasRolledThisTurn(false);
        }
    }, [isMyTurn]);

    // Effect to play sound on new roll
    useEffect(() => {
        if (lastRoll) {
            // Check for doubles (all dice have same value)
            const isDoubles = lastRoll.results.every(val => val === lastRoll.results[0]) && lastRoll.results.length > 1;

            if (isDoubles) {
                setHasRolledThisTurn(false); // Allow another roll
                new Audio('/doubles.mp3').play().catch(e => console.error('Error playing doubles sound:', e));
            } else {
                // ...
            }
        }
    }, [lastRoll]);

    const handleRollClick = () => {
        // If isMyTurn is explicitly provided (not undefined), enforce it
        if (isMyTurn === false) {
            setNotification({ open: true, message: '¡No es tu turno!' });
            return;
        }

        if (isInDebt) {
            setNotification({ open: true, message: '¡No puedes tirar mientras estés en deuda!' });
            return;
        }
        setConfirmRollOpen(true);
    };

    const handleConfirmRoll = () => {
        // Play standard roll sound immediately
        const audio = new Audio('/dice.mp3');
        audio.play().catch(err => console.error('Failed to play dice sound:', err));

        roll({ sides, count });
        setHasRolledThisTurn(true);
        setConfirmRollOpen(false);
    };

    const handleSidesChange = (event: React.MouseEvent<HTMLElement>, newAlignment: number | null) => {
        if (newAlignment !== null) {
            setSides(newAlignment);
        }
    };

    return (
        <Card sx={{ mt: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <CasinoIcon color="secondary" />
                        <Typography variant="h6" fontWeight="bold">Lanzador de Dados</Typography>
                    </Stack>
                    <Button
                        size="small"
                        onClick={() => setShowConfig(!showConfig)}
                        color="inherit"
                    >
                        {showConfig ? 'Ocultar Config' : 'Configurar'}
                    </Button>
                </Stack>

                <Stack spacing={3} direction={{ xs: 'column', md: 'row' }}>
                    {/* Controls */}
                    <Box flex={1}>
                        <Collapse in={showConfig}>
                            <Box mb={3} p={2} border="1px dashed rgba(255,255,255,0.2)" borderRadius={2}>
                                <Typography gutterBottom variant="caption" color="text.secondary">Tipo de Dado</Typography>
                                <ToggleButtonGroup
                                    value={sides}
                                    exclusive
                                    onChange={handleSidesChange}
                                    aria-label="dice sides"
                                    fullWidth
                                    size="small"
                                    sx={{ mb: 3 }}
                                >
                                    <ToggleButton value={6}>D6</ToggleButton>
                                    <ToggleButton value={12}>D12</ToggleButton>
                                    <ToggleButton value={24}>D24</ToggleButton>
                                </ToggleButtonGroup>

                                <Typography gutterBottom variant="caption" color="text.secondary">Cantidad: {count}</Typography>
                                <Slider
                                    value={count}
                                    onChange={(_, val) => setCount(val as number)}
                                    min={1}
                                    max={8}
                                    step={1}
                                    marks
                                    valueLabelDisplay="auto"
                                    sx={{ mb: 1 }}
                                />
                            </Box>
                        </Collapse>

                        <Tooltip title={isInDebt ? "No puedes tirar mientras estés en deuda" : (isMyTurn === false ? "No es tu turno" : "")}>
                            <Stack spacing={2}>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        onClick={handleRollClick}
                                        disabled={rolling || isInDebt || isMyTurn === false || (hasRolledThisTurn && (!lastRoll || !lastRoll.results.every(val => val === lastRoll.results[0]) || lastRoll.results.length <= 1))}
                                        startIcon={rolling ? null : <CasinoIcon />}
                                        sx={{
                                            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                                            boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                                            height: 56,
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {rolling ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 0.5, ease: 'linear' }}
                                            >
                                                <CasinoIcon />
                                            </motion.div>
                                        ) : 'LANZAR DADOS'}
                                    </Button>
                                </motion.div>

                                {onEndTurn && (
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        color="warning"
                                        onClick={onEndTurn}
                                        disabled={!isMyTurn || rolling}
                                    >
                                        Finalizar Turno
                                    </Button>
                                )}
                            </Stack>
                        </Tooltip>

                        <Box mt={2}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={autoSalary}
                                        onChange={(e) => setAutoSalary(e.target.checked)}
                                        color="success"
                                    />
                                }
                                label={<Typography variant="caption" color="text.secondary">Pagar Salario Automático ($200) al pasar por Salida</Typography>}
                            />
                        </Box>

                        {/* Notification Toast */}
                        <Snackbar
                            open={notification.open}
                            autoHideDuration={4000}
                            onClose={() => setNotification({ ...notification, open: false })}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        >
                            <Alert severity="success" variant="filled" onClose={() => setNotification({ ...notification, open: false })}>
                                {notification.message}
                            </Alert>
                        </Snackbar>

                        {/* Current Result Display */}
                        {lastRoll && (
                            <Box mt={3} p={2} bgcolor="background.default" borderRadius={2} textAlign="center" border="1px dashed #444">
                                <Typography variant="overline" color="text.secondary">Tu último lanzamiento</Typography>
                                <motion.div
                                    key={`total-${lastRoll.id}`}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                                >
                                    <Typography variant="h3" fontWeight="900" color="primary.main">
                                        {lastRoll.total}
                                    </Typography>
                                </motion.div>
                                <Stack direction="row" gap={1} justifyContent="center" mt={1}>
                                    <AnimatePresence>
                                        {lastRoll.results.map((r, i) => (
                                            <motion.div
                                                key={`${lastRoll.id}-${i}`}
                                                initial={{ scale: 0, rotate: -180, y: 20 }}
                                                animate={{ scale: 1, rotate: 0, y: 0 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 260,
                                                    damping: 20,
                                                    delay: i * 0.1
                                                }}
                                            >
                                                <Paper
                                                    elevation={4}
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: 'primary.main',
                                                        color: 'white',
                                                        borderRadius: 2,
                                                        border: '2px solid rgba(255,255,255,0.2)'
                                                    }}
                                                >
                                                    <Typography variant="h6" fontWeight="bold">{r}</Typography>
                                                </Paper>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </Stack>
                            </Box>
                        )}
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                    {/* History */}
                    <Box flex={1}>
                        <Stack
                            direction="row"
                            alignItems="center"
                            gap={1}
                            mb={1}
                            onClick={() => setShowHistory(!showHistory)}
                            sx={{ cursor: 'pointer', userSelect: 'none' }}
                        >
                            <HistoryIcon fontSize="small" color="disabled" />
                            <Typography variant="caption" color="text.secondary">Historial Reciente</Typography>
                            {showHistory ? <ExpandLessIcon fontSize="small" color="disabled" /> : <ExpandMoreIcon fontSize="small" color="disabled" />}
                        </Stack>
                        <Collapse in={showHistory}>
                            <Box maxHeight={300} overflow="auto">
                                <List dense>
                                    {history.length === 0 && <Typography variant="body2" color="text.disabled">Sin lanzamientos aún.</Typography>}
                                    {history.map((item, idx) => {
                                        const ts = parseServerDate(item.roll.created_at);
                                        const timeStr = ts ? new Date(ts).toLocaleTimeString() : '';
                                        return (
                                            <ListItem key={item.roll.id || idx} divider>
                                                <ListItemText
                                                    primaryTypographyProps={{ component: 'div' }}
                                                    secondaryTypographyProps={{ component: 'div' }}
                                                    primary={
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                            <Typography fontWeight="bold" variant="body2">{item.user_name}</Typography>
                                                            <Typography fontWeight="800" color="secondary.light">{item.roll.total}</Typography>
                                                        </Stack>
                                                    }
                                                    secondary={
                                                        <Stack direction="row" justifyContent="space-between" mt={0.5}>
                                                            <Typography variant="caption" color="text.disabled">
                                                                {item.roll.dice_count}d{item.roll.dice_sides}: [{item.roll.results.join(', ')}]
                                                            </Typography>
                                                            <Typography variant="caption" color="text.disabled">{timeStr}</Typography>
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
                </Stack>
            </CardContent>

            <ConfirmDialog
                open={confirmRollOpen}
                title="¿Lanzar Dados?"
                description={`¿Estás seguro de que quieres lanzar ${count}d${sides}?`}
                onConfirm={handleConfirmRoll}
                onClose={() => setConfirmRollOpen(false)}
                confirmText="Lanzar"
            />
        </Card>
    );
});

DiceSection.displayName = "DiceSection";
export default DiceSection;
