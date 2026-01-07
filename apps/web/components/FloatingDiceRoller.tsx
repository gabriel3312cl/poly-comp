
import { useState } from 'react';
import {
    Box,
    Typography,
    Fab,
    Tooltip,
    Stack,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import { useRollDice } from '@/hooks/useDice';
import ConfirmDialog from './ConfirmDialog';

interface FloatingDiceRollerProps {
    gameId: string;
}

export default function FloatingDiceRoller({ gameId }: FloatingDiceRollerProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [resultOpen, setResultOpen] = useState(false);
    const [result, setResult] = useState<number[] | null>(null);
    const { mutate: roll, isPending } = useRollDice(gameId);

    const handleFabClick = () => {
        setConfirmRollOpen(true);
    };

    const [confirmRollOpen, setConfirmRollOpen] = useState(false);

    const handleConfirmRoll = () => {
        const audio = new Audio('/dice.mp3');
        audio.play().catch(e => console.error(e));

        // Default to Standard Monopoly Roll: 2 Dice, 6 Sides, Auto-Salary ON
        roll({ sides: 6, count: 2, autoSalary: true }, {
            onSuccess: (data) => {
                setResult(data.results);
                setConfirmRollOpen(false);
                setResultOpen(true);

                // Doubles sound check logic could be here, but simpler to just play notification
                // new Audio('/notification.mp3').play().catch(e => console.error(e));
            }
        });
    };

    return (
        <>
            <Tooltip title="Roll Dice (Shortcut)">
                <Fab
                    color="error" // Main Dice Color
                    onClick={handleFabClick}
                    size="medium"
                    sx={{
                        background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                        boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                    }}
                >
                    <CasinoIcon />
                </Fab>
            </Tooltip>

            <ConfirmDialog
                open={confirmRollOpen}
                title="Roll Dice?"
                description="Roll 2 standard dice?"
                onConfirm={handleConfirmRoll}
                onClose={() => setConfirmRollOpen(false)}
                confirmText={isPending ? "Rolling..." : "Roll"}
            />

            {/* Result Dialog (Simple) */}
            <Dialog open={resultOpen} onClose={() => setResultOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle textAlign="center" fontWeight="bold">Roll Result</DialogTitle>
                <DialogContent>
                    <Box textAlign="center" py={2}>
                        <Stack direction="row" spacing={2} justifyContent="center" mb={2}>
                            {result?.map((val, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        width: 60, height: 60,
                                        bgcolor: 'white', color: 'black',
                                        borderRadius: 2,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '2rem', fontWeight: 'bold',
                                        boxShadow: 3,
                                        border: '1px solid #ddd'
                                    }}
                                >
                                    {val}
                                </Box>
                            ))}
                        </Stack>
                        <Typography variant="h4" fontWeight="900" color="primary">
                            Total: {result?.reduce((a, b) => a + b, 0)}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button onClick={() => setResultOpen(false)} variant="contained">OK</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
