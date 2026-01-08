import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Trade {
    id: string;
    game_id: string;
    initiator_id: string;
    target_id: string;
    offer_cash: number;
    offer_properties?: { 0: string[] }; // Postgres JSON wrapper
    offer_cards?: { 0: string[] };
    request_cash: number;
    request_properties?: { 0: string[] };
    request_cards?: { 0: string[] };
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
    created_at?: string;
}

export const useGetActiveTrades = (gameId: string) => {
    return useQuery({
        queryKey: ['trades', gameId],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/games/${gameId}/trades`);
            if (!res.ok) throw new Error('Failed to fetch trades');
            return res.json() as Promise<Trade[]>;
        },
        enabled: !!gameId,
    });
};

export const useTradeActions = (gameId: string) => {
    const queryClient = useQueryClient();
    const baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/games/${gameId}`;

    const createTrade = useMutation({
        mutationFn: async (tradeData: any) => {
            const res = await fetch(`${baseUrl}/trades`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tradeData),
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || 'Failed to create trade');
            }
            return res.json() as Promise<Trade>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trades', gameId] });
        }
    });

    const acceptTrade = useMutation({
        mutationFn: async ({ tradeId, userId }: { tradeId: string; userId: string }) => {
            const res = await fetch(`${baseUrl}/trades/${tradeId}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });
            if (!res.ok) throw new Error('Failed to accept trade');
            return res.json() as Promise<Trade>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trades', gameId] });
            queryClient.invalidateQueries({ queryKey: ['gameProperties', gameId] });
            queryClient.invalidateQueries({ queryKey: ['participants', gameId] });
        }
    });

    const rejectTrade = useMutation({
        mutationFn: async ({ tradeId, userId }: { tradeId: string; userId: string }) => {
            const res = await fetch(`${baseUrl}/trades/${tradeId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });
            if (!res.ok) throw new Error('Failed to reject trade');
            return res.json() as Promise<Trade>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trades', gameId] });
        }
    });

    return { createTrade, acceptTrade, rejectTrade };
};
