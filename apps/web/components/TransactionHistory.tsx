'use client';

import {
    List,
    ListItem,
    ListItemText,
    Typography,
    IconButton,
    Paper,
    Box,
    tooltipClasses,
    Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Transaction } from '@/hooks/useTransactions';
import { GameParticipant } from '@/hooks/useGame';

import { parseServerDate } from '@/utils/formatters';

interface HistoryProps {
    transactions: Transaction[];
    participants: GameParticipant[];
    onUndo: (txId: string) => void;
}

export default function TransactionHistory({ transactions, participants, onUndo }: HistoryProps) {

    const getName = (id: string | null) => {
        if (!id) return 'Bank';
        const p = participants.find(part => part.id === id);
        return p ? `${p.first_name}` : 'Unknown';
    };

    if (!transactions.length) {
        return (
            <Box textAlign="center" py={4} color="text.secondary">
                <Typography>No transactions yet.</Typography>
            </Box>
        );
    }

    return (
        <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 2 }}>
            {transactions.map((tx) => {
                const timestamp = parseServerDate(tx.created_at);
                const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Invalid Date';

                return (
                    <ListItem
                        key={tx.id}
                        secondaryAction={
                            <IconButton edge="end" aria-label="undo" onClick={() => onUndo(tx.id)} size="small" color="default">
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        }
                        sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <ListItemText
                            primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Typography fontWeight="bold" color="text.secondary">{getName(tx.from_participant_id)}</Typography>
                                    <ArrowForwardIcon fontSize="small" color="disabled" />
                                    <Typography fontWeight="bold" color="text.primary">{getName(tx.to_participant_id)}</Typography>
                                    <Typography fontWeight="800" color="secondary.light" ml="auto">
                                        ${tx.amount.toLocaleString()}
                                    </Typography>
                                </Box>
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                            secondary={
                                <Stack direction="row" justifyContent="space-between" alignItems="center" component="div">
                                    <Typography variant="caption" color="text.secondary">
                                        {tx.description || 'Transfer'}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled">
                                        {timeStr}
                                    </Typography>
                                </Stack>
                            }
                        />
                    </ListItem>
                );
            })}
        </List>
    );
}
