import AddLinkIcon from '@mui/icons-material/AddLink';
import { Alert, Button, Grid, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import PageCard from '../components/PageCard';
import api from '../services/api';

const blank = { fullName: '', admissionNo: '', className: '', section: '', contactNumber: '', fatherName: '', address: '', photoUrl: '' };

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState({ className: '', section: '', q: '' });

  const load = async () => {
    const { data } = await api.get('/api/students', { params: filter });
    setStudents(data.data);
  };

  useEffect(() => { load(); }, [filter.className, filter.section]);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/api/students', form);
    setForm(blank);
    load();
  };

  const createLink = async (studentId) => {
    const { data } = await api.post(`/api/students/${studentId}/create-edit-link`);
    const fullLink = `${window.location.origin}/public/student-edit/${data.data.token}`;
    navigator.clipboard.writeText(fullLink);
    setMessage(`Edit link copied: ${fullLink}`);
  };

  const handleExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    await api.post('/api/students/bulk', { rows });
    setMessage(`Imported ${rows.length} rows`);
    load();
  };

  const grouped = useMemo(() => students, [students]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <PageCard title="Add student">
          <Stack component="form" spacing={2} onSubmit={submit}>
            {message ? <Alert severity="success">{message}</Alert> : null}
            <TextField label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            <TextField label="Admission no" value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} />
            <TextField label="Class" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} />
            <TextField label="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
            <TextField label="Contact" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
            <TextField label="Father name" value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} />
            <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} multiline minRows={2} />
            <TextField label="Photo URL or base64" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} multiline minRows={2} />
            <Button type="submit" variant="contained">Save student</Button>
            <Button component="label" variant="outlined">Import Excel<input hidden type="file" accept=".xlsx,.xls" onChange={handleExcel} /></Button>
          </Stack>
        </PageCard>
      </Grid>
      <Grid item xs={12} md={8}>
        <PageCard title="Students" action={<Stack direction="row" spacing={1}><TextField size="small" label="Class" value={filter.className} onChange={(e) => setFilter({ ...filter, className: e.target.value })} /><TextField size="small" label="Section" value={filter.section} onChange={(e) => setFilter({ ...filter, section: e.target.value })} /></Stack>}>
          <Stack spacing={2}>
            {grouped.map((student) => (
              <PageCard key={student._id} title={student.fullName} action={<IconButton onClick={() => createLink(student._id)}><AddLinkIcon /></IconButton>}>
                <Typography>{student.className} - {student.section} · {student.admissionNo || 'No admission no.'}</Typography>
                <Typography variant="body2" color="text.secondary">Status: {student.status}</Typography>
              </PageCard>
            ))}
          </Stack>
        </PageCard>
      </Grid>
    </Grid>
  );
}
