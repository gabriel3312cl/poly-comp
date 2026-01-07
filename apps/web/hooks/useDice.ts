import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export interface DiceRoll {
    id: string;
    game_id: string;
    user_id: string;
    dice_count: number;
    dice_sides: number;
    results: number[]; // Backend sends JSON array
    total: number;
    created_at: string;
}

export interface DiceHistoryItem {
    roll: DiceRoll;
    user_name: string;
}

export const useRollDice = (gameId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { sides: number; count: number; autoSalary?: boolean }) => {
            const res = await api.post(`/games/${gameId}/roll`, { ...data, auto_salary: data.autoSalary });
            return res.data as DiceRoll;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dice_rolls', gameId] });
        },
    });
};

export const useGetDiceHistory = (gameId: string) => {
    return useQuery({
        queryKey: ['dice_rolls', gameId],
        queryFn: async () => {
            const { data } = await api.get(`/games/${gameId}/rolls`);
            return data as DiceHistoryItem[];
        },
    });
};
