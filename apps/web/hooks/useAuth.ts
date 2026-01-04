import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'next/navigation';

export const useLogin = () => {
    const login = useAuthStore((state) => state.login);
    const router = useRouter();

    return useMutation({
        mutationFn: async (credentials: any) => {
            const { data } = await api.post('/users/login', credentials);
            return data; // returns { token: '...' }
        },
        onSuccess: async (data, variables) => {
            // After getting token, fetch profile
            // We manually fetch here or use a separate query
            // Let's manually fetch for simplicity in this flow
            const profileRes = await api.get('/users/profile', {
                headers: { Authorization: `Bearer ${data.token}` }
            });

            login(profileRes.data, data.token);
            router.push('/game'); // Redirect to game dashboard
        },
    });
};

export const useRegister = () => {
    const login = useAuthStore((state) => state.login);
    const router = useRouter();

    return useMutation({
        mutationFn: async (userData: any) => {
            const { data } = await api.post('/users/register', userData);
            return data; // returns User object
        },
        onSuccess: (data) => {
            // User said: "al crear cuenta, redirigir a login" (redirect to login)
            // Or auto-login? User said "redirigir a login".
            router.push('/login');
        },
    });
};

export const useLogout = () => {
    const logout = useAuthStore((state) => state.logout);
    const router = useRouter();

    return useMutation({
        mutationFn: async () => {
            // Optional: call backend logout
            try {
                await api.post('/users/logout');
            } catch (e) {
                // ignore
            }
        },
        onSuccess: () => {
            logout();
            router.push('/login');
        },
    });
};
