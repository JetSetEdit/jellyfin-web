import { buildCustomColorScheme } from 'themes/utils';

/** Crabflix — deep black cinema, warm crab-orange accents */
const theme = buildCustomColorScheme({
    palette: {
        primary: {
            main: '#e05c2a'
        },
        secondary: {
            main: '#c4941a'
        },
        background: {
            default: '#0a0a0a',
            paper: '#161616'
        },
        SnackbarContent: {
            bg: '#1e1e1e',
            color: 'rgba(255, 255, 255, 0.87)'
        }
    }
});

export default theme;
