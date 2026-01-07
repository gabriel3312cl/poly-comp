import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
    // We can't use hooks here directly, but we can access the store
    // getState() is the vanilla way to access zustand state outside components
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Handle 401 (Logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

// --- Card Endpoints ---
export const drawCard = async (gameId: string, cardType: string) => {
    const response = await api.post(`/games/${gameId}/cards/draw`, { card_type: cardType });
    return response.data;
};

export const getMarket = async (gameId: string) => {
    const response = await api.get(`/games/${gameId}/cards/market`);
    return response.data;
};

export const buyMarketCard = async (gameId: string, slotIndex: number) => {
    const response = await api.post(`/games/${gameId}/cards/market/buy`, { slot_index: slotIndex });
    return response.data;
};

export const exchangeMarketCard = async (gameId: string, slotIndex: number) => {
    const response = await api.post(`/games/${gameId}/cards/market/exchange`, { slot_index: slotIndex });
    return response.data;
};

export const getInventory = async (gameId: string) => {
    const response = await api.get(`/games/${gameId}/cards/inventory`);
    return response.data;
};

export const useCard = async (gameId: string, inventoryId: string) => {
    const response = await api.post(`/games/${gameId}/cards/use`, { inventory_id: inventoryId });
    return response.data;
};

export const discardCard = async (gameId: string, inventoryId: string) => {
    const response = await api.delete(`/games/${gameId}/cards/inventory/${inventoryId}`);
    return response.data;
};

export const getAllInventories = async (gameId: string) => {
    const response = await api.get(`/games/${gameId}/cards/all-inventories`);
    return response.data;
};

export const executeSpecialAction = async (gameId: string, action: string, targetInventoryId: string, myCardId?: string) => {
    const response = await api.post(`/games/${gameId}/cards/special-action`, {
        action,
        target_inventory_id: targetInventoryId,
        my_card_id: myCardId
    });
    return response.data;
};

export const updatePosition = async (gameId: string, userId: string, position: number) => {
    const response = await api.put(`/games/${gameId}/participants`, { user_id: userId, position });
    return response.data;
};

export default api;
