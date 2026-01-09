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
    Stack,
    Collapse
} from '@mui/material';
import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
    const [isOpen, setIsOpen] = useState(false);

    const getName = (id: string | null) => {
        if (!id) return 'Banco';
        const p = participants.find(part => part.id === id);
        return p ? `${p.first_name}` : 'Desconocido';
    };

    return (
        <Paper elevation={0} sx={{ bgcolor: 'transparent' }}>
            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
                onClick={() => setIsOpen(!isOpen)}
                sx={{ cursor: 'pointer', userSelect: 'none' }}
            >
                <Typography variant="h6" fontWeight="bold">Historial de Transacciones</Typography>
                {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>

            <Collapse in={isOpen}>
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 2 }}>
                    {!transactions.length && (
                        <Box textAlign="center" py={4} color="text.secondary">
                            <Typography>No hay transacciones aún.</Typography>
                        </Box>
                    )}
                    <List sx={{ p: 0 }}>
                        {transactions.map((tx) => {
                            const timestamp = parseServerDate(tx.created_at);
                            const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Fecha Inválida';

                            return (
                                <ListItem
                                    key={tx.id}
                                    divider
                                    secondaryAction={
                                        <IconButton edge="end" aria-label="undo" onClick={() => onUndo(tx.id)} size="small" color="default">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography fontWeight="bold" color="text.secondary" noWrap sx={{ maxWidth: 80 }}>{getName(tx.from_participant_id)}</Typography>
                                                <ArrowForwardIcon fontSize="small" color="disabled" />
                                                <Typography fontWeight="bold" color="text.primary" noWrap sx={{ maxWidth: 80 }}>{getName(tx.to_participant_id)}</Typography>
                                                <Typography fontWeight="800" color="secondary.light" ml="auto">
                                                    ${tx.amount.toLocaleString()}
                                                </Typography>
                                            </Box>
                                        }
                                        secondaryTypographyProps={{ component: 'div' }}
                                        secondary={
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" component="div" mt={0.5}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {tx.description || 'Transferencia'}
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
                </Paper>
            </Collapse>
        </Paper>
    );
}
