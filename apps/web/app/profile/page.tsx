'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Stack,
    Alert,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Grid
} from '@mui/material';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfile, useUpdatePassword, useDeleteAccount } from '@/hooks/useAuth';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import AppNavbar from '@/components/AppNavbar';
import AuthGuard from '@/components/AuthGuard';

export default function ProfilePage() {
    const { user } = useAuthStore();
    const [profileData, setProfileData] = useState({ first_name: '', last_name: '' });
    const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Profile Hooks
    const { mutate: updateProfile, isPending: isProfilePending, isSuccess: isProfileSuccess, error: profileError } = useUpdateProfile();
    const { mutate: updatePassword, isPending: isPassPending, isSuccess: isPassSuccess, error: passError } = useUpdatePassword();
    const { mutate: deleteAccount, isPending: isDeletePending } = useDeleteAccount();

    useEffect(() => {
        if (user) {
            setProfileData({ first_name: user.first_name, last_name: user.last_name });
        }
    }, [user]);

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile(profileData);
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.password !== passwordData.confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        updatePassword({ password: passwordData.password });
    };

    return (
        <AuthGuard>
            <AppNavbar />
            <Box sx={{ p: 3, pt: 10, minHeight: '100vh', bgcolor: 'background.default' }}>
                <Container maxWidth="md">
                    <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white', mb: 4 }}>
                        Account Settings
                    </Typography>

                    <Grid container spacing={4}>
                        {/* Profile Information */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={{ bgcolor: 'background.paper', borderRadius: 4, height: '100%' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                                        <PersonIcon color="primary" sx={{ fontSize: 30 }} />
                                        <Typography variant="h6" fontWeight="bold">Profile Information</Typography>
                                    </Stack>

                                    {isProfileSuccess && <Alert severity="success" sx={{ mb: 2 }}>Profile updated!</Alert>}
                                    {profileError && <Alert severity="error" sx={{ mb: 2 }}>Update failed</Alert>}

                                    <form onSubmit={handleProfileSubmit}>
                                        <Stack spacing={2}>
                                            <TextField
                                                label="First Name"
                                                fullWidth
                                                value={profileData.first_name}
                                                onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                                            />
                                            <TextField
                                                label="Last Name"
                                                fullWidth
                                                value={profileData.last_name}
                                                onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                                            />
                                            <TextField
                                                label="Username"
                                                fullWidth
                                                value={user?.username || ''}
                                                disabled
                                                helperText="Username cannot be changed"
                                            />
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                disabled={isProfilePending}
                                                sx={{ mt: 2 }}
                                            >
                                                Save Changes
                                            </Button>
                                        </Stack>
                                    </form>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Change Password */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={{ bgcolor: 'background.paper', borderRadius: 4, height: '100%' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                                        <LockIcon color="secondary" sx={{ fontSize: 30 }} />
                                        <Typography variant="h6" fontWeight="bold">Change Password</Typography>
                                    </Stack>

                                    {isPassSuccess && <Alert severity="success" sx={{ mb: 2 }}>Password updated!</Alert>}
                                    {passError && <Alert severity="error" sx={{ mb: 2 }}>Update failed</Alert>}

                                    <form onSubmit={handlePasswordSubmit}>
                                        <Stack spacing={2}>
                                            <TextField
                                                label="New Password"
                                                type="password"
                                                fullWidth
                                                value={passwordData.password}
                                                onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                            />
                                            <TextField
                                                label="Confirm New Password"
                                                type="password"
                                                fullWidth
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            />
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                color="secondary"
                                                disabled={isPassPending}
                                                sx={{ mt: 2 }}
                                            >
                                                Update Password
                                            </Button>
                                        </Stack>
                                    </form>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Danger Zone */}
                        <Grid size={{ xs: 12 }}>
                            <Card sx={{ bgcolor: 'rgba(255, 0, 0, 0.05)', borderRadius: 4, border: '1px solid rgba(255, 0, 0, 0.2)' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                                        <DeleteForeverIcon color="error" sx={{ fontSize: 30 }} />
                                        <Typography variant="h6" fontWeight="bold" color="error">Danger Zone</Typography>
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        Once you delete your account, there is no going back. Please be certain.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={() => setDeleteDialogOpen(true)}
                                    >
                                        Delete Account
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Delete Confirmation Dialog */}
                    <Dialog
                        open={deleteDialogOpen}
                        onClose={() => setDeleteDialogOpen(false)}
                    >
                        <DialogTitle>Delete Account?</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Are you sure you want to permanently delete your account? This action cannot be undone.
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                            <Button onClick={() => deleteAccount()} color="error" autoFocus>
                                Delete
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Container>
            </Box>
        </AuthGuard>
    );
}
