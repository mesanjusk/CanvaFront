import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const { login, loading } = useAppContext();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/app');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Paper elevation={4} sx={{ p: 4, width: '100%', borderRadius: 4 }}>
        <Stack spacing={2} component="form" onSubmit={onSubmit}>
          <Typography variant="h4" fontWeight={700}>School ID Platform</Typography>
          <Typography color="text.secondary">Default super admin is admin / admin.</Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
          <Button type="submit" variant="contained" size="large" disabled={loading}>Sign in</Button>
          <Box sx={{ fontSize: 13, color: 'text.secondary' }}>
            Use the super admin to create schools, school admins, principals, teachers, and students.
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
