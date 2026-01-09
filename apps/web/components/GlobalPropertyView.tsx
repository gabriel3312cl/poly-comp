import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Stack, Chip, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { GameParticipant } from '@/hooks/useGame';
import PropertyInventory from './PropertyInventory';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface GlobalPropertyViewProps {
    gameId: string;
    participants: GameParticipant[];
}

export default function GlobalPropertyView({ gameId, participants }: GlobalPropertyViewProps) {
    return (
        <Box>
            <Typography variant="h5" fontWeight="900" color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
                <AccountBalanceWalletIcon /> Propiedades Globales
            </Typography>

            <Stack spacing={2}>
                {participants.map((p) => (
                    <Accordion key={p.id} defaultExpanded sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <PersonIcon color="secondary" />
                                    <Typography fontWeight="bold">
                                        {p.first_name} {p.last_name}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={`$${p.balance}`}
                                    size="small"
                                    color={p.balance >= 0 ? "success" : "error"}
                                    variant="outlined"
                                    sx={{ fontWeight: 'bold' }}
                                />
                                <Box sx={{ flexGrow: 1 }} />
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            <Divider sx={{ mb: 2, opacity: 0.1 }} />
                            <PropertyInventory
                                gameId={gameId}
                                participantId={p.id}
                                readOnly={true}
                            />
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Stack>
        </Box>
    );
}
