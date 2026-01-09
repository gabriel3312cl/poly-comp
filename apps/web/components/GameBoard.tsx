import { Box, Paper, Typography, Avatar, Zoom, ToggleButton, ToggleButtonGroup, Card, CardContent, Grid, Divider, IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { motion, AnimatePresence } from 'framer-motion';
import { BOARD_SPACES } from '@/utils/boardSpaces';
import { useAuthStore } from '@/store/authStore';
import { DiceHistoryItem } from '@/hooks/useDice';
import { useState } from 'react';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MapIcon from '@mui/icons-material/Map';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import CloseIcon from '@mui/icons-material/Close';
import { useGetGameProperties, useGetAllProperties } from '@/hooks/useProperties';
import { useParams } from 'next/navigation';

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
    const { id: gameId } = useParams() as { id: string }; // Get gameId from URL
    const { data: ownership = [] } = useGetGameProperties(gameId);
    const { data: allProperties = [] } = useGetAllProperties();

    const myParticipant = participants.find(p => p.user_id === user?.id);

    // UI State
    const [viewLayer, setViewLayer] = useState<'standard' | 'heatmap' | 'landings'>('standard');
    const [selectedSpaceIndex, setSelectedSpaceIndex] = useState<number | null>(null);

    // Helper to find owner
    const getOwnerColor = (spaceIndex: number) => {
        // Find property definition for this space
        const propDef = allProperties.find(p => p.board_position === spaceIndex);
        if (!propDef) return null;

        // Find ownership
        const owned = ownership.find(o => o.property_id === propDef.id);
        if (!owned) return null;

        // Find owner participant color
        const ownerParticipant = participants.find(p => p.id === owned.participant_id);
        // Default colors if not set
        // Usually participants have assigned colors? 
        // If not, we can hash the ID or use a fallback. 
        // For now, let's assume specific user logic or fallback.
        // Actually, let's use a nice distinct color for the owner marker.
        return ownerParticipant?.user_id === user?.id ? '#4caf50' : '#f44336'; // Green for me, Red for others
    };

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

        sortedHistory.forEach(h => {
            const uid = h.roll.user_id;
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
                            const ownerColor = getOwnerColor(space.index);

                            // Find specific ownership data for buildings
                            const propDef = allProperties.find(p => p.board_position === space.index);
                            const ownedData = propDef ? ownership.find(o => o.property_id === propDef.id) : null;

                            return (
                                <motion.div
                                    key={space.index}
                                    whileHover={{
                                        scale: 1.05,
                                        zIndex: 50,
                                        boxShadow: "0px 10px 20px rgba(0,0,0,0.3)"
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    onClick={() => setSelectedSpaceIndex(space.index)}
                                    style={{
                                        ...pos,
                                        backgroundColor: 'white',
                                        // Highlight owner with thick border
                                        border: isSelected ? '3px solid #FFD700' : (ownerColor ? `3px solid ${ownerColor}` : '1px solid black'),
                                        borderColor: isSelected ? '#FFD700' : (ownerColor || 'rgba(0,0,0,0.12)'),
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1.6px', // 0.2rem approx
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: overlayColor, zIndex: 5, pointerEvents: 'none' }} />

                                    {space.color && <Box sx={{ width: '100%', height: space.type === 'corner' ? 0 : '18%', bgcolor: space.color, borderBottom: '1px solid black' }} />}

                                    {/* Buildings View */}
                                    {ownedData && (ownedData.house_count > 0 || ownedData.hotel_count > 0) && (
                                        <Box sx={{
                                            position: 'absolute',
                                            top: space.type === 'corner' ? '10%' : '19%',
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: 0.2,
                                            zIndex: 8,
                                            px: 0.5
                                        }}>
                                            <AnimatePresence mode="popLayout">
                                                {ownedData.hotel_count > 0 ? (
                                                    <motion.div
                                                        key="hotel"
                                                        initial={{ scale: 0, rotate: -45 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                                    >
                                                        <ApartmentIcon sx={{ color: '#d32f2f', fontSize: '1.2rem', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
                                                    </motion.div>
                                                ) : (
                                                    [...Array(ownedData.house_count)].map((_, i) => (
                                                        <motion.div
                                                            key={`house-${i}`}
                                                            initial={{ scale: 0, y: -10 }}
                                                            animate={{ scale: 1, y: 0 }}
                                                            exit={{ scale: 0, opacity: 0 }}
                                                            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: i * 0.05 }}
                                                        >
                                                            <HomeIcon sx={{ color: '#2e7d32', fontSize: '0.8rem', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }} />
                                                        </motion.div>
                                                    ))
                                                )}
                                            </AnimatePresence>
                                        </Box>
                                    )}

                                    {/* Owner Badge (if owned by me/others) */}
                                    {ownerColor && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: -6,
                                                right: -6,
                                                width: 12,
                                                height: 12,
                                                bgcolor: ownerColor,
                                                borderRadius: '50%',
                                                zIndex: 8,
                                                border: '1px solid white'
                                            }}
                                        />
                                    )}

                                    <Box zIndex={6} display="flex" flexDirection="column" alignItems="center" justifyContent="center" width="100%" height="100%" sx={{ pointerEvents: 'none' }}>
                                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 'bold', color: 'black', textAlign: 'center', lineHeight: 1, width: '100%', wordBreak: 'break-all' }}>
                                            {space.name}
                                        </Typography>
                                        {space.price && <Typography sx={{ fontSize: '0.65rem', color: 'black', mt: 0.5 }}>${space.price}</Typography>}
                                        {space.type === 'chance' && <Typography variant="caption" color="warning.main" fontWeight="bold">?</Typography>}
                                        {space.type === 'chest' && <Typography variant="caption" color="info.main" fontWeight="bold">📦</Typography>}
                                    </Box>
                                </motion.div>
                            );
                        })}

                        {/* Player Tokens Layer (Fluid Movement) */}
                        {Object.entries(
                            participants.reduce((acc, p) => {
                                if (!acc[p.position]) acc[p.position] = [];
                                acc[p.position].push(p);
                                return acc;
                            }, {} as Record<number, typeof participants>)
                        ).map(([posStr, occupants]) => {
                            const pIndex = parseInt(posStr);
                            const pos = getGridPosition(pIndex);
                            return (
                                <motion.div
                                    key={`tokens-${posStr}`}
                                    layout
                                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                                    style={{
                                        ...pos,
                                        zIndex: 100,
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center',
                                        alignContent: 'center',
                                        pointerEvents: 'none',
                                        gap: -12 // Cluster tokens
                                    }}
                                >
                                    <AnimatePresence>
                                        {occupants.map((p, i) => (
                                            <motion.div
                                                key={p.id}
                                                layout
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            >
                                                <Avatar
                                                    src={p.avatar_url}
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        border: '2px solid white',
                                                        fontSize: '0.8rem',
                                                        bgcolor: p.user_id === user?.id ? 'primary.main' : 'secondary.main',
                                                        boxShadow: 8,
                                                        position: 'relative',
                                                        zIndex: 100 + i
                                                    }}
                                                >
                                                    {p.first_name[0]}
                                                </Avatar>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
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
