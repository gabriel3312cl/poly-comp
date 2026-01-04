'use client';

import AuthGuard from '@/components/AuthGuard';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';

export default function GameLayout({ children }: { children: React.ReactNode }) {
    const user = useAuthStore((state) => state.user);
    const { mutate: logout } = useLogout();

    return (
        <AuthGuard>
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #333' }}>
                    <Toolbar>
                        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" fontWeight="bold" color="primary.main" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/history'}>
                                MONOPOLY COMPANION
                            </Typography>
                            <Button color="inherit" onClick={() => window.location.href = '/history'}>
                                My Games
                            </Button>
                            <Button color="inherit" onClick={() => window.location.href = '/profile'}>
                                Profile
                            </Button>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1} ml={2}>
                            <AccountCircleIcon color="action" />
                            <Typography variant="body1" color="text.primary">
                                {user?.first_name}
                            </Typography>
                        </Box>

                        <Tooltip title="Logout">
                            <IconButton onClick={() => logout()} color="error">
                                <LogoutIcon />
                            </IconButton>
                        </Tooltip>
                    </Toolbar>
                </AppBar>

                <Box component="main">
                    {children}
                </Box>
            </Box>
        </AuthGuard >
    );
}
