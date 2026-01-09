import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { updatePosition } from '../utils/api';
import { useRouter } from 'next/navigation';

export interface GameSession {
    id: string;
    code: string;
    host_user_id: string;
    name: string;
    status: 'WAITING' | 'ACTIVE' | 'FINISHED';
    created_at: string;
    jackpot_balance: number;
    current_turn_user_id?: string;
    turn_order?: string[];
}

export interface GameParticipant {
    id: string;
    user_id: string;
    game_id: string;
    balance: number;
    username: string; // Added from backend update
    first_name: string;
    last_name: string;
    position: number;
}

// Fetch user's active games (Wait, backend doesn't have "list my games" yet? 
// The backend has `GET /games/:id`. It doesn't have "List all games I'm in".
// User Request said: "crear sessiones de juegos" and "listar participantes".
// If I can't list games, I can't show a dashboard of "My Games".
// I might need to add `GET /users/games` to backend?
// Or I realized `GET /users/profile` doesn't return games.
// Let's check `00_init_consolidated.sql`. Is there a way to query?
// I might have missed "List User Games" feature.
// BUT, for now, the user flow is: Create Game -> Redirect to It. OR Join Game -> Redirect to It.
// Maybe I don't show a list of *past* games yet?
// User said "despues de login exitoso, a app de juego con las funciones discutidas: crear sessiones de juegos (crear, editar, eliminar)".
// Implicitly implies listing them.
// I will start with Create/Join. If Listing is needed, I might need to mock it or ask backend update.
// Actually, `GET /games/:id` is available.
// I will implement Create and Join first.
// If I need to list games, I might have to add that endpoint later.
// For now, I'll rely on Create/Join redirecting immediately.

export const useCreateGame = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            // Backend creates with default name, returns GameSession
            const { data } = await api.post('/games', {});
            return data;
        },
        onSuccess: (data: GameSession) => {
            // Invalidate queries?
            router.push(`/game/${data.id}`);
        },
    });
};

export const useJoinGameByCode = () => {
    const router = useRouter();

    return useMutation({
        mutationFn: async (code: string) => {
            const { data } = await api.post('/games/join', { code });
            return data; // returns Participant, which has game_id
        },
        onSuccess: (data: GameParticipant) => {
            router.push(`/game/${data.game_id}`);
        }
    });
};

export const useGetGame = (gameId: string) => {
    return useQuery({
        queryKey: ['game', gameId],
        queryFn: async () => {
            const { data } = await api.get(`/games/${gameId}`);
            return data as GameSession;
        },
        enabled: !!gameId,
    });
};

export const useGetParticipants = (gameId: string) => {
    return useQuery({
        queryKey: ['participants', gameId],
        queryFn: async () => {
            const { data } = await api.get(`/games/${gameId}/participants`);
            return data as GameParticipant[];
        },
        enabled: !!gameId,
    });
};

export const useLeaveGame = (gameId: string) => {
    const router = useRouter();
    return useMutation({
        mutationFn: async () => {
            await api.post(`/games/${gameId}/leave`);
        },
        onSuccess: () => {
            router.push('/game');
        },
    });
};

export const useGetHostedGames = () => {
    return useQuery({
        queryKey: ['games', 'hosted'],
        queryFn: async () => {
            const { data } = await api.get('/users/games/hosted');
            return data as GameSession[];
        },
    });
};

export const useGetPlayedGames = () => {
    return useQuery({
        queryKey: ['games', 'played'],
        queryFn: async () => {
            const { data } = await api.get('/users/games/played');
            return data as GameSession[];
        },
    });
};

export const useUpdateGame = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { name?: string; status?: string; initiative_rolls?: Record<string, number> } }) => {
            const res = await api.put(`/games/${id}`, data);
            return res.data;
        },
        onSuccess: (data: GameSession) => {
            queryClient.invalidateQueries({ queryKey: ['game', data.id] });
        }
    });
};

export const useDeleteGame = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (gameId: string) => {
            await api.delete(`/games/${gameId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['games'] });
            router.push('/history?deleted=true');
        },
    });
};
export const useUpdatePosition = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ gameId, userId, position }: { gameId: string; userId: string; position: number }) => {
            const res = await updatePosition(gameId, userId, position);
            return res;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['participants', variables.gameId] });
        }
    });
};

export const useEndTurn = (gameId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const res = await api.post(`/games/${gameId}/end-turn`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['game', gameId] });
            queryClient.invalidateQueries({ queryKey: ['participants', gameId] });
        }
    });
};
