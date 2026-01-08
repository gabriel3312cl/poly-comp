import { useState, useRef, useEffect, useMemo } from 'react';
import {
    Box, Fab, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Typography, IconButton, Paper, Avatar,
    Stack, CircularProgress, Zoom, Tooltip
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useAIAdvisor } from '@/hooks/useAIAdvisor';
import { useAuthStore } from '@/store/authStore';
import { DiceHistoryItem } from '@/hooks/useDice';
import { getSpaceName } from '@/utils/boardSpaces';
import { parseServerDate } from '@/utils/formatters';

interface Participant {
    id: string;
    user_id: string;
    first_name: string;
    position: number;
    balance: number;
}

interface Transaction {
    id: string;
    amount: number;
    description: string | null;
    from_participant_id?: string | null;
    to_participant_id?: string | null;
    created_at: string;
}

interface AIAdvisorProps {
    participants: Participant[];
    diceHistory: DiceHistoryItem[];
    bankBalance: number;
    transactions?: Transaction[];
}

export default function AIAdvisor({ participants, diceHistory, bankBalance, transactions = [] }: AIAdvisorProps) {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const user = useAuthStore(state => state.user);
    const bottomRef = useRef<HTMLDivElement>(null);

    const { askAdvisor, messages, isLoading, addUserMessage } = useAIAdvisor();

    // Calculate Landing Stats
    const landingStats = useMemo(() => {
        const stats: Record<number, number> = {};
        diceHistory.forEach(h => {
            // Calculate hypothetical landing (this is simplified, ideally we need real positions)
            // But valid history has 'position' if we had full logs.
            // For now, let's just list the rolls as "Action Log".
        });
        return stats;
    }, [diceHistory]);

    // Format Transactions
    const recentTransactions = transactions.slice(0, 5).map(t => {
        const from = participants.find(p => p.id === t.from_participant_id)?.first_name || 'Bank';
        const to = participants.find(p => p.id === t.to_participant_id)?.first_name || 'Bank';
        return `- $${t.amount} (${from} -> ${to}): ${t.description}`;
    }).join('\n');

    // Recent Rolls
    const recentRolls = diceHistory.slice(0, 8).map(d => {
        const pName = participants.find(p => p.user_id === d.roll.user_id)?.first_name || 'Unknown';
        const r1 = d.roll.results?.[0] || '?';
        const r2 = d.roll.results?.[1] || '?';
        return `- ${pName} rolled ${d.roll.total} (${r1}+${r2})`;
    }).join('\n');


    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;

        const myParticipant = participants.find(p => p.user_id === user?.id);

        // Construct Context
        const context = `
            My Name: ${user?.first_name}
            My Balance: $${myParticipant?.balance || 0}
            My Position: ${getSpaceName(myParticipant?.position || 0)}
            
            Opponents:
            ${participants.filter(p => p.user_id !== user?.id).map(p => `- ${p.first_name}: $${p.balance} (Pos: ${getSpaceName(p.position)})`).join('\n')}
            
            Bank Reserves: $${bankBalance}
            
            Recent Activity (Last 5 Transactions):
            ${recentTransactions}
            
            Recent Dice Rolls (Last 8):
            ${recentRolls}
        `;

        addUserMessage(input);
        askAdvisor({ prompt: input, context });
        setInput('');
    };

    const handleQuickAnalysis = () => {
        setInput('Analiza mi situación actual y dame un consejo estratégico clave.');
        // We could auto-send, but letting user confirming is nice. 
        // Or better, just call handleSend with that text artificially.
        // Let's just set it for now.
    };

    return (
        <>
            <Tooltip title="AI Financial Advisor" placement="left">
                <Fab
                    color="secondary"
                    aria-label="ai-advisor"
                    onClick={() => setOpen(true)}
                    sx={{
                        background: 'linear-gradient(45deg, #9C27B0 30%, #E040FB 90%)',
                        boxShadow: '0 3px 15px rgba(156, 39, 176, 0.5)'
                    }}
                >
                    <SmartToyIcon />
                </Fab>
            </Tooltip>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        minHeight: '60vh',
                        maxHeight: '80vh',
                        bgcolor: '#1a1a2e',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}><SmartToyIcon /></Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">Poly-Advisor</Typography>
                            <Typography variant="caption" color="gray">Powered by AI</Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={() => setOpen(false)} sx={{ color: 'gray' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '500px' }}>
                    {/* Chat Area */}
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#16213e' }}>
                        {messages.length === 0 && (
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                height="100%"
                                textAlign="center"
                                color="gray"
                            >
                                <AutoAwesomeIcon sx={{ fontSize: 50, mb: 2, opacity: 0.5 }} />
                                <Typography variant="h6" gutterBottom>¡Hola! Soy tu Estratega.</Typography>
                                <Typography variant="body2" sx={{ maxWidth: 300, mb: 3 }}>
                                    Analizo el tablero, las probabilidades y tus finanzas para darte ventaja.
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    size="large"
                                    sx={{ borderRadius: 6, px: 4, textTransform: 'none', fontWeight: 'bold' }}
                                    onClick={() => {
                                        const prompt = 'Analiza mi situación actual y dame un consejo estratégico clave.';
                                        // We need to bypass input state for this to work instantly if we wanted
                                        // But setting input allows user to see what they are sending
                                        setInput(prompt);
                                    }}
                                >
                                    Analizar mi Juego
                                </Button>
                            </Box>
                        )}

                        {messages.map((msg, i) => (
                            <Box
                                key={i}
                                sx={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%',
                                }}
                            >
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        borderTopRightRadius: msg.role === 'user' ? 0 : 3,
                                        borderTopLeftRadius: msg.role === 'assistant' ? 0 : 3,
                                        bgcolor: msg.role === 'user' ? 'primary.main' : 'rgba(255,255,255,0.1)',
                                        color: 'white'
                                    }}
                                >
                                    <Typography variant="body2">{msg.content}</Typography>
                                </Paper>
                            </Box>
                        ))}

                        {isLoading && (
                            <Box sx={{ alignSelf: 'flex-start', p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CircularProgress size={16} color="secondary" />
                                    <Typography variant="caption" color="gray">Pensando estrategia...</Typography>
                                </Stack>
                            </Box>
                        )}
                        <div ref={bottomRef} />
                    </Box>

                    {/* Input Area */}
                    <Box sx={{ p: 2, bgcolor: '#1a1a2e', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Pide un consejo, ej: ¿Compro esto?..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isLoading}
                                InputProps={{
                                    sx: { color: 'white', borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }
                                }}
                            />
                            <IconButton
                                color="secondary"
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                sx={{ bgcolor: 'rgba(156, 39, 176, 0.2)' }}
                            >
                                <SendIcon />
                            </IconButton>
                        </Stack>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
}
