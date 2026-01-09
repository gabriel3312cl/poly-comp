import { Box, Typography, Grid, Card, CardContent, CardActions, Button, Chip, Divider, Stack } from '@mui/material';
import { useGetGameProperties, usePropertyActions, ParticipantProperty, useGetAllProperties } from '@/hooks/useProperties';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';

interface PropertyInventoryProps {
    gameId: string;
    participantId: string;
    readOnly?: boolean;
}

const GROUP_COLORS: Record<string, string> = {
    brown: '#8B4513',
    light_blue: '#87CEEB',
    pink: '#FF69B4',
    orange: '#FFA500',
    red: '#FF0000',
    yellow: '#FFFF00',
    green: '#008000',
    dark_blue: '#00008B',
    railroad: '#000000',
    utility: '#A9A9A9',
};

export default function PropertyInventory({ gameId, participantId, readOnly }: PropertyInventoryProps) {
    const { data: ownership = [] } = useGetGameProperties(gameId);
    const { data: allProperties = [] } = useGetAllProperties();
    const { mortgageProperty, unmortgageProperty } = usePropertyActions(gameId);

    const myProperties = ownership.filter(p => p.participant_id === participantId);

    if (myProperties.length === 0) {
        return <Typography variant="body2" color="text.secondary">No posees propiedades.</Typography>;
    }

    // Group by color? Or just list.
    // Let's sort by board position if available, or just name.

    return (
        <Grid container spacing={2}>
            {myProperties.map(pp => {
                const staticProp = allProperties.find(p => p.id === pp.property_id);
                const color = GROUP_COLORS[pp.group_color || ''] || '#ccc';

                return (
                    <Grid size={{ xs: 12, sm: 6 }} key={pp.id}>
                        <Card variant="outlined" sx={{ position: 'relative', opacity: pp.is_mortgaged ? 0.6 : 1 }}>
                            {/* Color Bar */}
                            <Box sx={{ height: 8, bgcolor: color, width: '100%' }} />

                            <CardContent sx={{ pb: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    {pp.property_name || 'Propiedad Desconocida'}
                                </Typography>
                                <Typography variant="caption" display="block">
                                    Estado: {pp.is_mortgaged ? 'HIPOTECADA' : 'Activa'}
                                </Typography>

                                {staticProp && (
                                    <Box mt={1}>
                                        <Box display="flex" gap={1} mb={1}>
                                            <Chip
                                                icon={<HomeIcon fontSize="small" />}
                                                label={pp.house_count}
                                                size="small"
                                                color="success"
                                                variant={pp.house_count > 0 ? "filled" : "outlined"}
                                            />
                                            <Chip
                                                icon={<ApartmentIcon fontSize="small" />}
                                                label={pp.hotel_count}
                                                size="small"
                                                color="error"
                                                variant={pp.hotel_count > 0 ? "filled" : "outlined"}
                                            />
                                        </Box>

                                        <Divider sx={{ my: 1, opacity: 0.3 }} />

                                        <Stack spacing={0.5}>
                                            <Typography variant="caption" color="success.light" display="flex" justifyContent="space-between">
                                                <span>Renta Actual:</span>
                                                <span style={{ fontWeight: 'bold' }}>${calculateCurrentRent(staticProp, pp)}</span>
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="flex" justifyContent="space-between">
                                                <span>Base:</span>
                                                <span>${staticProp.rent_base}</span>
                                            </Typography>
                                            {staticProp.house_cost && (
                                                <Typography variant="caption" color="text.secondary" display="flex" justifyContent="space-between">
                                                    <span>Construir:</span>
                                                    <span>${staticProp.house_cost} c/u</span>
                                                </Typography>
                                            )}
                                            <Typography variant="caption" color="text.secondary" display="flex" justifyContent="space-between">
                                                <span>Hipot.:</span>
                                                <span>${staticProp.mortgage_value}</span>
                                            </Typography>
                                        </Stack>
                                    </Box>
                                )}
                            </CardContent>

                            {!readOnly && (
                                <CardActions>
                                    {pp.is_mortgaged ? (
                                        <Button
                                            size="small"
                                            color="primary"
                                            variant="contained"
                                            fullWidth
                                            onClick={() => unmortgageProperty.mutate({ propertyId: pp.property_id, userId: participantId })}
                                            disabled={unmortgageProperty.isPending}
                                        >
                                            Deshipotecar (${staticProp?.unmortgage_cost})
                                        </Button>
                                    ) : (
                                        <Button
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                            fullWidth
                                            onClick={() => mortgageProperty.mutate({ propertyId: pp.property_id, userId: participantId })}
                                            disabled={mortgageProperty.isPending || pp.house_count > 0}
                                        >
                                            Hipotecar (${staticProp?.mortgage_value})
                                        </Button>
                                    )}
                                </CardActions>
                            )}
                        </Card>
                    </Grid>
                );
            })}
        </Grid>
    );
}

function calculateCurrentRent(p: any, pp: ParticipantProperty): number {
    if (pp.is_mortgaged) return 0;
    if (pp.hotel_count > 0) return Number(p.rent_hotel || 0);
    if (pp.house_count === 4) return Number(p.rent_house_4 || 0);
    if (pp.house_count === 3) return Number(p.rent_house_3 || 0);
    if (pp.house_count === 2) return Number(p.rent_house_2 || 0);
    if (pp.house_count === 1) return Number(p.rent_house_1 || 0);
    return Number(p.rent_base || 0);
}
