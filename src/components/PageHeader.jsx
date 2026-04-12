import { Stack, Typography } from '@mui/material';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
      <Stack spacing={0.5}>
        <Typography variant="h5">{title}</Typography>
        {subtitle ? <Typography variant="body2" color="text.secondary">{subtitle}</Typography> : null}
      </Stack>
      {action}
    </Stack>
  );
}
