import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Grid, Stack, TextField, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function PublicAccessPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/api/public/${token}`)
      .then(({ data }) => setPayload(data))
      .catch((err) => setError(err.response?.data?.message || 'Link not found'))
      .finally(() => setLoading(false));
  }, [token]);

  const save = async () => {
    setSaved('');
    await api.put(`/api/public/${token}`, payload.type === 'id-card' ? { data: payload.data.data, lastEditedBy: 'public-link' } : { ...payload.data, lastEditedBy: 'public-link' });
    setSaved('Saved successfully');
  };

  if (loading) return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 2 }}><Alert severity="error">{error}</Alert></Box>;

  const isId = payload.type === 'id-card';
  const data = isId ? payload.data.data : payload.data;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: 2 }}>
      <Card sx={{ maxWidth: 760, mx: 'auto', borderRadius: 4 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={700}>{isId ? 'Complete ID card details' : 'Complete report card details'}</Typography>
              <Typography color="text.secondary">This link is pre-logged. Update the missing fields and save from mobile.</Typography>
            </Box>
            {saved ? <Alert severity="success">{saved}</Alert> : null}

            {isId ? (
              <Grid container spacing={1.2}>
                {['studentName', 'className', 'section', 'rollNumber', 'admissionNo', 'guardianName', 'mobileParent', 'photoUrl'].map((field) => (
                  <Grid key={field} size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label={field} value={data?.[field] || ''} onChange={(e) => setPayload((prev) => ({ ...prev, data: { ...prev.data, data: { ...prev.data.data, [field]: e.target.value } } }))} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Stack spacing={1.5}>
                <Grid container spacing={1.2}>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Student name" value={data?.studentSnapshot?.studentName || ''} onChange={(e) => setPayload((prev) => ({ ...prev, data: { ...prev.data, studentSnapshot: { ...prev.data.studentSnapshot, studentName: e.target.value } } }))} /></Grid>
                  <Grid size={{ xs: 6, sm: 3 }}><TextField fullWidth label="Class" value={data?.className || ''} onChange={(e) => setPayload((prev) => ({ ...prev, data: { ...prev.data, className: e.target.value } }))} /></Grid>
                  <Grid size={{ xs: 6, sm: 3 }}><TextField fullWidth label="Section" value={data?.section || ''} onChange={(e) => setPayload((prev) => ({ ...prev, data: { ...prev.data, section: e.target.value } }))} /></Grid>
                </Grid>
                {(data?.subjects || []).map((subject, index) => (
                  <Grid container spacing={1} key={index}>
                    <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Subject" value={subject.subject || ''} onChange={(e) => setPayload((prev) => ({ ...prev, data: { ...prev.data, subjects: prev.data.subjects.map((item, i) => i === index ? { ...item, subject: e.target.value } : item) } }))} /></Grid>
                    <Grid size={{ xs: 4, sm: 2 }}><TextField fullWidth type="number" label="Max" value={subject.maxMarks || 0} onChange={(e) => setPayload((prev) => ({ ...prev, data: { ...prev.data, subjects: prev.data.subjects.map((item, i) => i === index ? { ...item, maxMarks: Number(e.target.value) } : item) } }))} /></Grid>
                    <Grid size={{ xs: 4, sm: 3 }}><TextField fullWidth type="number" label="Obtained" value={subject.obtainedMarks || 0} onChange={(e) => setPayload((prev) => ({ ...prev, data: { ...prev.data, subjects: prev.data.subjects.map((item, i) => i === index ? { ...item, obtainedMarks: Number(e.target.value) } : item) } }))} /></Grid>
                    <Grid size={{ xs: 4, sm: 3 }}><TextField fullWidth label="Grade" value={subject.grade || ''} onChange={(e) => setPayload((prev) => ({ ...prev, data: { ...prev.data, subjects: prev.data.subjects.map((item, i) => i === index ? { ...item, grade: e.target.value } : item) } }))} /></Grid>
                  </Grid>
                ))}
                <TextField label="Teacher remarks" multiline minRows={3} value={data?.teacherRemarks || ''} onChange={(e) => setPayload((prev) => ({ ...prev, data: { ...prev.data, teacherRemarks: e.target.value } }))} />
              </Stack>
            )}

            <Button variant="contained" onClick={save}>Save details</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
