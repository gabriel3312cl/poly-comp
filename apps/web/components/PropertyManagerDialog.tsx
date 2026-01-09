import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Stack, Grid, IconButton,
    Divider, Chip, Tooltip
} from '@mui/material';
import { Property, ParticipantProperty, usePropertyActions } from '@/hooks/useProperties';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment'; // Hotel
import CloseIcon from '@mui/icons-material/Close';

interface PropertyManagerDialogProps {
    open: boolean;
    onClose: () => void;
    gameId: string;
    userId: string;
    myProperties: ParticipantProperty[];
    allProperties: Property[]; // To check groups and verify monopoly
}

export default function PropertyManagerDialog({ open, onClose, gameId, userId, myProperties, allProperties }: PropertyManagerDialogProps) {
    const { buyBuilding, sellBuilding } = usePropertyActions(gameId);

    // Filter properties that are part of a COMPLETE MONOPOLY
    const monopolyGroups = allProperties.reduce((acc, p) => {
        if (!p.group_color) return acc;
        if (!acc[p.group_color]) acc[p.group_color] = [];
        acc[p.group_color].push(p);
        return acc;
    }, {} as Record<string, Property[]>);

    const myMonopolies = Object.keys(monopolyGroups).filter(color => {
        const groupProps = monopolyGroups[color];
        if (color === 'UTILITY' || color === 'STATION') return false; // Usually can't build here
        // Check if I own ALL
        return groupProps.every(gp => myProperties.some(mp => mp.property_id === gp.id));
    });

    // Flatten to list of buildable properties
    const buildableProperties = myProperties.filter(mp => {
        const propDef = allProperties.find(ap => ap.id === mp.property_id);
        return propDef && propDef.group_color && myMonopolies.includes(propDef.group_color);
    });

    // Sort by color for nice grouping
    buildableProperties.sort((a, b) => {
        const pa = allProperties.find(p => p.id === a.property_id);
        const pb = allProperties.find(p => p.id === b.property_id);
        if (!pa || !pb) return 0;
        return (pa.board_position || 0) - (pb.board_position || 0);
    });

    const handleBuy = (propId: string) => {
        buyBuilding.mutate({ propertyId: propId, userId });
    };

    const handleSell = (propId: string) => {
        sellBuilding.mutate({ propertyId: propId, userId });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div" fontWeight="bold">Gestionar Edificios</Typography>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {buildableProperties.length === 0 ? (
                    <Box textAlign="center" py={4}>
                        <Typography color="text.secondary">
                            Aún no tienes monopolios. ¡Colecciona todas las propiedades de un grupo de color para empezar a construir!
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {buildableProperties.map(mp => {
                            const propDef = allProperties.find(p => p.id === mp.property_id);
                            if (!propDef) return null;

                            const houseCost = propDef.house_cost;
                            const hotelCost = propDef.hotel_cost;
                            // Checking if upgrade is possible (frontend check only visual)
                            const canBuild = !mp.is_mortgaged && mp.hotel_count === 0 && mp.house_count < 4; // Hotel logic simplified for button state? 
                            // actually limit is: 4 houses -> then buy Hotel.
                            const isMaxed = mp.hotel_count > 0;
                            const isAt4Houses = mp.house_count === 4;

                            // Cost to display
                            const nextCost = isAt4Houses ? hotelCost : houseCost;

                            return (
                                <Box key={mp.id} p={2} borderLeft={`6px solid ${propDef.group_color}`} bgcolor="background.paper" borderRadius={1} boxShadow={1}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle1" fontWeight="bold">{propDef.name}</Typography>
                                        <Box>
                                            {mp.hotel_count > 0 ? (
                                                <Chip icon={<ApartmentIcon />} label="Hotel" color="error" size="small" />
                                            ) : (
                                                <Stack direction="row">
                                                    {[...Array(mp.house_count)].map((_, i) => <HomeIcon key={i} color="success" fontSize="small" />)}
                                                </Stack>
                                            )}
                                        </Box>
                                    </Stack>

                                    <Divider sx={{ my: 1 }} />

                                    <Stack direction="row" justifyContent="flex-end" spacing={1} alignItems="center">
                                        <Typography variant="caption" color="text.secondary" mr={1}>
                                            {isMaxed ? 'Máximo alcanzado' : `Siguiente: $${nextCost}`}
                                        </Typography>

                                        {/* Helper logic for even building */}
                                        {(() => {
                                            const groupColor = propDef.group_color;
                                            const groupOwned = myProperties.filter(mp2 => {
                                                const p2 = allProperties.find(ap => ap.id === mp2.property_id);
                                                return p2?.group_color === groupColor;
                                            });

                                            const buildingCounts = groupOwned.map(mp2 => mp2.hotel_count > 0 ? 5 : mp2.house_count);
                                            const minBuildings = Math.min(...buildingCounts);
                                            const maxBuildings = Math.max(...buildingCounts);
                                            const currentBuildings = mp.hotel_count > 0 ? 5 : mp.house_count;

                                            // Rules:
                                            // 1. Cannot build if any in group is mortgaged
                                            const anyMortgaged = groupOwned.some(mp2 => mp2.is_mortgaged);
                                            // 2. Build evenly: can only build if current <= min
                                            const canBuildEvenly = currentBuildings <= minBuildings;
                                            // 3. Sell evenly: can only sell if current >= max
                                            const canSellEvenly = currentBuildings >= maxBuildings;

                                            return (
                                                <>
                                                    <Tooltip title={anyMortgaged ? "No puedes vender edificios si hay propiedades hipotecadas en el grupo" : !canSellEvenly ? "Debes vender de forma uniforme" : "Vender Edificio (Mitad de precio)"}>
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleSell(mp.property_id)}
                                                                disabled={sellBuilding.isPending || (mp.house_count === 0 && mp.hotel_count === 0) || !canSellEvenly || anyMortgaged}
                                                            >
                                                                <RemoveIcon />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>

                                                    <Tooltip title={anyMortgaged ? "No puedes construir si hay propiedades hipotecadas en el grupo" : isMaxed ? "Máximo alcanzado" : !canBuildEvenly ? "Debes construir de forma uniforme" : isAt4Houses ? "Mejorar a Hotel" : "Comprar Casa"}>
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                color="success"
                                                                onClick={() => handleBuy(mp.property_id)}
                                                                disabled={buyBuilding.isPending || isMaxed || anyMortgaged || !canBuildEvenly}
                                                                sx={{ border: '1px solid', borderColor: 'success.main' }}
                                                            >
                                                                {isAt4Houses ? <ApartmentIcon /> : <HomeIcon />}
                                                                <AddIcon fontSize="small" sx={{ ml: 0.5, width: 14, height: 14 }} />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </>
                                            );
                                        })()}
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
}
