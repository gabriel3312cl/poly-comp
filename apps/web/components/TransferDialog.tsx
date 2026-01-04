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

    const handleSubmit = () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;
        onConfirm(val, description);
        setAmount('');
        setDescription('');
    };

    const getTitle = () => {
        switch (type) {
            case 'PAY': return `Pay ${targetName}`;
            case 'CHARGE': return `Charge ${targetName}`;
            case 'BANK_PAY': return `Pay to Bank`;
            case 'BANK_RECEIVE': return `Receive from Bank`;
        }
    };

    const getColor = () => {
        if (type === 'PAY' || type === 'BANK_PAY') return 'error';
        return 'success';
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle fontWeight="bold" color={getColor() === 'error' ? 'error.main' : 'success.main'}>
                {getTitle()}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} mt={1}>
                    <TextField
                        autoFocus
                        label="Amount"
                        type="number"
                        fullWidth
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            style: { fontSize: '1.5rem', fontWeight: 'bold' }
                        }}
                    />
                    <TextField
                        label="For what? (Optional)"
                        placeholder="Rent, Tax, Go..."
                        fullWidth
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    {/* Quick Buttons */}
                    <Stack direction="row" spacing={1}>
                        {[50, 100, 200, 500].map(val => (
                            <Button key={val} variant="outlined" size="small" onClick={() => setAmount(val.toString())}>
                                ${val}
                            </Button>
                        ))}
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} size="large">Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color={getColor()}
                    size="large"
                    disabled={!amount || loading}
                >
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
}
