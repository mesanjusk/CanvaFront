import { createTheme } from '@mui/material/styles';

const normalizeColor = (value, fallback = '#6fa8dc') => {
  if (!value || typeof value !== 'string') return fallback;
  const v = value.trim();
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v)) return v;
  if (/^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v)) return `#${v}`;
  if (/^(rgb|rgba|hsl|hsla|color)\(/.test(v)) return v;
  return fallback;
};

export const getTheme = (theme = {}) => {
  const primary = normalizeColor(theme?.primary || theme?.main || '#6fa8dc');
  const secondary = normalizeColor(theme?.secondary || '#0f172a', '#0f172a');
  const accent = normalizeColor(theme?.accent || '#14b8a6', '#14b8a6');
  return createTheme({
    palette: {
      mode: theme?.mode === 'dark' ? 'dark' : 'light',
      primary: { main: primary },
      secondary: { main: secondary },
      success: { main: accent },
      background: { default: theme?.mode === 'dark' ? '#020617' : '#f8fafc' },
    },
    shape: { borderRadius: 16 },
    typography: { fontFamily: 'Inter, Arial, sans-serif' },
  });
};
