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
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main' }}>
                            MONOPOLY COMPANION
                        </Typography>

                        <Box display="flex" alignItems="center" gap={2}>
                            <Box display="flex" alignItems="center" gap={1}>
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
                        </Box>
                    </Toolbar>
                </AppBar>

                <Box component="main">
                    {children}
                </Box>
            </Box>
        </AuthGuard>
    );
}
