import { Card, CardContent, Typography } from '@mui/material';

export default function PageCard({ title, action, children }) {
  return (
    <Card sx={{ boxShadow: '0 10px 35px rgba(15,23,42,0.06)' }}>
      <CardContent>
        {(title || action) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <Typography variant="h6">{title}</Typography>
            {action}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
