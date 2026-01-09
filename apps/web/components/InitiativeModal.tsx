import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    TextField,
    Typography,
    Box
} from '@mui/material';
import { GameParticipant } from '@/hooks/useGame';

interface InitiativeModalProps {
    open: boolean;
    onClose: () => void;
    participants: GameParticipant[];
    onConfirm: (rolls: Record<string, number>) => void;
}

export default function InitiativeModal({ open, onClose, participants, onConfirm }: InitiativeModalProps) {
    const [rolls, setRolls] = useState<Record<string, string>>({});

    const handleInputChange = (userId: string, value: string) => {
        setRolls(prev => ({ ...prev, [userId]: value }));
    };

    const handleConfirm = () => {
        const numericRolls: Record<string, number> = {};
        participants.forEach(p => {
            numericRolls[p.user_id] = parseInt(rolls[p.user_id] || '0', 10);
        });
        onConfirm(numericRolls);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Determinar Orden de Turno</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Ingresa el resultado de los dados para cada jugador para determinar quién comienza.
                </Typography>
                <List>
                    {participants.map((p) => (
                        <ListItem key={p.id}>
                            <ListItemText primary={p.username || `${p.first_name} ${p.last_name}`} />
                            <Box sx={{ width: 80 }}>
                                <TextField
                                    size="small"
                                    type="number"
                                    placeholder="Roll"
                                    value={rolls[p.user_id] || ''}
                                    onChange={(e) => handleInputChange(p.user_id, e.target.value)}
                                    slotProps={{
                                        input: {
                                            inputProps: { min: 2, max: 12 }
                                        }
                                    }}
                                />
                            </Box>
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleConfirm} variant="contained" color="primary">
                    Iniciar Partida
                </Button>
            </DialogActions>
        </Dialog>
    );
}
