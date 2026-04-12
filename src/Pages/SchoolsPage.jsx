import { Button, Grid, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import PageCard from '../components/PageCard';
import api from '../services/api';

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({
    name: '', code: '', address: '', principalName: '', sessionLabel: '', board: '',
    adminName: '', adminUsername: '', adminPassword: 'admin123'
  });

  const load = async () => {
    const { data } = await api.get('/api/schools');
    setSchools(data.data);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/api/schools', {
      school: {
        name: form.name,
        code: form.code,
        address: form.address,
        principalName: form.principalName,
        sessionLabel: form.sessionLabel,
        board: form.board,
      },
      adminUser: {
        name: form.adminName,
        username: form.adminUsername,
        password: form.adminPassword,
      },
    });
    setForm({ name: '', code: '', address: '', principalName: '', sessionLabel: '', board: '', adminName: '', adminUsername: '', adminPassword: 'admin123' });
    load();
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <PageCard title="Create school">
          <Stack component="form" spacing={2} onSubmit={submit}>
            <TextField label="School name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label="School code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
            <TextField label="Principal name" value={form.principalName} onChange={(e) => setForm({ ...form, principalName: e.target.value })} />
            <TextField label="Academic session" value={form.sessionLabel} onChange={(e) => setForm({ ...form, sessionLabel: e.target.value })} />
            <TextField label="Board" value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })} />
            <TextField label="Address" multiline minRows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Typography variant="subtitle1">Initial school admin</Typography>
            <TextField label="Admin name" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} required />
            <TextField label="Admin username" value={form.adminUsername} onChange={(e) => setForm({ ...form, adminUsername: e.target.value })} required />
            <TextField label="Admin password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} required />
            <Button type="submit" variant="contained">Create school</Button>
          </Stack>
        </PageCard>
      </Grid>
      <Grid item xs={12} md={7}>
        <PageCard title="Schools">
          <Stack spacing={2}>
            {schools.map((school) => (
              <PageCard key={school._id} title={school.name}>
                <Typography>Code: {school.code}</Typography>
                <Typography>Principal: {school.principalName || '-'}</Typography>
                <Typography>Session: {school.sessionLabel || '-'}</Typography>
                <Typography>Status: {school.status}</Typography>
              </PageCard>
            ))}
          </Stack>
        </PageCard>
      </Grid>
    </Grid>
  );
}
