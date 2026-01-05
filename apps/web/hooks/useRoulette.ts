import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export interface RouletteSpinHistoryItem {
    id: string;
    game_id: string;
    user_id: string;
    result_label: string;
    result_value: number;
    result_type: 'red' | 'green';
    created_at: string;
    first_name: string;
    last_name: string;
}

export const useGetRouletteHistory = (gameId: string) => {
    return useQuery({
        queryKey: ['roulette-history', gameId],
        queryFn: async () => {
            const response = await api.get<RouletteSpinHistoryItem[]>(`/games/${gameId}/roulette`);
            return response.data;
        },
    });
};

export const useRecordSpin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            gameId: string;
            userId: string;
            resultLabel: string;
            resultValue: number;
            resultType: string;
        }) => {
            const response = await api.post(`/games/${data.gameId}/roulette`, {
                user_id: data.userId,
                result_label: data.resultLabel,
                result_value: data.resultValue,
                result_type: data.resultType
            });
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['roulette-history', variables.gameId] });
        },
    });
};
