'use client';

import { useState } from 'react';
import {
    Box,
    Container,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Stack,
    Link as MuiLink,
    CircularProgress,
    Alert,
    InputAdornment
} from '@mui/material';
import Link from 'next/link';
import { useLogin } from '@/hooks/useAuth';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { mutate: login, isPending, error } = useLogin();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;
        login({ username, password });
    };

    return (
        <Box
            component="main"
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at 50% 20%, #2a1b5e 0%, #0a0a0a 60%)',
                p: 2
            }}
        >
            <Container maxWidth="xs">
                <Stack spacing={4} alignItems="center" mb={4}>
                    {/* Logo Placeholder */}
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: 3,
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(124, 77, 255, 0.4)'
                        }}
                    >
                        <Typography variant="h4" color="white" fontWeight="bold">M</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" textAlign="center" color="white">
                        Welcome Back
                    </Typography>
                </Stack>

                <Card
                    sx={{
                        borderRadius: 4,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        background: 'rgba(26, 26, 26, 0.8)',
                        backdropFilter: 'blur(10px)',
                    }}
                    elevation={0}
                >
                    <CardContent sx={{ p: 4 }}>
                        <form onSubmit={handleSubmit}>
                            <Stack spacing={3}>
                                {error && (
                                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                                        {(error as any)?.response?.data || (error instanceof Error ? error.message : "Invalid credentials")}
                                    </Alert>
                                )}

                                <TextField
                                    label="Username"
                                    variant="outlined"
                                    fullWidth
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <TextField
                                    label="Password"
                                    type="password"
                                    variant="outlined"
                                    fullWidth
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled={isPending}
                                    sx={{
                                        py: 1.5,
                                        fontSize: '1.1rem',
                                        boxShadow: '0 4px 14px 0 rgba(124, 77, 255, 0.39)'
                                    }}
                                >
                                    {isPending ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                                </Button>

                                <Box textAlign="center">
                                    <Typography variant="body2" color="text.secondary">
                                        Don't have an account?{' '}
                                        <MuiLink component={Link} href="/register" underline="hover" color="primary.light">
                                            Sign up
                                        </MuiLink>
                                    </Typography>
                                </Box>
                            </Stack>
                        </form>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}
