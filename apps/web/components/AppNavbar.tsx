'use client';

import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function AppNavbar() {
    const user = useAuthStore((state) => state.user);
    const { mutate: logout } = useLogout();
    const router = useRouter();

    return (
        <AppBar position="fixed" color="default" elevation={1} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Toolbar>
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        color="primary.main"
                        style={{ cursor: 'pointer' }}
                        onClick={() => router.push('/game')} // Main Menu
                    >
                        MONOPOLY COMPANION
                    </Typography>
                    <Button color="inherit" onClick={() => router.push('/game')}>
                        Main Menu
                    </Button>
                    <Button color="inherit" onClick={() => router.push('/history')}>
                        My Games
                    </Button>
                    <Button color="inherit" onClick={() => router.push('/profile')}>
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
                    <IconButton onClick={() => logout()} color="error" sx={{ ml: 1 }}>
                        <LogoutIcon />
                    </IconButton>
                </Tooltip>
            </Toolbar>
        </AppBar>
    );
}
