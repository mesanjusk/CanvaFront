import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import BASE_URL from '../config';
import { useApp } from '../context/AppContext';

const User = () => {
  const { user, institute, loading } = useApp();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    password: '',
    role: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fetchLoading, setFetchLoading] = useState(true);
  const navigate = useNavigate();
  const searchTimeout = useRef();

  const themeColor = institute?.theme_color || '#5b5b5b';

  useEffect(() => {
    if (!loading && !institute?.institute_uuid) {
      toast.error("Institute not found. Please log in.");
      navigate('/');
    }
  }, [institute, loading]);

  useEffect(() => {
    if (institute?.institute_uuid) {
      fetchUsers();
    }
    // eslint-disable-next-line
  }, [institute]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const fetchUsers = async () => {
    const orgId = institute?.institute_uuid;
    if (!orgId) return;

    try {
      setFetchLoading(true);
      const res = await axios.get(`${BASE_URL}/api/auth/GetUserList/${orgId}`);
      if (res.data?.success) {
        setUsers(res.data.result);
      } else {
        setUsers([]);
        toast.error('No users found');
      }
    } catch (error) {
      setUsers([]);
      toast.error('Error fetching users');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const orgId = institute?.institute_uuid;
    if (!orgId) {
      toast.error('Institute ID missing.');
      return;
    }

    const dataToSend = { ...form, institute_uuid: orgId };

    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/api/auth/${editingId}`, dataToSend);
        toast.success('User updated');
      } else {
        const res = await axios.post(`${BASE_URL}/api/auth/register`, dataToSend);

        if (res.data === 'exist') {
          toast.error('User already exists');
          return;
        } else if (res.data === 'notexist') {
          toast.success('User added');

          const groupRes = await axios.get(`${BASE_URL}/api/accountgroup/GetAccountgroupList`);
          const accountGroup = groupRes.data.result.find(g => g.Account_group === "ACCOUNT");

          if (!accountGroup) {
            toast.error('ACCOUNT group not found');
            return;
          }

          await axios.post(`${BASE_URL}/api/account/addAccount`, {
            Account_name: form.name,
            Mobile_number: form.mobile,
            Account_group: accountGroup.Account_group_uuid,
            institute_uuid: orgId
          });

          toast.success('Account also created');
        } else {
          toast.error('Unexpected user registration response');
          return;
        }
      }

      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error('Failed to submit');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this User?')) return;

    try {
      await axios.delete(`${BASE_URL}/api/auth/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name || '',
      password: item.password || '',
      mobile: item.mobile || '',
      role: item.role || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', password: '', mobile: '', role: '' });
  };

  const filteredUsers = users.filter(
    (item) =>
      item.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item.mobile?.includes(debouncedSearch) ||
      item.role?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'text.secondary' }}>
        Loading...
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: themeColor, py: 2 }}>
      <Toaster position="top-right" />
      <Container maxWidth="xl">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" mb={3}>
          <TextField
            placeholder="Search user"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            size="small"
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            Add User
          </Button>
        </Stack>

        {fetchLoading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" mt={1}>
              Loading users...
            </Typography>
          </Stack>
        ) : filteredUsers.length === 0 ? (
          <Typography align="center" color="text.secondary" py={4}>
            No users found.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {filteredUsers.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                <Card elevation={3} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {item.name}
                    </Typography>
                    <Stack spacing={0.5} color="text.secondary">
                      <Typography variant="body2">Mobile: <strong>{item.mobile}</strong></Typography>
                      <Typography variant="body2">Role: <strong>{item.role}</strong></Typography>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', gap: 1, pb: 2, pr: 2 }}>
                    <Button
                      size="small"
                      color="warning"
                      startIcon={<Edit fontSize="small" />}
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Delete fontSize="small" />}
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Dialog open={showModal} onClose={() => setShowModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <Stack component="form" onSubmit={handleSubmit} spacing={2} mt={1}>
            <TextField
              label="Name"
              value={form.name}
              onChange={handleInputChange('name')}
              required
              fullWidth
            />
            <TextField
              label="Password"
              value={form.password}
              onChange={handleInputChange('password')}
              required
              fullWidth
            />
            <TextField
              label="Mobile No."
              value={form.mobile}
              onChange={handleInputChange('mobile')}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]{10}', maxLength: 10 }}
              required
              fullWidth
            />
            <TextField
              label="Role"
              value={form.role}
              onChange={handleInputChange('role')}
              required
              fullWidth
            />
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setShowModal(false)} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained">{editingId ? 'Update' : 'Save'}</Button>
            </DialogActions>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default User;
