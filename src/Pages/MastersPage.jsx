import { Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import EntityDialog from '../components/EntityDialog';

const empty = { type: 'class', name: '', code: '', description: '' };
const typeOptions = ['class','section','academic_year','exam','subject','grade_scale','house','designation','custom'].map((value) => ({ value, label: value }));

export default function MastersPage() {
  const { institute } = useAppContext();
  const [items, setItems] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(empty);

  const fetchItems = async () => {
    const { data } = await api.get('/api/masters', { params: { institute_uuid: institute.institute_uuid } });
    setItems(data.data || []);
  };
  useEffect(() => { if (institute?.institute_uuid) fetchItems().catch(console.error); }, [institute?.institute_uuid]);

  const save = async () => {
    await api.post('/api/masters', { ...form, institute_uuid: institute.institute_uuid });
    setDialog(false); setForm(empty); fetchItems();
  };

  return (
    <>
      <PageHeader title="Masters" subtitle="Classes, sections, academic years, exams, subjects and more — all editable from frontend." action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog(true)}>Add master</Button>} />
      <Grid container spacing={2}>{items.map((item) => <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.uuid}><Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}><CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography fontWeight={700}>{item.name}</Typography><Chip size="small" label={item.type} />
        </Stack>
        <Typography variant="body2" color="text.secondary">{item.code || 'No code'}</Typography>
        <Typography variant="body2" color="text.secondary">{item.description || 'No description'}</Typography>
      </CardContent></Card></Grid>)}</Grid>
      <EntityDialog open={dialog} title="Add master" form={form} setForm={setForm} onClose={() => setDialog(false)} onSubmit={save} fields={[
        { name: 'type', label: 'Type', type: 'select', options: typeOptions },
        { name: 'name', label: 'Name' },
        { name: 'code', label: 'Code' },
        { name: 'description', label: 'Description', multiline: true },
      ]} />
    </>
  );
}
