import { Box, Button, Grid, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import PageCard from '../components/PageCard';
import api from '../services/api';

const starter = {
  name: 'Standard ID Card',
  width: 340,
  height: 540,
  backgroundColor: '#ffffff',
  logoUrl: '',
  backgroundImageUrl: '',
  fields: [
    { key: 'fullName', label: 'Student Name', x: 24, y: 190, fontSize: 20, bold: true, color: '#111827', width: 280 },
    { key: 'className', label: 'Class', x: 24, y: 230, fontSize: 16, bold: false, color: '#111827', width: 280 },
    { key: 'section', label: 'Section', x: 24, y: 258, fontSize: 16, bold: false, color: '#111827', width: 280 },
    { key: 'admissionNo', label: 'Admission', x: 24, y: 286, fontSize: 16, bold: false, color: '#111827', width: 280 },
  ],
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [raw, setRaw] = useState(JSON.stringify(starter, null, 2));

  const load = async () => {
    const { data } = await api.get('/api/templates');
    setTemplates(data.data);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    await api.post('/api/templates', JSON.parse(raw));
    load();
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <PageCard title="Create template">
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">You can paste full JSON to control fields, positions, colors, and card size.</Typography>
            <TextField multiline minRows={20} value={raw} onChange={(e) => setRaw(e.target.value)} fullWidth />
            <Button variant="contained" onClick={submit}>Save template</Button>
          </Stack>
        </PageCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <PageCard title="Saved templates">
          <Stack spacing={2}>
            {templates.map((template) => (
              <PageCard key={template._id} title={template.name}>
                <Typography>{template.width} × {template.height}</Typography>
                <Typography variant="body2" color="text.secondary">Fields: {template.fields?.length || 0}</Typography>
              </PageCard>
            ))}
          </Stack>
        </PageCard>
      </Grid>
    </Grid>
  );
}
