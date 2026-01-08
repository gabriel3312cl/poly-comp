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
    const [viewLayer, setViewLayer] = useState<'standard' | 'heatmap' | 'landings'>('standard');
    const [selectedSpaceIndex, setSelectedSpaceIndex] = useState<number | null>(null);

    // Logic: Reconstruct Landing History
    // We simulate the game from the beginning to find "hot spots"
    const landingStats = (() => {
        // Sort history: oldest first
        const sortedHistory = [...diceHistory].sort((a, b) =>
            new Date(a.roll.created_at).getTime() - new Date(b.roll.created_at).getTime()
        );

        const positions: Record<string, number> = {}; // userId -> currentPos
        const counts: Record<number, number> = {}; // spaceIndex -> visitCount
        let maxVisits = 1;

        // Initialize positions at 0 (Go)
        participants.forEach(p => positions[p.user_id] = 0);
        // Also ensure historical users are tracked if they left? 
        // For now, only track current participants or users in history.
        // Better: Initialize for any user found in history.

        sortedHistory.forEach(h => {
            const uid = h.roll.user_id;
            // Default to 0 if new user
            const current = positions[uid] !== undefined ? positions[uid] : 0;
            const next = (current + h.roll.total) % 40;

            positions[uid] = next;
            counts[next] = (counts[next] || 0) + 1;
            if (counts[next] > maxVisits) maxVisits = counts[next];
        });

        return { counts, maxVisits };
    })();

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

    // Derived Data for Overlay
    const getSpaceColorOverlay = (index: number) => {
        // Layer 1: Next Roll Probability (Heatmap)
        if (viewLayer === 'heatmap') {
            if (!myParticipant) return 'transparent';
            const steps = getStepsFromMe(index);
            if (steps === null || steps < 2 || steps > 12) return 'transparent';
            const prob = getMathProb(steps);
            const opacity = (prob / 16.7) * 0.8;
            return `rgba(255, 0, 0, ${opacity})`;
        }

        // Layer 2: Landing Frequency (Global History)
        if (viewLayer === 'landings') {
            const count = landingStats.counts[index] || 0;
            if (count === 0) return 'transparent';
            // Intensity relative to max visits
            const intensity = Math.min((count / landingStats.maxVisits) * 0.6 + 0.1, 0.8);
            return `rgba(147, 51, 234, ${intensity})`; // Purple for landing history
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
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" p={3} textAlign="center" color="text.secondary">
                    <MapIcon sx={{ fontSize: 30, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2">Select a space on the board to view detailed statistics.</Typography>
                </Box>
            );
        }

        const space = BOARD_SPACES[selectedSpaceIndex];
        const steps = getStepsFromMe(selectedSpaceIndex);
        const reachable = steps !== null && steps >= 2 && steps <= 12;
        const mathProb = steps !== null ? getMathProb(steps) : 0;

        // Stats
        const visits = landingStats.counts[selectedSpaceIndex] || 0;
        const maxVisits = landingStats.maxVisits;
        const visitIntensity = maxVisits > 0 ? (visits / maxVisits) * 100 : 0;

        return (
            <Box p={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        {space.color && <Box sx={{ width: 20, height: 20, bgcolor: space.color, borderRadius: 1 }} />}
                        <Typography variant="h6" fontWeight="bold">{space.name}</Typography>
                        <Typography variant="body2" color="text.secondary">({space.type})</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setSelectedSpaceIndex(null)}><CloseIcon /></IconButton>
                </Box>

                <Grid container spacing={3}>
                    {/* Basic Info */}
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Card variant="outlined" sx={{ height: '100%', bgcolor: 'rgba(255,255,255,0.02)' }}>
                            <CardContent sx={{ p: 2, '&:last-child': { p: 2 } }}>
                                <Typography variant="caption" color="text.secondary">Price / Value</Typography>
                                <Typography variant="h5" fontWeight="bold" color="success.light">{space.price ? `$${space.price}` : 'N/A'}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Intelligence */}
                    <Grid size={{ xs: 12, md: 9 }}>
                        <Card variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                            <CardContent sx={{ p: 2, '&:last-child': { p: 2 } }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography variant="caption" color="text.secondary">Distance</Typography>
                                        <Typography variant="h6">{steps} steps</Typography>
                                        {!reachable && <Typography variant="caption" color="error">Unreachable (Next Turn)</Typography>}
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography variant="caption" color="text.secondary">Math Probability</Typography>
                                        <Typography variant="h6" color="info.main">{mathProb.toFixed(1)}%</Typography>
                                        {reachable && (
                                            <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(255,255,255,0.1)', mt: 0.5, borderRadius: 1 }}>
                                                <Box sx={{ width: `${Math.min(mathProb * 2, 100)}%`, height: '100%', bgcolor: 'info.main', borderRadius: 1 }} />
                                            </Box>
                                        )}
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography variant="caption" color="text.secondary">Global Visits</Typography>
                                        <Typography variant="h6" color="secondary.main">{visits} times</Typography>
                                        <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(255,255,255,0.1)', mt: 0.5, borderRadius: 1 }}>
                                            <Box sx={{ width: `${visitIntensity}%`, height: '100%', bgcolor: 'secondary.main', borderRadius: 1 }} />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        );
    };

    return (
        <Box display="flex" flexDirection="column" gap={3} alignItems="center">
            {/* Top: Controls & Board */}
            <Box width="100%" maxWidth={800}>
                {/* Layer Controls */}
                <Box mb={2} display="flex" justifyContent="center">
                    <ToggleButtonGroup
                        value={viewLayer}
                        exclusive
                        onChange={(e, v) => v && setViewLayer(v)}
                        size="small"
                        aria-label="map layers"
                        sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}
                    >
                        <ToggleButton value="standard">
                            <MapIcon fontSize="small" sx={{ mr: 1 }} /> Standard
                        </ToggleButton>
                        <ToggleButton value="heatmap">
                            <WhatshotIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} /> Next Roll Prob
                        </ToggleButton>
                        <ToggleButton value="landings">
                            <AssessmentIcon fontSize="small" sx={{ mr: 1, color: 'secondary.main' }} /> Landing Heatmap
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
                        maxWidth: 'calc(100vh - 240px)', // Ensure height fits in viewport
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
                                        //@ts-ignore
                                        borderColor: isSelected ? '#FFD700' : 'rgba(0,0,0,0.12)',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 0.2,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': { zIndex: 10, boxShadow: 6, transform: 'scale(1.1)' }
                                    }}
                                >
                                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: overlayColor, zIndex: 5, pointerEvents: 'none' }} />

                                    {space.color && <Box sx={{ width: '100%', height: space.type === 'corner' ? 0 : '18%', bgcolor: space.color, borderBottom: '1px solid black' }} />}

                                    <Box zIndex={6} display="flex" flexDirection="column" alignItems="center" justifyContent="center" width="100%" height="100%" sx={{ pointerEvents: 'none' }}>
                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 'bold', color: 'black', textAlign: 'center', lineHeight: 1, width: '100%', wordBreak: 'break-all' }}>
                                            {space.name}
                                        </Typography>
                                        {space.price && <Typography sx={{ fontSize: '0.65rem', color: 'black', mt: 0.5 }}>${space.price}</Typography>}
                                        {space.type === 'chance' && <Typography variant="caption" color="warning.main" fontWeight="bold">?</Typography>}
                                        {space.type === 'chest' && <Typography variant="caption" color="info.main" fontWeight="bold">📦</Typography>}
                                    </Box>

                                    {occupants.length > 0 && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', position: 'absolute', bottom: 1, width: '100%', zIndex: 7 }}>
                                            {occupants.map((p, i) => (
                                                <Avatar
                                                    key={p.id}
                                                    src={p.avatar_url}
                                                    sx={{
                                                        width: 28,
                                                        height: 28,
                                                        border: '2px solid white',
                                                        fontSize: '0.8rem',
                                                        ml: i > 0 ? -1.5 : 0,
                                                        bgcolor: p.user_id === user?.id ? 'primary.main' : 'secondary.main',
                                                        boxShadow: 3
                                                    }}
                                                >
                                                    {p.first_name[0]}
                                                </Avatar>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>
            </Box>

            {/* Bottom: Intelligence Panel */}
            <Paper elevation={3} sx={{ width: '100%', maxWidth: 800, minHeight: 150, bgcolor: 'background.paper', borderRadius: 4, overflow: 'hidden' }}>
                {renderSidePanel()}
            </Paper>
        </Box>
    );
}
