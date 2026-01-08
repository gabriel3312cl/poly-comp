import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface AIAdvisorResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

// Default to Local LM Studio
// Default to Internal Proxy
const DEFAULT_API_URL = '/api/ai';
const DEFAULT_MODEL = process.env.NEXT_PUBLIC_AI_MODEL_ID || 'local-model';

export const useAIAdvisor = () => {
    const [messages, setMessages] = useState<Message[]>([]);

    const askAdvisorMutation = useMutation({
        mutationFn: async ({ prompt, context }: { prompt: string; context: string }) => {
            const systemMessage: Message = {
                role: 'system',
                content: `Eres el Consejero Financiero de Élite para Poly-Comp (un juego estilo Monopoly).
                
                Tu objetivo es dar consejos estratégicos, ingeniosos y extremadamente precisos para ayudar a tu cliente (el jugador) a ganar.
                
                Rol:
                - Analiza fríamente las probabilidades matemáticas.
                - Evalúa el riesgo financiero de cada movimiento.
                - Sugiere intercambios, compras o ahorros basándote en el estado actual del tablero y los oponentes.
                - Mantén un tono profesional pero competitivo y astuto (como un banquero de inversión de Wall Street).

                REGLAS CLAVE DEL JUEGO (Contexto):
                1. Edificios: Se construye uniformemente. 4 casas -> 1 hotel. No se puede construir si hay hipotecas en el grupo.
                2. Subastas: Si no compras una propiedad al caer, se SUBASTA (base 10).
                3. Intercambios: Se puede intercambiar dinero, propiedades y cartas de cárcel. Propiedades hipotecadas se pueden pasar (nuevo dueño paga 10% o levanta hipoteca).
                4. Bancarrota:
                   - Si debes a otro jugador: Le das todo (propiedades hipotecadas incluidas).
                   - Si debes al banco: Se subasta todo.
                5. Cárcel: Sales con dobles, pagando 50, o con carta. 3 turnos sin dobles -> pagas 50 y sales. Cobras alquiler en la cárcel.
                6. Alquileres: Se duplican si tienes todo el grupo de color (sin edificar).
                
                Estado del Juego:
                ${context}
                
                Instrucciones de Respuesta:
                Responde siempre en ESPAÑOL.
                Sé conciso (máximo 2-3 frases contundentes).
                Usa el contexto (nombres de calles, montos exactos) para justificar tu consejo.
                Prioriza la victoria sobre la piedad.`
            };

            const userMessage: Message = { role: 'user', content: prompt };

            const newHistory = [...messages, userMessage];
            // Keep history limited to last 6 messages to save context window
            const conversation = [systemMessage, ...newHistory.slice(-6)];

            const response = await fetch(DEFAULT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: DEFAULT_MODEL,
                    messages: conversation,
                    temperature: 0.7,
                    max_tokens: 150
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to connect to AI Advisor');
            }

            const data: AIAdvisorResponse = await response.json();
            return data.choices[0].message.content;
        },
        onSuccess: (reply) => {
            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        },
        onError: (error) => {
            console.error('AI Advisor Error:', error);
            setMessages(prev => [...prev, { role: 'system', content: `Error: No pude conectar con el cerebro de la IA. Asegúrate de que LM Studio esté corriendo en ${DEFAULT_API_URL}` }]);
        }
    });

    const clearHistory = () => setMessages([]);

    return {
        askAdvisor: askAdvisorMutation.mutate,
        isLoading: askAdvisorMutation.isPending,
        messages,
        clearHistory,
        addUserMessage: (msg: string) => setMessages(prev => [...prev, { role: 'user', content: msg }])
    };
};
