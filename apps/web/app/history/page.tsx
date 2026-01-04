'use client';

import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Chip,
    Button,
    Stack,
    Divider,
    CircularProgress,
    Grid
} from '@mui/material';
import { useGetHostedGames, useGetPlayedGames, GameSession } from '@/hooks/useGame';
import { useRouter } from 'next/navigation';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SmartToyIcon from '@mui/icons-material/SmartToy'; // Host icon
import GroupsIcon from '@mui/icons-material/Groups'; // Participant icon
import { parseServerDate } from '@/utils/formatters';

import AppNavbar from '@/components/AppNavbar';
import AuthGuard from '@/components/AuthGuard';

export default function HistoryPage() {
    const router = useRouter();
    const { data: hostedGames, isLoading: loadingHosted } = useGetHostedGames();
    const { data: playedGames, isLoading: loadingPlayed } = useGetPlayedGames();

    const handleEnterGame = (gameId: string) => {
        router.push(`/game/${gameId}`);
    };

    const GameCard = ({ game, isHost }: { game: GameSession, isHost: boolean }) => {
        const dateTs = parseServerDate(game.created_at);
        const dateStr = dateTs ? new Date(dateTs).toLocaleDateString() : 'Unknown Date';

        return (
            <Card sx={{
                bgcolor: 'background.paper',
                borderRadius: 3,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
            }}>
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                {isHost ? <SmartToyIcon color="secondary" fontSize="small" /> : <GroupsIcon color="primary" fontSize="small" />}
                                <Typography variant="h6" fontWeight="bold">
                                    {game.name || "Untitled Game"}
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                Code: <Box component="span" sx={{ color: 'white', fontWeight: 'bold' }}>{game.code}</Box>
                            </Typography>
                        </Box>
                        <Chip
                            label={game.status}
                            color={game.status === 'ACTIVE' ? 'success' : (game.status === 'FINISHED' ? 'default' : 'warning')}
                            size="small"
                            variant="outlined"
                        />
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                            {dateStr}
                        </Typography>
                        <Button
                            variant="contained"
                            size="small"
                            endIcon={<PlayArrowIcon />}
                            onClick={() => handleEnterGame(game.id)}
                            sx={{ borderRadius: 2 }}
                        >
                            {game.status === 'FINISHED' ? 'View' : 'Resume'}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        );
    };

    return (
        <AuthGuard>
            <AppNavbar />
            <Box sx={{ p: 3, pt: 10, minHeight: '100vh', bgcolor: 'background.default' }}>
                <Container maxWidth="lg">
                    <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white', mb: 4 }}>
                        My Games
                    </Typography>

                    <Grid container spacing={4}>
                        {/* Hosted Games Section */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SmartToyIcon /> Hosted Games
                            </Typography>
                            {loadingHosted ? <CircularProgress /> : (
                                <Grid container spacing={2}>
                                    {hostedGames?.length === 0 && <Typography color="text.secondary">No games hosted yet.</Typography>}
                                    {hostedGames?.map(game => (
                                        <Grid size={{ xs: 12, md: 4 }} key={game.id}>
                                            <GameCard game={game} isHost={true} />
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Grid>

                        {/* Played Games Section */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1, mt: 4 }}>
                                <GroupsIcon /> Joined Games
                            </Typography>
                            {loadingPlayed ? <CircularProgress /> : (
                                <Grid container spacing={2}>
                                    {playedGames?.length === 0 && <Typography color="text.secondary">No games joined yet.</Typography>}
                                    {playedGames?.map(game => (
                                        <Grid size={{ xs: 12, md: 4 }} key={game.id}>
                                            <GameCard game={game} isHost={false} />
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </AuthGuard>
    );
}
