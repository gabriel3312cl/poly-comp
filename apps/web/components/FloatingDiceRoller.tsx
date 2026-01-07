
import { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Fab,
    Tooltip,
    Stack
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import { useRollDice } from '@/hooks/useDice';

interface FloatingDiceRollerProps {
    gameId: string;
}

export default function FloatingDiceRoller({ gameId }: FloatingDiceRollerProps) {
    const [open, setOpen] = useState(false);
    const [result, setResult] = useState<number[] | null>(null);
    const { mutate: roll, isPending } = useRollDice(gameId);

    const handleRoll = (count: number) => {
        new Audio('/dice.mp3').play().catch(e => console.error(e));
        roll({ sides: 6, count }, {
            onSuccess: (data) => {
                setResult(data.results);
                new Audio('/notification.mp3').play().catch(e => console.error(e));
            }
        });
    };

    const handleClose = () => {
        setOpen(false);
        setResult(null);
    };

    return (
        <>
            <Tooltip title="Roll Dice">
                <Fab
                    color="error"
                    onClick={() => setOpen(true)}
                    size="medium"
                >
                    <CasinoIcon />
                </Fab>
            </Tooltip>

            <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
                <DialogTitle textAlign="center">Roll Standard Dice</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} alignItems="center" py={2}>
                        {result ? (
                            <Box textAlign="center" animation="fadeIn 0.5s">
                                <Stack direction="row" spacing={2} justifyContent="center" mb={2}>
                                    {result.map((val, i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                width: 60,
                                                height: 60,
                                                bgcolor: 'white',
                                                color: 'black',
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                                boxShadow: 3
                                            }}
                                        >
                                            {val}
                                        </Box>
                                    ))}
                                </Stack>
                                <Typography variant="h5" fontWeight="bold">
                                    Total: {result.reduce((a, b) => a + b, 0)}
                                </Typography>
                            </Box>
                        ) : (
                            <Typography color="text.secondary">Select dice count to roll</Typography>
                        )}

                        {!result && (
                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => handleRoll(1)}
                                    disabled={isPending}
                                >
                                    1 Die
                                </Button>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => handleRoll(2)}
                                    disabled={isPending}
                                >
                                    2 Dice
                                </Button>
                            </Stack>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    {result ? (
                        <Button onClick={() => setResult(null)} variant="outlined">Roll Again</Button>
                    ) : null}
                    <Button onClick={handleClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
