import { Box, Paper, Typography, Button, Stack, Chip, Divider, List, ListItem, ListItemText } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { Transaction } from '@/hooks/useTransactions';
import { keyframes } from '@emotion/react';

interface BankTrackerProps {
    transactions: Transaction[];
    onAction: (type: 'BANK_RECEIVE' | 'BANK_PAY') => void;
    onQuickSalary: () => void;
    isInDebt?: boolean;
}

const INITIAL_BANK_BALANCE = 20580;

// Pulse animation for updates
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

export default function BankTracker({ transactions, onAction, onQuickSalary, isInDebt }: BankTrackerProps) {
    // Calculate Balance
    const calculateBalance = () => {
        let balance = INITIAL_BANK_BALANCE;

        transactions.forEach(tx => {
            // From Bank (Null) -> To Player (Not Null) => Decrease
            if (!tx.from_participant_id && tx.to_participant_id) {
                balance -= Number(tx.amount);
            }
            // From Player (Not Null) -> To Bank (Null) => Increase
            else if (tx.from_participant_id && !tx.to_participant_id) {
                balance += Number(tx.amount);
            }
        });

        return balance;
    };

    const currentBalance = calculateBalance();

    // Get recent bank logs for "Tracking"
    const bankLogs = transactions
        .filter(tx => !tx.from_participant_id || !tx.to_participant_id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3); // Last 3

    return (
        <Paper
            elevation={4}
            sx={{
                p: 3,
                bgcolor: 'background.paper',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {/* Header & Balance */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="overline" color="text.secondary" fontWeight="bold" letterSpacing={1.2}>
                        CENTRAL BANK RESERVES
                    </Typography>
                    <Typography
                        variant="h3"
                        fontWeight="900"
                        color={currentBalance > 5000 ? "success.main" : "warning.main"}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            textShadow: '0px 0px 20px rgba(76, 175, 80, 0.4)'
                        }}
                    >
                        <AccountBalanceIcon fontSize="large" sx={{ opacity: 0.5 }} />
                        ${currentBalance.toLocaleString()} M
                    </Typography>
                </Box>

                {/* Visual Indicator of Starting Capital */}
                <Box textAlign="right">
                    <Chip
                        label="Initial: $20,580 M"
                        size="small"
                        variant="outlined"
                        sx={{ color: 'text.disabled', borderColor: 'rgba(255,255,255,0.1)' }}
                    />
                </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Actions Section */}
            <Typography variant="subtitle2" gutterBottom color="text.secondary">Teller Actions</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={4}>
                <Button
                    variant="contained"
                    color="success"
                    startIcon={<ArrowDownwardIcon />}
                    onClick={() => onAction('BANK_RECEIVE')}
                    fullWidth
                    sx={{ py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
                >
                    Payout (Salary/Go)
                </Button>

                <Button
                    variant="contained"
                    color="info"
                    startIcon={<AttachMoneyIcon />}
                    onClick={onQuickSalary}
                    fullWidth
                    sx={{ py: 1.5, fontSize: '1rem', fontWeight: 'bold', bgcolor: 'info.dark' }}
                >
                    Avg Salary ($200)
                </Button>

                <Button
                    variant="contained"
                    color="error"
                    startIcon={<ArrowUpwardIcon />}
                    onClick={() => onAction('BANK_PAY')}
                    fullWidth
                    disabled={isInDebt}
                    sx={{ py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
                >
                    Deposit (Tax/Fines)
                </Button>
            </Stack>

            {/* Mini Log / Tracker */}
            {bankLogs.length > 0 && (
                <Box bgcolor="rgba(0,0,0,0.2)" borderRadius={2} p={2}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={1}>
                        RECENT ACTIVITY
                    </Typography>
                    <Stack spacing={1}>
                        {bankLogs.map(tx => {
                            const isDeposit = !!tx.from_participant_id && !tx.to_participant_id;
                            return (
                                <Box key={tx.id} display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="text.secondary">
                                        {tx.description || (isDeposit ? 'Deposit' : 'Withdrawal')}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        fontWeight="bold"
                                        color={isDeposit ? 'success.light' : 'error.light'}
                                    >
                                        {isDeposit ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            )}
        </Paper>
    );
}
