'use client';

import AuthGuard from '@/components/AuthGuard';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { useState } from 'react';

export default function GameLayout({ children }: { children: React.ReactNode }) {
    const user = useAuthStore((state) => state.user);
    const { mutate: logout } = useLogout();
    const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);

    return (
        <AuthGuard>
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #333' }}>
                    <Toolbar>
                        {/* Logo / Title */}
                        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography
                                variant="h6"
                                fontWeight="bold"
                                color="primary.main"
                                style={{ cursor: 'pointer' }}
                                onClick={() => window.location.href = '/history'}
                                sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
                            >
                                MONOPOLY COMPANION
                            </Typography>

                            {/* Desktop Menu */}
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
                                <Button color="inherit" onClick={() => window.location.href = '/history'}>
                                    My Games
                                </Button>
                                <Button color="inherit" onClick={() => window.location.href = '/profile'}>
                                    Profile
                                </Button>
                            </Box>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1} ml={2}>
                            <AccountCircleIcon color="action" />
                            <Typography variant="body1" color="text.primary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                {user?.first_name}
                            </Typography>
                        </Box>

                        {/* Mobile Menu Icon */}
                        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                            <IconButton
                                size="large"
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={(e) => setAnchorElNav(e.currentTarget)}
                                color="inherit"
                            >
                                <MenuIcon />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorElNav}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'left',
                                }}
                                open={Boolean(anchorElNav)}
                                onClose={() => setAnchorElNav(null)}
                                sx={{
                                    display: { xs: 'block', md: 'none' },
                                }}
                            >
                                <MenuItem onClick={() => { setAnchorElNav(null); window.location.href = '/history'; }}>
                                    <Typography textAlign="center">My Games</Typography>
                                </MenuItem>
                                <MenuItem onClick={() => { setAnchorElNav(null); window.location.href = '/profile'; }}>
                                    <Typography textAlign="center">Profile</Typography>
                                </MenuItem>
                                <MenuItem onClick={() => { setAnchorElNav(null); logout(); }}>
                                    <Typography textAlign="center" color="error">Logout</Typography>
                                </MenuItem>
                            </Menu>
                        </Box>

                        {/* Desktop Logout */}
                        <Tooltip title="Logout">
                            <IconButton onClick={() => logout()} color="error" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
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
