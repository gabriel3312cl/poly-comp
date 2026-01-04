'use client';

import { useState } from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Stack,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LoginIcon from '@mui/icons-material/Login';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCreateGame, useJoinGameByCode } from '@/hooks/useGame';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';
import { useLogout } from '@/hooks/useAuth';

export default function GameDashboard() {
    const [joinCode, setJoinCode] = useState('');
    const [openDelete, setOpenDelete] = useState(false);

    const { mutate: createGame, isPending: creating } = useCreateGame();
    const { mutate: joinGame, isPending: joining } = useJoinGameByCode();
    const { mutate: logout } = useLogout();

    const handleDeleteAccount = async () => {
        try {
            await api.delete('/users/profile');
            logout(); // Auto logout after delete
        } catch (e) {
            alert('Failed to delete account');
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
            <Typography variant="h3" fontWeight="800" gutterBottom align="center">
                Ready to Play? 🎲
            </Typography>
            <Typography variant="h6" color="text.secondary" align="center" mb={6}>
                Create a new session or join friends with a code.
            </Typography>

            <Grid container spacing={4}>
                {/* Create Game Section */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card
                        sx={{
                            height: '100%',
                            background: 'linear-gradient(135deg, #3f1dcb 0%, #1a1a1a 100%)',
                            borderRadius: 4,
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)' }
                        }}
                    >
                        <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                            <AddIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                Create Session
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.7)" mb={4}>
                                Generate a unique 4-letter code and become the host (Banker).
                            </Typography>
                            <Button
                                variant="contained"
                                color="secondary"
                                size="large"
                                fullWidth
                                onClick={() => createGame()}
                                disabled={creating}
                                startIcon={creating ? <CircularProgress size={20} /> : undefined}
                            >
                                Start New Game
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Join Game Section */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%', bgcolor: 'background.paper', borderRadius: 4 }}>
                        <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                            <Stack spacing={3}>
                                <Box display="flex" alignItems="center" gap={1} justifyContent="center" mb={1}>
                                    <LoginIcon color="secondary" />
                                    <Typography variant="h5" fontWeight="bold">
                                        Join Session
                                    </Typography>
                                </Box>

                                <TextField
                                    label="Enter 4-Letter Code"
                                    placeholder="e.g. ABCD"
                                    fullWidth
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    inputProps={{ maxLength: 4, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '5px' } }}
                                />

                                <Button
                                    variant="outlined"
                                    color="primary"
                                    size="large"
                                    fullWidth
                                    onClick={() => joinGame(joinCode)}
                                    disabled={joining || joinCode.length < 4}
                                >
                                    {joining ? 'Joining...' : 'Join Game'}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Divider sx={{ my: 8 }} />
            {/* Delete Account moved to Profile Page */}

            <Dialog
                open={openDelete}
                onClose={() => setOpenDelete(false)}
            >
                <DialogTitle>Delete Account?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This action involves cascading deletion. All your hosted games and participations will be permanently removed.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
                    <Button onClick={handleDeleteAccount} color="error" autoFocus>
                        Confirm Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
