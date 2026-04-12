import { Alert, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function PublicStudentEditPage() {
  const { token } = useParams();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/public/student-edit/${token}`)
      .then(({ data }) => setForm(data.data.student))
      .catch((err) => setError(err?.response?.data?.message || 'Unable to open link'));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/public/student-edit/${token}`, form);
      setMessage('Your correction has been sent for review.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Stack spacing={2} component="form" onSubmit={submit}>
          <Typography variant="h5" fontWeight={700}>Student correction form</Typography>
          <Typography color="text.secondary">You can update only limited fields like photo or typo correction.</Typography>
          {message ? <Alert severity="success">{message}</Alert> : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
          {form ? (
            <>
              <TextField label="Full name" value={form.fullName || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <TextField label="Contact number" value={form.contactNumber || ''} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
              <TextField label="Address" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} multiline minRows={2} />
              <TextField label="Blood group" value={form.bloodGroup || ''} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} />
              <TextField label="Photo URL or base64" value={form.photoUrl || ''} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} multiline minRows={2} />
              <Button type="submit" variant="contained">Submit correction</Button>
            </>
          ) : null}
        </Stack>
      </Paper>
    </Container>
  );
}
