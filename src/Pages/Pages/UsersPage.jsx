import { Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import EntityDialog from '../components/EntityDialog';

const empty = { name: '', mobile: '', role: 'teacher', password: '', login_username: '' };
const roleOptions = ['superadmin','owner','admin','staff','teacher','principal','student','guest','parent'].map((value) => ({ label: value, value }));

export default function UsersPage() {
  const { institute } = useAppContext();
  const [users, setUsers] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(empty);

  const fetchUsers = async () => {
    const { data } = await api.get('/api/users', { params: { institute_uuid: institute.institute_uuid } });
    setUsers(data.data || []);
  };
  useEffect(() => { if (institute?.institute_uuid) fetchUsers().catch(console.error); }, [institute?.institute_uuid]);

  const save = async () => {
    await api.post('/api/users', { ...form, institute_uuid: institute.institute_uuid, login_username: form.login_username || form.mobile });
    setDialog(false); setForm(empty); fetchUsers();
  };

  return (
    <>
      <PageHeader title="Users & Team" subtitle="Create principal, teacher, admin and staff accounts from the app UI." action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog(true)}>Add user</Button>} />
      <Grid container spacing={2}>{users.map((user) => <Grid item xs={12} sm={6} md={4} key={user._id}><Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}><CardContent>
        <Typography fontWeight={700}>{user.name}</Typography>
        <Typography variant="body2" color="text.secondary">{user.role}</Typography>
        <Typography variant="body2" color="text.secondary">{user.mobile || user.login_username}</Typography>
      </CardContent></Card></Grid>)}</Grid>
      <EntityDialog open={dialog} title="Add user" form={form} setForm={setForm} onClose={() => setDialog(false)} onSubmit={save} fields={[
        { name: 'name', label: 'Name' },
        { name: 'mobile', label: 'Mobile' },
        { name: 'login_username', label: 'Login username' },
        { name: 'password', label: 'Password' },
        { name: 'role', label: 'Role', type: 'select', options: roleOptions },
      ]} />
    </>
  );
}
