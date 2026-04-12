import { createTheme } from '@mui/material/styles';

const normalizeColor = (value, fallback = '#6fa8dc') => {
  if (!value || typeof value !== 'string') return fallback;

  const v = value.trim();

  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v)) return v;
  if (/^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v)) return `#${v}`;
  if (/^(rgb|rgba|hsl|hsla|color)\(/.test(v)) return v;

  return fallback;
};

export const getTheme = (themeColor = '#6fa8dc') =>
  createTheme({
    palette: {
      primary: {
        main: normalizeColor(themeColor),
      },
    },
  });