import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export interface Transaction {
    id: string;
    game_id: string;
    from_participant_id: string | null;
    to_participant_id: string | null;
    amount: number; // Decimal in DB, number in JS
    description: string | null;
    created_at: string;
}

export interface TransferPayload {
    gameId: string;
    amount: number;
    description?: string;
    from_participant_id?: string | null;
    to_participant_id?: string | null;
}

export const useGetTransactions = (gameId: string) => {
    return useQuery({
        queryKey: ['transactions', gameId],
        queryFn: async () => {
            const { data } = await api.get(`/games/${gameId}/transactions`);
            return data as Transaction[];
        },
        enabled: !!gameId,
    });
};

export const usePerformTransfer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ gameId, ...payload }: TransferPayload) => {
            const { data } = await api.post(`/games/${gameId}/transactions`, payload);
            return data;
        },
        onSuccess: (_, variables) => {
            // Refresh transactions AND participants (balances changed)
            queryClient.invalidateQueries({ queryKey: ['transactions', variables.gameId] });
            queryClient.invalidateQueries({ queryKey: ['participants', variables.gameId] });
        },
    });
};

export const useUndoTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ gameId, txId }: { gameId: string; txId: string }) => {
            await api.delete(`/games/${gameId}/transactions/${txId}`);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['transactions', variables.gameId] });
            queryClient.invalidateQueries({ queryKey: ['participants', variables.gameId] });
        },
    });
};

export const useClaimJackpot = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ gameId }: { gameId: string }) => {
            // Amount returned
            const { data } = await api.post(`/games/${gameId}/jackpot/claim`, {});
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['transactions', variables.gameId] });
            queryClient.invalidateQueries({ queryKey: ['participants', variables.gameId] });
            // Also refresh game session to update jackpot balance
            queryClient.invalidateQueries({ queryKey: ['game', variables.gameId] });
        },
    });
};
