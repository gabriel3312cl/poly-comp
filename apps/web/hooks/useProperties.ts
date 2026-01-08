import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { useParams } from 'next/navigation';

export interface Property {
    id: string;
    name: string;
    group_color: string;
    price: number;
    rent_base: number;
    rent_house_1?: number;
    rent_house_2?: number;
    rent_house_3?: number;
    rent_house_4?: number;
    rent_hotel?: number;
    mortgage_value: number;
    unmortgage_cost: number;
    house_cost?: number;
    hotel_cost?: number;
    board_position?: number;
}

export interface ParticipantProperty {
    id: string;
    game_id: string;
    participant_id: string;
    property_id: string;
    is_mortgaged: boolean;
    house_count: number;
    hotel_count: number;
    property_name?: string;
    group_color?: string;
}

// Fetch all properties (static)
export const useGetAllProperties = () => {
    return useQuery({
        queryKey: ['properties'],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/properties`);
            if (!res.ok) throw new Error('Failed to fetch properties');
            return res.json() as Promise<Property[]>;
        }
    });
};

// Fetch game ownership
export const useGetGameProperties = (gameId: string) => {
    return useQuery({
        queryKey: ['gameProperties', gameId],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/games/${gameId}/properties`);
            if (!res.ok) throw new Error('Failed to fetch game properties');
            return res.json() as Promise<ParticipantProperty[]>;
        },
        enabled: !!gameId,
        refetchInterval: 2000, // Sync every 2s
    });
};

// Mutations
export const usePropertyActions = (gameId: string) => {
    const queryClient = useQueryClient();
    const baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/games/${gameId}`;

    const buyProperty = useMutation({
        mutationFn: async ({ propertyId, userId }: { propertyId: string; userId: string }) => {
            const res = await fetch(`${baseUrl}/properties/${propertyId}/buy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || 'Failed to buy property');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gameProperties', gameId] });
            queryClient.invalidateQueries({ queryKey: ['participants', gameId] }); // Balance changes
        }
    });

    const mortgageProperty = useMutation({
        mutationFn: async ({ propertyId, userId }: { propertyId: string; userId: string }) => {
            const res = await fetch(`${baseUrl}/properties/${propertyId}/mortgage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });
            if (!res.ok) throw new Error('Failed to mortgage');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gameProperties', gameId] });
            queryClient.invalidateQueries({ queryKey: ['participants', gameId] });
        }
    });

    const unmortgageProperty = useMutation({
        mutationFn: async ({ propertyId, userId }: { propertyId: string; userId: string }) => {
            const res = await fetch(`${baseUrl}/properties/${propertyId}/unmortgage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });
            if (!res.ok) throw new Error('Failed to unmortgage');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gameProperties', gameId] });
            queryClient.invalidateQueries({ queryKey: ['participants', gameId] });
        }
    });

    const buyBuilding = useMutation({
        mutationFn: async ({ propertyId, userId }: { propertyId: string; userId: string }) => {
            const res = await fetch(`${baseUrl}/properties/${propertyId}/build`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || 'Failed to buy building');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gameProperties', gameId] });
            queryClient.invalidateQueries({ queryKey: ['participants', gameId] });
        }
    });

    const sellBuilding = useMutation({
        mutationFn: async ({ propertyId, userId }: { propertyId: string; userId: string }) => {
            const res = await fetch(`${baseUrl}/properties/${propertyId}/sell-building`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || 'Failed to sell building');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gameProperties', gameId] });
            queryClient.invalidateQueries({ queryKey: ['participants', gameId] });
        }
    });

    return { buyProperty, mortgageProperty, unmortgageProperty, buyBuilding, sellBuilding };
};
