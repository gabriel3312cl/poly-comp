import { Box, Typography, Grid, Card, CardContent, CardActions, Button, Chip } from '@mui/material';
import { useGetGameProperties, usePropertyActions, ParticipantProperty, useGetAllProperties } from '@/hooks/useProperties';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';

interface PropertyInventoryProps {
    gameId: string;
    userId: string;
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

export default function PropertyInventory({ gameId, userId }: PropertyInventoryProps) {
    const { data: ownership = [] } = useGetGameProperties(gameId);
    const { data: allProperties = [] } = useGetAllProperties();
    const { mortgageProperty, unmortgageProperty } = usePropertyActions(gameId);

    const myProperties = ownership.filter(p => p.participant_id === userId);

    if (myProperties.length === 0) {
        return <Typography variant="body2" color="text.secondary">No properties owned.</Typography>;
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
                                    {pp.property_name || 'Unknown Property'}
                                </Typography>
                                <Typography variant="caption" display="block">
                                    Status: {pp.is_mortgaged ? 'MORTGAGED' : 'Active'}
                                </Typography>

                                {staticProp && (
                                    <Box mt={1} display="flex" gap={1}>
                                        <Chip
                                            icon={<HomeIcon fontSize="small" />}
                                            label={pp.house_count}
                                            size="small"
                                            color="success"
                                            variant="outlined"
                                        />
                                        <Chip
                                            icon={<ApartmentIcon fontSize="small" />}
                                            label={pp.hotel_count}
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                        />
                                    </Box>
                                )}
                            </CardContent>

                            <CardActions>
                                {pp.is_mortgaged ? (
                                    <Button
                                        size="small"
                                        color="primary"
                                        variant="contained"
                                        onClick={() => unmortgageProperty.mutate({ propertyId: pp.property_id, userId })}
                                        disabled={unmortgageProperty.isPending}
                                    >
                                        Unmortgage (${staticProp?.unmortgage_cost})
                                    </Button>
                                ) : (
                                    <Button
                                        size="small"
                                        color="warning"
                                        onClick={() => mortgageProperty.mutate({ propertyId: pp.property_id, userId })}
                                        disabled={mortgageProperty.isPending || pp.house_count > 0}
                                    >
                                        Mortgage (${staticProp?.mortgage_value})
                                    </Button>
                                )}
                            </CardActions>
                        </Card>
                    </Grid>
                );
            })}
        </Grid>
    );
}
