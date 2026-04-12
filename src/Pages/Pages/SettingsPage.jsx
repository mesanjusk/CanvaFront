import { Button, Card, CardContent, Grid, Stack, Switch, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';

export default function SettingsPage() {
  const { institute, settings, fetchSettings } = useAppContext();
  const [form, setForm] = useState(settings || null);

  useEffect(() => { setForm(settings || null); }, [settings]);
  if (!form) return null;

  const save = async () => {
    await api.put(`/api/school-settings/${institute.institute_uuid}`, form);
    await fetchSettings(institute.institute_uuid);
  };

  return (
    <>
      <PageHeader title="School Settings" subtitle="Manage branding, modules and school profile from frontend only." action={<Button variant="contained" onClick={save}>Save settings</Button>} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}><Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}><CardContent>
          <Stack spacing={2}>
            <TextField label="School name" value={form.schoolName || ''} onChange={(e) => setForm((p) => ({ ...p, schoolName: e.target.value }))} />
            <TextField label="Short name" value={form.shortName || ''} onChange={(e) => setForm((p) => ({ ...p, shortName: e.target.value }))} />
            <TextField label="Tagline" value={form.tagline || ''} onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))} />
            <TextField label="Board" value={form.board || ''} onChange={(e) => setForm((p) => ({ ...p, board: e.target.value }))} />
            <TextField label="Principal name" value={form.principalName || ''} onChange={(e) => setForm((p) => ({ ...p, principalName: e.target.value }))} />
            <TextField label="Contact phone" value={form.contactPhone || ''} onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))} />
            <TextField label="Contact email" value={form.contactEmail || ''} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))} />
            <TextField label="Address line 1" value={form.addressLine1 || ''} onChange={(e) => setForm((p) => ({ ...p, addressLine1: e.target.value }))} />
            <TextField label="Address line 2" value={form.addressLine2 || ''} onChange={(e) => setForm((p) => ({ ...p, addressLine2: e.target.value }))} />
            <TextField label="Logo URL" value={form.logoUrl || ''} onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))} />
            <TextField label="Signature URL" value={form.signatureUrl || ''} onChange={(e) => setForm((p) => ({ ...p, signatureUrl: e.target.value }))} />
          </Stack>
        </CardContent></Card></Grid>
        <Grid item xs={12} md={5}><Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}><CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Modules</Typography>
          <Stack spacing={1.5}>{Object.entries(form.modules || {}).map(([key, value]) => (
            <Stack key={key} direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ textTransform: 'capitalize' }}>{key}</Typography>
              <Switch checked={Boolean(value)} onChange={(e) => setForm((p) => ({ ...p, modules: { ...p.modules, [key]: e.target.checked } }))} />
            </Stack>
          ))}</Stack>
        </CardContent></Card></Grid>
      </Grid>
    </>
  );
}
