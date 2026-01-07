import { Box, Paper, Tooltip, Typography, Avatar, Zoom } from '@mui/material';
import { BOARD_SPACES } from '@/utils/boardSpaces';
import { useAuthStore } from '@/store/authStore';

interface Participant {
    id: string;
    user_id: string;
    first_name: string;
    position: number;
    avatar_url?: string;
    color?: string; // Optional if we want per-user colors
}

interface GameBoardProps {
    participants: Participant[];
}

export default function GameBoard({ participants }: GameBoardProps) {
    const user = useAuthStore(state => state.user);

    // Grid Mapping Logic
    // Bottom Row: 10 -> 0 (Right to Left) -> Grid Row 11, Cols 1-11
    // Left Col: 11 -> 19 (Bottom to Top) -> Grid Col 1, Rows 10-2
    // Top Row: 20 -> 30 (Left to Right) -> Grid Row 1, Cols 1-11
    // Right Col: 31 -> 39 (Top to Bottom) -> Grid Col 11, Rows 2-10

    const getGridPosition = (index: number) => {
        if (index >= 0 && index <= 10) {
            // Bottom Row (Right->Left)
            // Index 0 -> Col 11, Row 11
            // Index 10 -> Col 1, Row 11
            return { gridRow: 11, gridColumn: 11 - index };
        } else if (index >= 11 && index <= 19) {
            // Left Col (Bottom->Top)
            // Index 11 -> Col 1, Row 10
            // Index 19 -> Col 1, Row 2
            return { gridRow: 11 - (index - 10), gridColumn: 1 };
        } else if (index >= 20 && index <= 30) {
            // Top Row (Left->Right)
            // Index 20 -> Col 1, Row 1
            // Index 30 -> Col 11, Row 1
            return { gridRow: 1, gridColumn: index - 19 };
        } else if (index >= 31 && index <= 39) {
            // Right Col (Top->Bottom)
            // Index 31 -> Col 11, Row 2
            // Index 39 -> Col 11, Row 10
            return { gridRow: index - 29, gridColumn: 11 };
        }
        return { gridRow: 1, gridColumn: 1 };
    };

    return (
        <Paper
            elevation={6}
            sx={{
                p: 2,
                bgcolor: '#cde6d0', // Classic board background color
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
                aspectRatio: '1/1',
                width: '100%',
                maxWidth: 800,
                mx: 'auto'
            }}
        >
            <Box
                display="grid"
                gridTemplateColumns="repeat(11, 1fr)"
                gridTemplateRows="repeat(11, 1fr)"
                gap={0.5}
                sx={{ width: '100%', height: '100%' }}
            >
                {/* Center Branding / Decoration */}
                <Box
                    sx={{
                        gridColumn: '2 / 11',
                        gridRow: '2 / 11',
                        bgcolor: '#cde6d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        border: '2px solid rgba(0,0,0,0.1)'
                    }}
                >
                    <Typography variant="h2" fontWeight="900" color="success.main" sx={{ transform: 'rotate(-45deg)', opacity: 0.2 }}>
                        POLY-COMP
                    </Typography>
                </Box>

                {/* Render Spaces */}
                {BOARD_SPACES.map((space) => {
                    const pos = getGridPosition(space.index);
                    const isCorner = space.type === 'corner';

                    // Occupants
                    const occupants = participants.filter(p => p.position === space.index);

                    return (
                        <Box
                            key={space.index}
                            sx={{
                                ...pos,
                                bgcolor: 'white',
                                border: '1px solid black',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 0.5,
                                fontSize: '0.6rem',
                                textAlign: 'center',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Color Bar */}
                            {space.color && (
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: isCorner ? 0 : '20%',
                                        bgcolor: space.color,
                                        borderBottom: '1px solid black',
                                        mb: 0.5
                                    }}
                                />
                            )}

                            {/* Space Name */}
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#000000', // Explicitly black
                                    fontSize: '0.5rem',
                                    lineHeight: 1.1,
                                    fontWeight: 'bold',
                                    mb: 'auto',
                                    textAlign: 'center',
                                    width: '100%',
                                    wordBreak: 'break-word',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}
                            >
                                {space.name}
                            </Typography>

                            {/* Price */}
                            {space.price && (
                                <Typography variant="caption" sx={{ fontSize: '0.6rem', mt: 0.5, color: '#000000' }}>
                                    ${space.price}
                                </Typography>
                            )}

                            {/* Occupants (Avatars) */}
                            {occupants.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5, position: 'absolute', bottom: 2, width: '100%' }}>
                                    {occupants.map(p => (
                                        <Tooltip key={p.id} title={p.first_name}>
                                            <Zoom in={true}>
                                                <Avatar
                                                    src={p.avatar_url}
                                                    sx={{
                                                        width: 20,
                                                        height: 20,
                                                        bgcolor: p.user_id === user?.id ? 'primary.main' : 'secondary.main',
                                                        border: '2px solid white',
                                                        fontSize: '0.6rem'
                                                    }}
                                                >
                                                    {p.first_name[0]}
                                                </Avatar>
                                            </Zoom>
                                        </Tooltip>
                                    ))}
                                </Box>
                            )}

                            {/* Special Icons (Optional for robustness) */}
                            {space.type === 'chance' && <Typography variant="h6" color="warning.main">?</Typography>}
                            {space.type === 'chest' && <Typography variant="h6" color="info.main">📦</Typography>}
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
}
