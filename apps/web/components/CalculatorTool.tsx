'use client';

import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    IconButton,
    Collapse,
    Stack
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import BackspaceIcon from '@mui/icons-material/Backspace';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export default function CalculatorTool() {
    const [isOpen, setIsOpen] = useState(false);
    const [display, setDisplay] = useState('0');
    const [expression, setExpression] = useState('');
    const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

    const handleDigit = (digit: string) => {
        if (display === '0' || shouldResetDisplay) {
            setDisplay(digit);
            setShouldResetDisplay(false);
        } else {
            setDisplay(display + digit);
        }
    };

    const handleOperator = (op: string) => {
        setExpression(display + ' ' + op + ' ');
        setShouldResetDisplay(true);
    };

    const handleCalculate = () => {
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
        setDisplay('0');
        setExpression('');
        setShouldResetDisplay(false);
    };

    const handleDelete = () => {
        if (display.length === 1 || shouldResetDisplay) {
            setDisplay('0');
            setShouldResetDisplay(false);
        } else {
            setDisplay(display.slice(0, -1));
        }
    };

    return (
        <Paper sx={{ mb: 2, overflow: 'hidden', borderRadius: 2 }}>
            <Box
                p={2}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => setIsOpen(!isOpen)}
                sx={{ cursor: 'pointer', bgcolor: 'background.paper' }}
            >
                <Stack direction="row" alignItems="center" gap={1}>
                    <CalculateIcon color="primary" />
                    <Typography fontWeight="bold">Calculator</Typography>
                </Stack>
                {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>

            <Collapse in={isOpen}>
                <Box p={2} bgcolor="action.hover">
                    {/* Display */}
                    <Box
                        sx={{
                            bgcolor: '#222',
                            color: '#0f0',
                            p: 2,
                            borderRadius: 1,
                            mb: 2,
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            fontSize: '1.5rem',
                            minHeight: '4rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" sx={{ minHeight: '1.2em' }}>
                            {expression}
                        </Typography>
                        {display}
                    </Box>

                    {/* Keypad */}
                    <Grid container spacing={1}>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="outlined" color="error" onClick={handleClear}>C</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="outlined" onClick={() => handleOperator('/')}>/</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="outlined" onClick={() => handleOperator('*')}>*</Button></Grid>
                        <Grid size={{ xs: 3 }}>
                            <Button fullWidth variant="outlined" color="warning" onClick={handleDelete}>
                                <BackspaceIcon fontSize="small" />
                            </Button>
                        </Grid>

                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('7')}>7</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('8')}>8</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('9')}>9</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="outlined" onClick={() => handleOperator('-')}>-</Button></Grid>

                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('4')}>4</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('5')}>5</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('6')}>6</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="outlined" onClick={() => handleOperator('+')}>+</Button></Grid>

                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('1')}>1</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('2')}>2</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('3')}>3</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="primary" sx={{ height: '100%' }} onClick={handleCalculate}>=</Button></Grid>

                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('0')}>0</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('00')}>00</Button></Grid>
                        <Grid size={{ xs: 3 }}><Button fullWidth variant="contained" color="inherit" onClick={() => handleDigit('000')}>000</Button></Grid>
                        {/* Empty or dot? User didn't ask for dot, sticking to integers mostly but calc usually has dot. User asked specific buttons, sticking to those. */}
                    </Grid>
                </Box>
            </Collapse>
        </Paper>
    );
}
