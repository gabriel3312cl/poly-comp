import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export interface SpecialDiceHistoryItem {
    id: string;
    game_id: string;
    user_id: string;
    die_name: string;
    die_id: string;
    face_label: string;
    face_value?: number;
    face_action?: string;
    created_at: string;
    first_name: string;
    last_name: string;
}

export const useGetSpecialDiceHistory = (gameId: string) => {
    return useQuery({
        queryKey: ['special-dice-history', gameId],
        queryFn: async () => {
            const response = await api.get<SpecialDiceHistoryItem[]>(`/games/${gameId}/special-dice`);
            return response.data;
        },
        refetchInterval: 5000,
    });
};

export const useRecordSpecialDiceRoll = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            gameId: string;
            userId: string;
            dieName: string;
            dieId: string;
            faceLabel: string;
            faceValue?: number;
            faceAction?: string;
        }) => {
            const response = await api.post(`/games/${data.gameId}/special-dice`, {
                user_id: data.userId,
                die_name: data.dieName,
                die_id: data.dieId,
                face_label: data.faceLabel,
                face_value: data.faceValue,
                face_action: data.faceAction
            });
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['special-dice-history', variables.gameId] });
        },
    });
};
