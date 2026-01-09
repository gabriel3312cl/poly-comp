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
import { motion, AnimatePresence } from 'framer-motion';
import { GameParticipant } from '@/hooks/useGame';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; // Use as Pay Icon
import CallReceivedIcon from '@mui/icons-material/CallReceived'; // Use as Request?
import SendIcon from '@mui/icons-material/Send';
import { useAuthStore } from '@/store/authStore';
import { getSpaceName, BOARD_SPACES } from '@/utils/boardSpaces';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import { useState } from 'react';
import { useUpdatePosition } from '@/hooks/useGame';
import { useParams } from 'next/navigation';

interface ParticipantListProps {
    participants: GameParticipant[];
    onTransfer: (targetId: string, type: 'PAY' | 'CHARGE') => void;
    onTrade?: (targetId: string) => void;
    isInDebt?: boolean;
}

export default function ParticipantList({ participants, onTransfer, isInDebt }: ParticipantListProps) {
    const { id: gameId } = useParams() as { id: string };
    const user = useAuthStore((state) => state.user);
    const { mutate: updatePos } = useUpdatePosition();

    // Dialog State
    const [editPosOpen, setEditPosOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [newPosition, setNewPosition] = useState<number>(0);

    const handleOpenEdit = (userId: string, currentPos: number) => {
        setSelectedUser(userId);
        setNewPosition(currentPos);
        setEditPosOpen(true);
    };

    const handleSavePos = () => {
        if (selectedUser) {
            updatePos({ gameId, userId: selectedUser, position: newPosition });
            setEditPosOpen(false);
        }
    };

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
                        <motion.div
                            whileHover={{ scale: 1.02, translateY: -5 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
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
                                        TÚ
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
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={p.balance}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Typography variant="h4" fontWeight="800" color={p.balance >= 0 ? 'success.light' : 'error.main'}>
                                                    ${p.balance.toLocaleString()}
                                                </Typography>
                                            </motion.div>
                                        </AnimatePresence>
                                    </Box>

                                    {/* Actions: Only show for others. If it's me, I can't pay myself. */}
                                    {!isMe && (
                                        <Stack direction="row" spacing={1} mt={2}>
                                            <Tooltip title={isInDebt ? "No puedes pagar mientras estés en deuda" : "Pagar a este jugador"}>
                                                <span style={{ cursor: isInDebt ? 'not-allowed' : 'pointer' }}>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        disabled={isInDebt}
                                                        sx={{ border: '1px solid', borderColor: 'error.main', borderRadius: 2 }}
                                                        onClick={() => onTransfer(p.id, 'PAY')}
                                                    >
                                                        <SendIcon fontSize="small" /> <Typography variant="caption" ml={0.5}>PAGAR</Typography>
                                                    </IconButton>
                                                </span>
                                            </Tooltip>

                                            {/* "Charge" implies I take their money (e.g. they landed on my property) */}
                                            <Tooltip title="Cobrar a este jugador (Recibir)">
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    sx={{ border: '1px solid', borderColor: 'success.main', borderRadius: 2 }}
                                                    onClick={() => onTransfer(p.id, 'CHARGE')}
                                                >
                                                    <CallReceivedIcon fontSize="small" /> <Typography variant="caption" ml={0.5}>COBRAR</Typography>
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    )}

                                    <Box mt={2}>
                                        <Button
                                            size="small"
                                            variant="text"
                                            color="inherit"
                                            startIcon={<EditLocationIcon />}
                                            onClick={() => handleOpenEdit(p.user_id, p.position)}
                                        >
                                            Pos: {getSpaceName(p.position)}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Grid>
                );
            })}

            {/* Position Correction Dialog */}
            <Dialog open={editPosOpen} onClose={() => setEditPosOpen(false)}>
                <DialogTitle>Corregir Posición del Jugador</DialogTitle>
                <DialogContent sx={{ minWidth: 300, mt: 1 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Casilla del Tablero</InputLabel>
                        <Select
                            value={newPosition}
                            label="Casilla del Tablero"
                            onChange={(e) => setNewPosition(Number(e.target.value))}
                            MenuProps={{ PaperProps: { sx: { maxHeight: 400 } } }}
                        >
                            {BOARD_SPACES.map((space) => (
                                <MenuItem key={space.index} value={space.index}>
                                    {space.index}. {space.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditPosOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSavePos} variant="contained">Actualizar</Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
}
