import { Box, Paper, Typography, Avatar, Zoom, ToggleButton, ToggleButtonGroup, Card, CardContent, Grid, Divider, IconButton } from '@mui/material';
import { BOARD_SPACES } from '@/utils/boardSpaces';
import { useAuthStore } from '@/store/authStore';
import { DiceHistoryItem } from '@/hooks/useDice';
import { useState } from 'react';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MapIcon from '@mui/icons-material/Map';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import CloseIcon from '@mui/icons-material/Close';

interface Participant {
    id: string;
    user_id: string;
    first_name: string;
    position: number;
    avatar_url?: string;
    color?: string;
}

interface GameBoardProps {
    participants: Participant[];
    diceHistory?: DiceHistoryItem[];
}

// 2d6 Distribution (Total: 36 combinations)
const PROBABILITIES: Record<number, number> = {
    2: 1, 3: 2, 4: 3, 5: 4, 6: 5,
    7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1
};

export default function GameBoard({ participants, diceHistory = [] }: GameBoardProps) {
    const user = useAuthStore(state => state.user);
    const myParticipant = participants.find(p => p.user_id === user?.id);

    // UI State
    const [viewLayer, setViewLayer] = useState<'standard' | 'heatmap' | 'history'>('standard');
    const [selectedSpaceIndex, setSelectedSpaceIndex] = useState<number | null>(null);

    // Helpers
    const getStepsFromMe = (targetIndex: number) => {
        if (!myParticipant) return null;
        let steps = targetIndex - myParticipant.position;
        if (steps < 0) steps += 40;
        return steps;
    };

    const getMathProb = (steps: number) => {
        if (steps < 2 || steps > 12) return 0;
        return (PROBABILITIES[steps] / 36) * 100;
    };

    // Derived Data for Visualization
    const getSpaceColorOverlay = (index: number) => {
        if (!myParticipant) return 'transparent';
        const steps = getStepsFromMe(index);

        if (viewLayer === 'heatmap') {
            // Heatmap: Probability of landing here NEXT TURN (Math)
            if (steps === null || steps < 2 || steps > 12) return 'transparent';
            const prob = getMathProb(steps);
            // Opacity based on probability (Max ~16.7%)
            const opacity = (prob / 16.7) * 0.8;
            // Color scale: Green (High) -> Red (Low)? Or just Heat (Red=High)?
            // Usually Heatmap: Red = High freq.
            return `rgba(255, 0, 0, ${opacity})`;
        }

        if (viewLayer === 'history') {
            // History: Freq of rolling this number
            if (steps === null) return 'transparent';
            // Only count reachable 2-12 for dice heatmap? Or any distance?
            // Dice history is strictly Roll Total. So only 2-12 matters.
            if (steps < 2 || steps > 12) return 'transparent';

            const myRolls = diceHistory.filter(h => h.user_id === user?.id);
            const matching = myRolls.filter(h => h.roll.total === steps).length;
            const total = myRolls.length || 1;
            const freq = matching / total;
            // Normalize: Max expected is ~0.16. If > 0.16, super hot.
            const intensity = Math.min((freq / 0.16) * 0.6, 0.9);
            return `rgba(0, 0, 255, ${intensity})`; // Blue for history
        }

        return 'transparent';
    };

    const getGridPosition = (index: number) => {
        if (index >= 0 && index <= 10) return { gridRow: 11, gridColumn: 11 - index };
        if (index >= 11 && index <= 19) return { gridRow: 11 - (index - 10), gridColumn: 1 };
        if (index >= 20 && index <= 30) return { gridRow: 1, gridColumn: index - 19 };
        if (index >= 31 && index <= 39) return { gridRow: index - 29, gridColumn: 11 };
        return { gridRow: 1, gridColumn: 1 };
    };

    // Side Panel Content
    const renderSidePanel = () => {
        if (selectedSpaceIndex === null) {
            return (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" p={2} textAlign="center" color="text.secondary">
                    <MapIcon sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
                    <Typography>Select a space on the board to view detailed statistics and intelligence.</Typography>
                </Box>
            );
        }

        const space = BOARD_SPACES[selectedSpaceIndex];
        const steps = getStepsFromMe(selectedSpaceIndex);
        const reachable = steps !== null && steps >= 2 && steps <= 12;
        const mathProb = steps !== null ? getMathProb(steps) : 0;

        // History Stats
        const myRolls = diceHistory.filter(h => h.user_id === user?.id);
        const totalRolls = myRolls.length;
        const matchingRolls = reachable ? myRolls.filter(h => h.roll.total === steps).length : 0;
        const histProb = totalRolls > 0 ? (matchingRolls / totalRolls) * 100 : 0;

        return (
            <Box p={2} height="100%" overflow="auto">
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">{space.name}</Typography>
                    <IconButton size="small" onClick={() => setSelectedSpaceIndex(null)}><CloseIcon /></IconButton>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Space Details */}
                <Grid container spacing={2} mb={3}>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Type</Typography>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{space.type}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Price</Typography>
                        <Typography variant="body2" fontWeight="bold">{space.price ? `$${space.price}` : '-'}</Typography>
                    </Grid>
                </Grid>

                {/* Intelligence Section */}
                <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
                            <AssessmentIcon fontSize="small" color="primary" /> Intelligence
                        </Typography>

                        {myParticipant && (
                            <>
                                <Box mb={2}>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="body2">Distance</Typography>
                                        <Typography variant="body2" fontWeight="bold">{steps} steps</Typography>
                                    </Box>
                                    {!reachable && (
                                        <Typography variant="caption" color="error">Cannot reach in next turn</Typography>
                                    )}
                                </Box>

                                {reachable && (
                                    <>
                                        <Box mb={2}>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="body2">Math Probability</Typography>
                                                <Typography variant="body2" fontWeight="bold" color="info.main">{mathProb.toFixed(1)}%</Typography>
                                            </Box>
                                            <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(255,255,255,0.1)', mt: 0.5, borderRadius: 1 }}>
                                                <Box sx={{ width: `${mathProb}%`, height: '100%', bgcolor: 'info.main', borderRadius: 1 }} />
                                            </Box>
                                        </Box>

                                        <Box>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="body2">Your History</Typography>
                                                <Typography variant="body2" fontWeight="bold" color={histProb > mathProb ? 'success.main' : 'warning.main'}>
                                                    {histProb.toFixed(1)}%
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                You rolled a {steps} in {matchingRolls} of your {totalRolls} turns.
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </Box>
        );
    };

    return (
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} alignItems="start">
            {/* Left: Visualization Controls & Board */}
            <Box flexGrow={1} width="100%">
                {/* Layer Controls */}
                <Box mb={2} display="flex" justifyContent="center">
                    <ToggleButtonGroup
                        value={viewLayer}
                        exclusive
                        onChange={(e, v) => v && setViewLayer(v)}
                        size="small"
                        aria-label="map layers"
                        sx={{ bgcolor: 'background.paper' }}
                    >
                        <ToggleButton value="standard">
                            <MapIcon fontSize="small" sx={{ mr: 1 }} /> Standard
                        </ToggleButton>
                        <ToggleButton value="heatmap">
                            <WhatshotIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} /> Next Roll Prob
                        </ToggleButton>
                        <ToggleButton value="history">
                            <AssessmentIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} /> My History
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* The Board */}
                <Paper
                    elevation={6}
                    sx={{
                        p: 2,
                        bgcolor: '#cde6d0',
                        borderRadius: 4,
                        overflow: 'hidden',
                        position: 'relative',
                        aspectRatio: '1/1',
                        width: '100%',
                        maxWidth: 600,
                        mx: 'auto'
                    }}
                >
                    <Box
                        display="grid"
                        gridTemplateColumns="repeat(11, 1fr)"
                        gridTemplateRows="repeat(11, 1fr)"
                        gap={0.5}
                        sx={{ width: '100%', height: '100%' }}
                    >
                        {/* Center Logo */}
                        <Box sx={{ gridColumn: '2 / 11', gridRow: '2 / 11', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="h2" fontWeight="900" color="success.main" sx={{ transform: 'rotate(-45deg)', opacity: 0.15 }}>POLY-COMP</Typography>
                        </Box>

                        {BOARD_SPACES.map((space) => {
                            const pos = getGridPosition(space.index);
                            const overlayColor = getSpaceColorOverlay(space.index);
                            const isSelected = selectedSpaceIndex === space.index;
                            const occupants = participants.filter(p => p.position === space.index);

                            return (
                                <Box
                                    key={space.index}
                                    onClick={() => setSelectedSpaceIndex(space.index)}
                                    sx={{
                                        ...pos,
                                        bgcolor: 'white',
                                        border: isSelected ? '3px solid #FFD700' : '1px solid black',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'space-between', // Maintain spacing
                                        p: 0.2, // Reduced padding to fit text
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': { zIndex: 10, boxShadow: 6, transform: 'scale(1.1)' }
                                    }}
                                >
                                    {/* Intelligence Overlay */}
                                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: overlayColor, zIndex: 5, pointerEvents: 'none' }} />

                                    {/* Header Color */}
                                    {space.color && <Box sx={{ width: '100%', height: space.type === 'corner' ? 0 : '18%', bgcolor: space.color, borderBottom: '1px solid black' }} />}

                                    {/* Content */}
                                    <Box zIndex={6} display="flex" flexDirection="column" alignItems="center" justifyContent="center" width="100%" height="100%" sx={{ pointerEvents: 'none' }}>
                                        <Typography sx={{ fontSize: '0.45rem', fontWeight: 'bold', color: 'black', textAlign: 'center', lineHeight: 1, width: '100%', wordBreak: 'break-all' }}>
                                            {space.name}
                                        </Typography>
                                        {space.price && <Typography sx={{ fontSize: '0.55rem', color: 'black', mt: 0.5 }}>${space.price}</Typography>}
                                        {space.type === 'chance' && <Typography variant="caption" color="warning.main" fontWeight="bold">?</Typography>}
                                        {space.type === 'chest' && <Typography variant="caption" color="info.main" fontWeight="bold">📦</Typography>}
                                    </Box>

                                    {/* Avatars */}
                                    {occupants.length > 0 && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', position: 'absolute', bottom: 1, width: '100%', zIndex: 7 }}>
                                            {occupants.map(p => (
                                                <Avatar key={p.id} src={p.avatar_url} sx={{ width: 14, height: 14, border: '1px solid white' }}>{p.first_name[0]}</Avatar>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>
            </Box>

            {/* Right: Intelligence Sidebar */}
            <Paper elevation={3} sx={{ width: { xs: '100%', md: 300 }, height: { xs: 'auto', md: 600 }, flexShrink: 0, bgcolor: 'background.paper', borderRadius: 4, overflow: 'hidden' }}>
                {renderSidePanel()}
            </Paper>
        </Box>
    );
}
