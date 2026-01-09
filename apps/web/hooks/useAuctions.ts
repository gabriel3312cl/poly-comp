import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Auction {
    id: string;
    game_id: string;
    property_id: string;
    current_bid: number;
    highest_bidder_id?: string;
    status: 'ACTIVE' | 'FINISHED';
    created_at?: string;
    ends_at?: string;
}

export const useAuctionActions = (gameId: string) => {
    const queryClient = useQueryClient();
    const baseUrl = `${API_URL}/games/${gameId}`;

    const startAuction = useMutation({
        mutationFn: async ({ propertyId }: { propertyId: string }) => {
            const { data } = await axios.post<Auction>(`${baseUrl}/auctions`, { property_id: propertyId });
            return data;
        }
    });

    const placeBid = useMutation({
        mutationFn: async ({ auctionId, userId, amount }: { auctionId: string; userId: string; amount: number }) => {
            const { data } = await axios.post<Auction>(`${baseUrl}/auctions/${auctionId}/bid`, { bidder_user_id: userId, amount });
            return data;
        }
    });

    const endAuction = useMutation({
        mutationFn: async ({ auctionId }: { auctionId: string }) => {
            const { data } = await axios.post<Auction>(`${baseUrl}/auctions/${auctionId}/end`);
            return data;
        },
        onSuccess: () => {
            // Invalidate ownership to see the new owner
            queryClient.invalidateQueries({ queryKey: ['gameProperties', gameId] });
            queryClient.invalidateQueries({ queryKey: ['participants', gameId] });
            queryClient.invalidateQueries({ queryKey: ['active-auction', gameId] });
        }
    });

    return { startAuction, placeBid, endAuction };
};

export const useGetActiveAuction = (gameId: string) => {
    return useQuery({
        queryKey: ['active-auction', gameId],
        queryFn: async () => {
            const { data } = await axios.get<Auction | null>(`${API_URL}/games/${gameId}/auctions`);
            return data;
        },
        enabled: !!gameId,
    });
};
