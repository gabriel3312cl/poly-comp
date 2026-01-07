
import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Fab,
    Tooltip
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import BackspaceIcon from '@mui/icons-material/Backspace';

export default function FloatingCalculator() {
    const [open, setOpen] = useState(false);
    const [display, setDisplay] = useState('0');
    const [expression, setExpression] = useState('');
    const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

    const playKeySound = () => {
        const audio = new Audio('/key.mp3');
        audio.play().catch(e => console.error('Error playing sound:', e));
    };

    const handleDigit = (digit: string) => {
        playKeySound();
        if (display === '0' || shouldResetDisplay) {
            setDisplay(digit);
            setShouldResetDisplay(false);
        } else {
            setDisplay(display + digit);
        }
    };

    const handleOperator = (op: string) => {
        playKeySound();
        setExpression(display + ' ' + op + ' ');
        setShouldResetDisplay(true);
    };

    const handleCalculate = () => {
        playKeySound();
        try {
            // eslint-disable-next-line
            const result = eval(expression + display);
            setDisplay(String(result));
            setExpression('');
            setShouldResetDisplay(true);
        } catch (e) {
            setDisplay('Error');
            setShouldResetDisplay(true);
        }
    };

    const handleClear = () => {
        playKeySound();
        setDisplay('0');
        setExpression('');
        setShouldResetDisplay(false);
    };

    const handleDelete = () => {
        playKeySound();
        if (display.length === 1 || shouldResetDisplay) {
            setDisplay('0');
            setShouldResetDisplay(false);
        } else {
            setDisplay(display.slice(0, -1));
        }
    };

    return (
        <>
            <Tooltip title="Calculator">
                <Fab
                    color="primary"
                    onClick={() => setOpen(true)}
                    size="medium"
                >
                    <CalculateIcon />
                </Fab>
            </Tooltip>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontWeight="bold">Calculator</Typography>
                    <Button onClick={() => setOpen(false)} size="small">Close</Button>
                </DialogTitle>
                <DialogContent>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            mb: 2,
                            bgcolor: '#222',
                            color: '#0f0',
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            fontSize: '1.5rem',
                            borderRadius: 2
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" sx={{ minHeight: '1.2em', display: 'block' }}>
                            {expression}
                        </Typography>
                        {display}
                    </Paper>

                    <Grid container spacing={1}>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="outlined" color="error" onClick={handleClear}>C</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="outlined" onClick={() => handleOperator('/')}>/</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="outlined" onClick={() => handleOperator('*')}>*</Button></Grid>
                        <Grid size={{ xs: 3 }}>
                            <Button fullWidth variant="outlined" color="warning" onClick={handleDelete}>
                                <BackspaceIcon fontSize="small" />
                            </Button>
                        </Grid>

                        {['7', '8', '9', '-'].map(k => (
                            <Grid size={{ xs: 3 }} key={k}>
                                <Button fullWidth variant={isNaN(Number(k)) ? "outlined" : "contained"} color="inherit" onClick={() => isNaN(Number(k)) ? handleOperator(k) : handleDigit(k)}>
                                    {k}
                                </Button>
                            </Grid>
                        ))}

                        {['4', '5', '6', '+'].map(k => (
                            <Grid size={{ xs: 3 }} key={k}>
                                <Button fullWidth variant={isNaN(Number(k)) ? "outlined" : "contained"} color="inherit" onClick={() => isNaN(Number(k)) ? handleOperator(k) : handleDigit(k)}>
                                    {k}
                                </Button>
                            </Grid>
                        ))}

                        {['1', '2', '3'].map(k => (
                            <Grid size={{ xs: 3 }} key={k}>
                                <Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit(k)}>
                                    {k}
                                </Button>
                            </Grid>
                        ))}
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="primary" sx={{ height: '100%' }} onClick={handleCalculate}>=</Button></Grid>

                        <Grid size={{ xs: 6 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('0')}>0</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('00')}>00</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('000')}>k</Button></Grid>
                    </Grid>
                </DialogContent>
            </Dialog>
        </>
    );
}
