import { Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../services/api';
import PageCard from '../components/PageCard';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/api/dashboard/summary').then(({ data }) => setSummary(data.data));
  }, []);

  const cards = [
    { label: 'Schools', value: summary?.schools ?? '-' },
    { label: 'Users', value: summary?.users ?? '-' },
    { label: 'Students', value: summary?.students ?? '-' },
    { label: 'Templates', value: summary?.templates ?? '-' },
    { label: 'Pending Corrections', value: summary?.pendingCorrections ?? '-' },
    { label: 'Card Records', value: summary?.cardRecords ?? '-' },
  ];

  return (
    <>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>Dashboard</Typography>
      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.label}>
            <PageCard title={card.label}>
              <Typography variant="h3" fontWeight={700}>{card.value}</Typography>
            </PageCard>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
