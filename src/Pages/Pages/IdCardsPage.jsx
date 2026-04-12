import { Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import EntityDialog from '../components/EntityDialog';

const emptyTemplate = { name: '', orientation: 'portrait', fields: 'studentName,className,section,rollNumber' };

export default function IdCardsPage() {
  const { institute } = useAppContext();
  const [templates, setTemplates] = useState([]);
  const [students, setStudents] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(emptyTemplate);

  const fetchAll = async () => {
    const institute_uuid = institute?.institute_uuid;
    if (!institute_uuid) return;
    const [t, s] = await Promise.all([
      api.get('/api/id-cards/templates', { params: { institute_uuid } }),
      api.get('/api/id-cards/students', { params: { institute_uuid } }),
    ]);
    setTemplates(t.data.data || []);
    setStudents(s.data.data || []);
  };

  useEffect(() => { fetchAll().catch(console.error); }, [institute?.institute_uuid]);

  const saveTemplate = async () => {
    await api.post('/api/id-cards/templates', { ...form, institute_uuid: institute.institute_uuid, fields: String(form.fields).split(',').map((x) => x.trim()).filter(Boolean) });
    setDialog(false); setForm(emptyTemplate); fetchAll();
  };

  return (
    <>
      <PageHeader title="ID Card Management" subtitle="Create reusable ID card templates and preview student-ready records." action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog(true)}>Add template</Button>} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}><CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Templates</Typography>
            <Stack spacing={1.5}>{templates.map((item) => (
              <Card key={item.uuid} variant="outlined"><CardContent>
                <Typography fontWeight={700}>{item.name}</Typography>
                <Typography variant="body2" color="text.secondary">{item.orientation} • {item.width} x {item.height} {item.unit}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>{item.fields?.map((field) => <Chip key={field} size="small" label={field} />)}</Stack>
              </CardContent></Card>
            ))}</Stack>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}><CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Students ready for print</Typography>
            <Grid container spacing={1.5}>{students.map((student) => (
              <Grid item xs={12} sm={6} key={student.uuid}><Card variant="outlined"><CardContent>
                <Typography fontWeight={700}>{student.firstName} {student.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">{student.className || '-'} {student.section || ''} • Roll {student.rollNumber || '-'}</Typography>
                <Typography variant="body2" color="text.secondary">Adm No: {student.admissionNo || '-'}</Typography>
              </CardContent></Card></Grid>
            ))}</Grid>
          </CardContent></Card>
        </Grid>
      </Grid>
      <EntityDialog open={dialog} title="Add ID card template" form={form} setForm={setForm} onClose={() => setDialog(false)} onSubmit={saveTemplate} fields={[
        { name: 'name', label: 'Template name' },
        { name: 'orientation', label: 'Orientation', type: 'select', options: [{ label: 'Portrait', value: 'portrait' }, { label: 'Landscape', value: 'landscape' }] },
        { name: 'fields', label: 'Fields (comma separated)', multiline: true },
      ]} />
    </>
  );
}
