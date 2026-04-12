import { createTheme } from '@mui/material/styles';

export const getTheme = (themeConfig = {}) => createTheme({
  palette: {
    mode: themeConfig.mode || 'light',
    primary: { main: themeConfig.primary || '#2563eb' },
    secondary: { main: themeConfig.secondary || '#0f172a' },
    success: { main: themeConfig.accent || '#14b8a6' },
    background: { default: '#f8fafc', paper: '#ffffff' },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCard: { styleOverrides: { root: { borderRadius: 20 } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 12, minHeight: 42 } } },
    MuiTextField: { defaultProps: { fullWidth: true, size: 'small' } },
  },
});
