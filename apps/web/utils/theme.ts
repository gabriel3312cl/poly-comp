'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#7c4dff', // Vivid Purple
            light: '#b47cff',
            dark: '#3f1dcb',
        },
        secondary: {
            main: '#00e5ff', // Cyan Accents
            light: '#6effff',
            dark: '#00b2cc',
        },
        background: {
            default: '#0a0a0a', // Almost black
            paper: '#1a1a1a',
        },
        text: {
            primary: '#ffffff',
            secondary: '#b3b3b3',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 600 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 24px',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none', // Remove default elevation overlay in dark mode
                },
            },
        },
    },
});

export default theme;
