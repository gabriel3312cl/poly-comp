'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    InputAdornment,
    Stack,
    Typography
} from '@mui/material';

interface TransferDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (amount: number, description: string) => void;
    targetName: string;
    type: 'PAY' | 'CHARGE' | 'BANK_PAY' | 'BANK_RECEIVE';
    loading?: boolean;
}

export default function TransferDialog({ open, onClose, onConfirm, targetName, type, loading }: TransferDialogProps) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const handleAddAmount = (val: number) => {
        const currentVal = parseFloat(amount) || 0;
        setAmount((currentVal + val).toString());
    };

    const handleClear = () => {
        setAmount('');
    };

    const handleSubmit = () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;
        onConfirm(val, description);
        setAmount('');
        setDescription('');
    };

    const getTitle = () => {
        switch (type) {
            case 'PAY': return `Pagar a ${targetName}`;
            case 'CHARGE': return `Cobrar a ${targetName}`;
            case 'BANK_PAY': return `Pagar al Banco`;
            case 'BANK_RECEIVE': return `Recibir del Banco`;
        }
    };

    const getColor = () => {
        if (type === 'PAY' || type === 'BANK_PAY') return 'error';
        return 'success';
    };

    // Preset values requested by user
    const PRESETS = [1, 5, 10, 20, 50, 100, 500, 1000];

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle fontWeight="bold" color={getColor() === 'error' ? 'error.main' : 'success.main'}>
                {getTitle()}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} mt={1}>
                    <TextField
                        label="Cantidad"
                        type="number"
                        fullWidth
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            style: { fontSize: '1.5rem', fontWeight: 'bold' }
                        }}
                    />

                    {/* Preset Buttons Grid */}
                    <Stack spacing={1}>
                        <Typography variant="caption" color="text.secondary">Añadir cantidad:</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                            {PRESETS.map(val => (
                                <Button
                                    key={val}
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleAddAmount(val)}
                                    sx={{ minWidth: '60px', flexGrow: 1 }}
                                >
                                    +{val}
                                </Button>
                            ))}
                        </Stack>
                    </Stack>

                    <Button
                        variant="text"
                        color="inherit"
                        onClick={handleClear}
                        disabled={!amount}
                    >
                        Limpiar Cantidad
                    </Button>

                    <TextField
                        label="¿Para qué? (Opcional)"
                        placeholder="Alquiler, Impuestos, Salida (GO)..."
                        fullWidth
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} size="large">Cancelar</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color={getColor()}
                    size="large"
                    disabled={!amount || loading}
                >
                    Confirmar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
