import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Add,
  Delete,
  Edit,
  FileDownload,
  PictureAsPdf
} from '@mui/icons-material';
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
  IconButton,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Chip
} from '@mui/material';
import BASE_URL from '../config';
import { getThemeColor } from '../utils/storageUtils';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    gender: '',
    mobileSelf: '',
    institute_uuid: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const searchTimeout = useRef();
  const themeColor = getThemeColor();
  const institute_uuid = localStorage.getItem('institute_uuid');

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/students`);
      setStudents(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      firstName: '',
      middleName: '',
      lastName: '',
      dob: '',
      gender: '',
      mobileSelf: '',
      institute_uuid
    });
    setPhotos([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('firstName', form.firstName);
    formData.append('middleName', form.middleName);
    formData.append('lastName', form.lastName);
    formData.append('dob', form.dob);
    formData.append('gender', form.gender);
    formData.append('mobileSelf', form.mobileSelf);
    formData.append('institute_uuid', institute_uuid);

    photos.forEach((file) => {
      formData.append('photos', file);
    });

    try {
      if (editingId) {
        if (!window.confirm('Update this student?')) return;
        await axios.put(`${BASE_URL}/api/students/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Student updated');
      } else {
        await axios.post(`https://canvaback.onrender.com/api/students`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Student added');
      }

      resetForm();
      setEditingId(null);
      setShowModal(false);
      fetchStudents();
    } catch {
      toast.error('Failed to submit');
    }
  };

  const handleEdit = (student) => {
    setForm({
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      dob: student.dob,
      gender: student.gender,
      mobileSelf: student.mobileSelf,
    });
    setEditingId(student._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/students/${id}`);
      toast.success('Deleted');
      fetchStudents();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filteredStudents = students.filter((s) =>
    s.firstName.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['FirstName', 'MiddleName', 'LastName', 'DOB', 'Gender', 'Mobile']],
      body: filteredStudents.map((s) => [
        s.firstName,
        s.middleName,
        s.lastName,
        s.dob,
        s.gender,
        s.mobileSelf,
      ]),
    });
    doc.save('students.pdf');
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredStudents.map((s) => ({
        'First Name': s.firstName,
        'Middle Name': s.middleName,
        'Last Name': s.lastName,
        DOB: s.dob,
        Gender: s.gender,
        Mobile: s.mobileSelf,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'students.xlsx');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: themeColor, py: 2 }}>
      <Toaster />
      <Container maxWidth="xl">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" mb={3}>
          <TextField
            placeholder="Search student"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            size="small"
          />
          <Stack direction="row" spacing={1}>
            <IconButton color="error" onClick={exportPDF} title="Export PDF">
              <PictureAsPdf fontSize="small" />
            </IconButton>
            <IconButton color="success" onClick={exportExcel} title="Export Excel">
              <FileDownload fontSize="small" />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                resetForm();
                setEditingId(null);
                setShowModal(true);
              }}
            >
              Add Student
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" mt={1}>
              Loading students...
            </Typography>
          </Stack>
        ) : filteredStudents.length === 0 ? (
          <Typography align="center" color="text.secondary" py={4}>
            No students found.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {filteredStudents.map((s) => (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={s._id}>
                <Card elevation={3} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {s.firstName}
                      {s.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mobile: <Chip label={s.mobileSelf} size="small" sx={{ ml: 1 }} />
                    </Typography>
                    <Stack spacing={0.5} mt={2}>
                      <Typography variant="body2">DOB: <strong>{s.dob}</strong></Typography>
                      <Typography variant="body2">Gender: <strong>{s.gender}</strong></Typography>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', gap: 1, pb: 2, pr: 2 }}>
                    <Button
                      size="small"
                      color="warning"
                      startIcon={<Edit fontSize="small" />}
                      onClick={() => handleEdit(s)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Delete fontSize="small" />}
                      onClick={() => handleDelete(s._id)}
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
        <DialogTitle>{editingId ? 'Edit Student' : 'Add New Student'}</DialogTitle>
        <DialogContent>
          <Stack component="form" onSubmit={handleSubmit} spacing={2} mt={1}>
            <TextField
              label="First Name"
              value={form.firstName}
              onChange={handleChange('firstName')}
              required
              fullWidth
            />
            <TextField
              label="Middle Name"
              value={form.middleName}
              onChange={handleChange('middleName')}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              value={form.lastName}
              onChange={handleChange('lastName')}
              required
              fullWidth
            />
            <TextField
              label="Mobile number"
              value={form.mobileSelf}
              onChange={handleChange('mobileSelf')}
              type="number"
              fullWidth
            />
            <TextField
              label="DOB"
              type="date"
              value={form.dob}
              onChange={handleChange('dob')}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Gender"
              value={form.gender}
              onChange={handleChange('gender')}
              fullWidth
            />
            <Button variant="outlined" component="label">
              Upload Photos
              <input
                hidden
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setPhotos([...e.target.files])}
              />
            </Button>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {photos?.length > 0 &&
                Array.from(photos).map((photo, idx) => (
                  <Box
                    key={idx}
                    component="img"
                    src={URL.createObjectURL(photo)}
                    alt="preview"
                    sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                  />
                ))}
            </Stack>
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

export default Students;
