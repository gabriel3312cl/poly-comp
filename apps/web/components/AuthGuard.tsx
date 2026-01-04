'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Box, CircularProgress } from '@mui/material';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((state) => state.token);
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !token) {
            router.push('/login');
        }
    }, [mounted, token, router]);

    // Prevent hydration mismatch or flash of content
    if (!mounted) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="background.default">
                <CircularProgress color="primary" />
            </Box>
        );
    }

    // If no token, we are redirecting, so show loader or nothing
    if (!token) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="background.default">
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return <>{children}</>;
}
