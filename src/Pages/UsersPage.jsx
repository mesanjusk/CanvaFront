import { Button, Grid, MenuItem, Stack, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import PageCard from '../components/PageCard';
import api from '../services/api';

const roles = ['school_admin', 'principal', 'teacher', 'operator', 'student'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ name: '', username: '', password: '123456', role: 'teacher', studentId: '' });

  const load = async () => {
    const [{ data: userData }, { data: studentData }] = await Promise.all([api.get('/api/users'), api.get('/api/students')]);
    setUsers(userData.data);
    setStudents(studentData.data);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/api/users', form);
    setForm({ name: '', username: '', password: '123456', role: 'teacher', studentId: '' });
    load();
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <PageCard title="Create user">
          <Stack component="form" spacing={2} onSubmit={submit}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            <TextField label="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <TextField select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roles.map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}
            </TextField>
            {form.role === 'student' ? (
              <TextField select label="Link student record" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
                <MenuItem value="">None</MenuItem>
                {students.map((student) => <MenuItem key={student._id} value={student._id}>{student.fullName} ({student.className}-{student.section})</MenuItem>)}
              </TextField>
            ) : null}
            <Button type="submit" variant="contained">Create</Button>
          </Stack>
        </PageCard>
      </Grid>
      <Grid item xs={12} md={8}>
        <PageCard title="Users">
          <Stack spacing={2}>
            {users.map((user) => (
              <PageCard key={user._id} title={user.name}>
                <div>{user.username} · {user.role}</div>
              </PageCard>
            ))}
          </Stack>
        </PageCard>
      </Grid>
    </Grid>
  );
}
