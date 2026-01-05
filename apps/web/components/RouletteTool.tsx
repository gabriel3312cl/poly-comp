'use client';

import { useState, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Collapse,
    Stack,
    keyframes
} from '@mui/material';
import DataUsageIcon from '@mui/icons-material/DataUsage'; // Wheel icon equivalent
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Trophy icon
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { usePerformTransfer, useClaimJackpot } from '@/hooks/useTransactions';
import ConfirmDialog from './ConfirmDialog';

type OptionType = 'red' | 'green';

interface RouletteOption {
    id: number;
    label: string;
    type: OptionType;
    value: number; // For potential automation later, though text describes unique actions
}

const OPTIONS: RouletteOption[] = [
    { id: 1, label: 'Pay 150 to bank', type: 'red', value: -150 },
    { id: 2, label: 'Compra 1 propiedad sin dueño', type: 'green', value: 0 },
    { id: 3, label: 'Pay 50 to bank', type: 'red', value: -50 },
    { id: 4, label: 'Gran Premio', type: 'green', value: 0 },
    { id: 5, label: 'Pay 100 to bank', type: 'red', value: -100 },
    { id: 6, label: 'Take the token', type: 'green', value: 0 },
    { id: 7, label: 'Pay 200 to bank', type: 'red', value: -200 },
    { id: 8, label: 'Free house', type: 'green', value: 0 },
];

interface RouletteToolProps {
    gameId: string;
    myParticipantId?: string;
    jackpotBalance: number;
}

export default function RouletteTool({ gameId, myParticipantId, jackpotBalance }: RouletteToolProps) {
    const transferMutation = usePerformTransfer();
    const claimJackpotMutation = useClaimJackpot();

    const [isOpen, setIsOpen] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedOption, setSelectedOption] = useState<RouletteOption | null>(null);
    const [displayIndex, setDisplayIndex] = useState(0);

    // Dialog states
    const [confirmSpinOpen, setConfirmSpinOpen] = useState(false);
    const [confirmJackpotOpen, setConfirmJackpotOpen] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const playSound = (path: string) => {
        const audio = new Audio(path);
        audio.play().catch(e => console.error('Error playing sound:', e));
    };

    const handleSpin = () => {
        if (isSpinning) return;

        playSound('/roullette.mp3');

        setIsSpinning(true);
        setSelectedOption(null);

        let spinTime = 0;
        const totalSpinTime = 10000; // 10 seconds fixed duration
        const speed = 50; // Update every 50ms

        intervalRef.current = setInterval(() => {
            setDisplayIndex((prev) => (prev + 1) % OPTIONS.length);
            spinTime += speed;

            if (spinTime >= totalSpinTime) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                const winnerIndex = Math.floor(Math.random() * OPTIONS.length);
                const winner = OPTIONS[winnerIndex];

                setDisplayIndex(winnerIndex);
                setSelectedOption(winner);
                setIsSpinning(false);

                if (winner.type === 'green') {
                    playSound('/success.mp3');
                    if (winner.label === 'Gran Premio') {
                        claimJackpotMutation.mutate({ gameId });
                    }
                } else {
                    playSound('/fail.mp3');
                    const amount = Math.abs(winner.value);
                    if (amount > 0 && myParticipantId) {
                        transferMutation.mutate({
                            gameId,
                            amount: amount,
                            description: winner.label,
                            from_participant_id: myParticipantId,
                            to_participant_id: null,
                        });
                    }
                }
            }
        }, speed);
    };

    return (
        <Paper sx={{ mb: 2, overflow: 'hidden', borderRadius: 2 }}>
            <Box
                p={2}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => setIsOpen(!isOpen)}
                sx={{ cursor: 'pointer', bgcolor: 'background.paper' }}
            >
                <Stack direction="row" alignItems="center" gap={1}>
                    <DataUsageIcon color="secondary" />
                    <Typography fontWeight="bold">Roulette</Typography>
                </Stack>
                <Typography variant="body2" color="success.main" fontWeight="bold">
                    Jackpot: ${jackpotBalance.toLocaleString()}
                </Typography>
                {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>

            <Collapse in={isOpen}>
                <Box p={2} pt={0} display="flex" flexDirection="column" alignItems="center">
                    <Box
                        sx={{
                            width: '100%',
                            p: 3,
                            mb: 2,
                            borderRadius: 2,
                            bgcolor: isSpinning
                                ? (OPTIONS[displayIndex].type === 'red' ? 'error.dark' : 'success.dark')
                                : selectedOption
                                    ? (selectedOption.type === 'red' ? 'error.main' : 'success.main')
                                    : 'action.hover',
                            color: 'common.white',
                            textAlign: 'center',
                            transition: 'background-color 0.1s',
                            minHeight: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold">
                            {isSpinning
                                ? OPTIONS[displayIndex].label
                                : selectedOption
                                    ? selectedOption.label
                                    : 'Press Spin'}
                        </Typography>

                    </Box>

                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        fullWidth
                        onClick={() => setConfirmSpinOpen(true)}
                        disabled={isSpinning}
                    >
                        {isSpinning ? 'Spinning...' : 'SPIN ROULETTE'}
                    </Button>

                    <Button
                        variant="outlined"
                        color="success"
                        startIcon={<EmojiEventsIcon />}
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={() => setConfirmJackpotOpen(true)}
                        disabled={isSpinning || jackpotBalance <= 0}
                    >
                        WIN JACKPOT MANUALLY
                    </Button>
                </Box>
            </Collapse>

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                open={confirmSpinOpen}
                title="Spin the Roulette?"
                description="This will roll the wheel and may result in winning the jackpot or paying fees."
                confirmText="Spin It!"
                onClose={() => setConfirmSpinOpen(false)}
                onConfirm={handleSpin}
            />

            <ConfirmDialog
                open={confirmJackpotOpen}
                title="Claim Jackpot?"
                description={`Are you sure you want to manually claim the jackpot of $${jackpotBalance.toLocaleString()}? This is usually done by winning the roulette.`}
                confirmText="Claim Jackpot"
                severity="success"
                onClose={() => setConfirmJackpotOpen(false)}
                onConfirm={() => claimJackpotMutation.mutate({ gameId })}
            />
        </Paper>
    );
}
