import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Card {
    id: string;
    type_: string; // 'arca', 'fortuna', 'bonificacion', 'boveda'
    title: string;
    description: string;
    cost?: number;
    color?: 'yellow' | 'red' | 'green';
    action_type?: string;
    action_value?: number;
}

export interface ParticipantCard extends Card {
    participant_id: string;
    card_id: string;
    is_active: boolean;
    acquired_at: string;
}

export interface GameBovedaMarket {
    game_id: string;
    slot_index: number;
    card_id: string;
    title: string;
    description: string;
    cost: number;
    color: string;
    type_: string;
}

export const useCards = (gameId: string) => {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();

    const headers = { Authorization: `Bearer ${token}` };

    // --- Queries ---

    const { data: market, isLoading: marketLoading } = useQuery({
        queryKey: ['boveda-market', gameId],
        queryFn: async () => {
            const { data } = await axios.get<GameBovedaMarket[]>(`${API_URL}/games/${gameId}/cards/market`, { headers });
            return data;
        },
        enabled: !!gameId && !!token,
    });

    const { data: inventory, isLoading: inventoryLoading } = useQuery({
        queryKey: ['inventory', gameId],
        queryFn: async () => {
            const { data } = await axios.get<ParticipantCard[]>(`${API_URL}/games/${gameId}/cards/inventory`, { headers });
            return data;
        },
        enabled: !!gameId && !!token,
    });

    // --- Mutations ---

    const drawCardMutation = useMutation({
        mutationFn: async ({ type }: { type: 'arca' | 'fortuna' | 'bonificacion' }) => {
            const { data } = await axios.post<Card>(
                `${API_URL}/games/${gameId}/cards/draw`,
                { card_type: type },
                { headers }
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', gameId] });
            queryClient.invalidateQueries({ queryKey: ['transactions', gameId] }); // Money might change
            queryClient.invalidateQueries({ queryKey: ['participants', gameId] });
        },
    });

    const buyMarketCardMutation = useMutation({
        mutationFn: async (slotIndex: number) => {
            const { data } = await axios.post<ParticipantCard>(
                `${API_URL}/games/${gameId}/cards/market/buy`,
                { slot_index: slotIndex },
                { headers }
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', gameId] });
            queryClient.invalidateQueries({ queryKey: ['boveda-market', gameId] });
            queryClient.invalidateQueries({ queryKey: ['participants', gameId] }); // Money deducted
            queryClient.invalidateQueries({ queryKey: ['transactions', gameId] });
        },
    });

    const exchangeMarketCardMutation = useMutation({
        mutationFn: async (slotIndex: number) => {
            const { data } = await axios.post<GameBovedaMarket[]>(
                `${API_URL}/games/${gameId}/cards/market/exchange`,
                { slot_index: slotIndex },
                { headers }
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['boveda-market', gameId] });
        },
    });

    const useCardMutation = useMutation({
        mutationFn: async (inventoryId: string) => {
            await axios.post(
                `${API_URL}/games/${gameId}/cards/use`,
                { inventory_id: inventoryId },
                { headers }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', gameId] });
            // History update?
            // Since use_card logs to history, we assume history query invalidation or socket event will handle it.
        },
    });

    const discardCardMutation = useMutation({
        mutationFn: async (inventoryId: string) => {
            await axios.delete(
                `${API_URL}/games/${gameId}/cards/inventory/${inventoryId}`,
                { headers }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', gameId] });
        },
    });

    return {
        market,
        marketLoading,
        inventory,
        inventoryLoading,
        drawCardMutation,
        buyMarketCardMutation,
        exchangeMarketCardMutation,
        useCardMutation,
        discardCardMutation,
    };
};
