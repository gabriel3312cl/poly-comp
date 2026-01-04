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
import { useRegister } from '@/hooks/useAuth';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import BadgeIcon from '@mui/icons-material/Badge';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        first_name: '',
        last_name: ''
    });

    const { mutate: register, isPending, error } = useRegister(); // Hooks already configured to redirect to /login

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.username || !formData.password || !formData.first_name) return;
        register(formData);
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
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: 3,
                            bgcolor: 'secondary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(0, 229, 255, 0.4)'
                        }}
                    >
                        <PersonIcon sx={{ fontSize: 32, color: 'black' }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" textAlign="center" color="white">
                        Create Account
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
                            <Stack spacing={2}>
                                {error && (
                                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                                        {(error as any)?.response?.data || (error instanceof Error ? error.message : "Registration failed")}
                                    </Alert>
                                )}

                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="First Name"
                                        name="first_name"
                                        variant="outlined"
                                        fullWidth
                                        value={formData.first_name}
                                        onChange={handleChange}
                                    />
                                    <TextField
                                        label="Last Name"
                                        name="last_name"
                                        variant="outlined"
                                        fullWidth
                                        value={formData.last_name}
                                        onChange={handleChange}
                                    />
                                </Stack>

                                <TextField
                                    label="Username"
                                    name="username"
                                    variant="outlined"
                                    fullWidth
                                    value={formData.username}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <BadgeIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <TextField
                                    label="Password"
                                    name="password"
                                    type="password"
                                    variant="outlined"
                                    fullWidth
                                    value={formData.password}
                                    onChange={handleChange}
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
                                    color="secondary"
                                    size="large"
                                    fullWidth
                                    disabled={isPending}
                                    sx={{
                                        py: 1.5,
                                        fontSize: '1.1rem',
                                        color: 'black',
                                        fontWeight: 800,
                                        mt: 2,
                                        boxShadow: '0 4px 14px 0 rgba(0, 229, 255, 0.39)'
                                    }}
                                >
                                    {isPending ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
                                </Button>

                                <Box textAlign="center">
                                    <Typography variant="body2" color="text.secondary">
                                        Already have an account?{' '}
                                        <MuiLink component={Link} href="/login" underline="hover" color="secondary.light">
                                            Log in
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
