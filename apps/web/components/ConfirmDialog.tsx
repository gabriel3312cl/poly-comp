'use client';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography
} from '@mui/material';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
    onClose: () => void;
    confirmText?: string;
    cancelText?: string;
    severity?: 'info' | 'warning' | 'error' | 'success';
}

export default function ConfirmDialog({
    open,
    title,
    description,
    onConfirm,
    onClose,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    severity = 'info'
}: ConfirmDialogProps) {

    // Map severity to colors
    const getColor = () => {
        switch (severity) {
            case 'error': return 'error';
            case 'warning': return 'warning';
            case 'success': return 'success';
            default: return 'primary';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle fontWeight="bold">{title}</DialogTitle>
            <DialogContent>
                {description && (
                    <Typography variant="body1" color="text.secondary">
                        {description}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} size="large" color="inherit">
                    {cancelText}
                </Button>
                <Button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    variant="contained"
                    color={getColor()}
                    size="large"
                    autoFocus
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
