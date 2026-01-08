import { useMutation, useQueryClient } from '@tanstack/react-query';

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
    const baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/games/${gameId}`;

    const startAuction = useMutation({
        mutationFn: async ({ propertyId }: { propertyId: string }) => {
            const res = await fetch(`${baseUrl}/auctions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ property_id: propertyId }),
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || 'Failed to start auction');
            }
            return res.json() as Promise<Auction>;
        }
    });

    const placeBid = useMutation({
        mutationFn: async ({ auctionId, userId, amount }: { auctionId: string; userId: string; amount: number }) => {
            const res = await fetch(`${baseUrl}/auctions/${auctionId}/bid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bidder_user_id: userId, amount }),
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || 'Failed to place bid');
            }
            return res.json() as Promise<Auction>;
        }
    });

    const endAuction = useMutation({
        mutationFn: async ({ auctionId }: { auctionId: string }) => {
            const res = await fetch(`${baseUrl}/auctions/${auctionId}/end`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || 'Failed to end auction');
            }
            return res.json() as Promise<Auction>;
        },
        onSuccess: () => {
            // Invalidate ownership to see the new owner
            queryClient.invalidateQueries({ queryKey: ['gameProperties', gameId] });
            queryClient.invalidateQueries({ queryKey: ['participants', gameId] });
        }
    });

    return { startAuction, placeBid, endAuction };
};
