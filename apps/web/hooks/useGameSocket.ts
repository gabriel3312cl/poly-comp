import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useGameSocket = (gameId: string, onEvent?: (event: any) => void) => {
    const queryClient = useQueryClient();
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!gameId) return;

        // Determine protocol and host
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        // Convert http(s) to ws(s)
        const wsUrl = apiUrl.replace(/^http/, 'ws');
        const url = `${wsUrl}/ws?game_id=${gameId}`;

        console.log('Connecting to WebSocket:', url);
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('WebSocket Connected');
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('WS Event:', message);

                // Handle Events
                if (message.type === 'TransactionCreated') {
                    queryClient.invalidateQueries({ queryKey: ['transactions', gameId] });
                    // Also refresh participants balance
                    queryClient.invalidateQueries({ queryKey: ['participants', gameId] });
                    // Refresh game session (for jackpot balance)
                    queryClient.invalidateQueries({ queryKey: ['game', gameId] });
                } else if (message.type === 'DiceRolled') {
                    queryClient.invalidateQueries({ queryKey: ['dice_rolls', gameId] });
                } else if (message.type === 'RouletteSpun') {
                    queryClient.invalidateQueries({ queryKey: ['roulette-history', gameId] });
                } else if (message.type === 'SpecialDiceRolled') {
                    queryClient.invalidateQueries({ queryKey: ['special-dice-history', gameId] });
                } else if (message.type === 'ParticipantUpdated') {
                    queryClient.invalidateQueries({ queryKey: ['participants', gameId] });
                }

                if (onEvent) {
                    onEvent(message);
                }
            } catch (e) {
                console.error('Error parsing WS message:', e);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket Disconnected');
        };

        return () => {
            if (socket.readyState === 1) { // OPEN
                socket.close();
            }
        };
    }, [gameId, queryClient]);
};
