import { Card, CardContent, Grid, List, ListItem, ListItemText, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';

export default function DashboardPage() {
  const { institute } = useAppContext();
  const [summary, setSummary] = useState({ cards: [], recentAdmissions: [] });

  useEffect(() => {
    if (!institute?.institute_uuid) return;
    api.get('/api/dashboard/summary', { params: { institute_uuid: institute.institute_uuid } })
      .then((res) => setSummary(res.data.data))
      .catch(console.error);
  }, [institute?.institute_uuid]);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Daily view for school admins, principals and team members." />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {summary.cards.map((card) => (
          <Grid size={{ xs: 6, md: 4, lg: 2 }} key={card.label}><StatCard {...card} /></Grid>
        ))}
      </Grid>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Recent admissions</Typography>
          <List>
            {summary.recentAdmissions?.length ? summary.recentAdmissions.map((item) => (
              <ListItem key={item.uuid} divider>
                <ListItemText primary={item.course || 'Admission'} secondary={`${item.className || '-'} ${item.section || ''} • ${new Date(item.createdAt).toLocaleDateString()}`} />
              </ListItem>
            )) : <Typography color="text.secondary">No recent admissions.</Typography>}
          </List>
        </CardContent>
      </Card>
    </>
  );
}
