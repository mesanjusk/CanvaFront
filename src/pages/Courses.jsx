import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Add,
  Delete,
  Edit,
  FileDownload,
  PictureAsPdf,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BASE_URL from "../config";
import { getThemeColor } from "../utils/storageUtils";

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    courseFees: '',
    examFees: '',
    duration: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const searchTimeout = useRef();
  const themeColor = getThemeColor();

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/courses`);
      setCourses(res.data || []);
    } catch {
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    const payload = { ...form };

    try {
      if (editingId) {
        if (!window.confirm('Update this course?')) return;
        await axios.put(`${BASE_URL}/api/courses/${editingId}`, payload);
        toast.success('Course updated');
      } else {
        await axios.post(`${BASE_URL}/api/courses`, payload);
        toast.success('Course added');
      }
      setForm({ name: '', description: '', courseFees: '', examFees: '', duration: '' });
      setEditingId(null);
      setShowModal(false);
      fetchCourses();
    } catch {
      toast.error('Failed to submit');
    }
  };

  const handleEdit = (course) => {
    setForm({
      name: course.name,
      description: course.description,
      courseFees: course.courseFees || '',
      examFees: course.examFees || '',
      duration: course.duration || ''
    });
    setEditingId(course._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/courses/${id}`);
      toast.success('Deleted');
      fetchCourses();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Course Name', 'Description', 'Course Fees', 'Exam Fees', 'Duration']],
      body: filteredCourses.map(c => [
        c.name,
        c.description || '-',
        c.courseFees || '-',
        c.examFees || '-',
        c.duration || '-'
      ])
    });
    doc.save('courses.pdf');
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredCourses.map(c => ({
        'Course Name': c.name,
        Description: c.description,
        'Course Fees': c.courseFees,
        'Exam Fees': c.examFees,
        Duration: c.duration,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Courses');
    XLSX.writeFile(workbook, 'courses.xlsx');
  };

  return (
    <Box minHeight="100vh" p={2} sx={{ backgroundColor: themeColor }}>
      <Toaster />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        mb={3}
        alignItems="center"
        flexWrap="wrap"
      >
        <TextField
          placeholder="Search course"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: { xs: "100%", sm: 220 } }}
        />
        <IconButton color="error" onClick={exportPDF} title="Export PDF">
          <PictureAsPdf fontSize="small" />
        </IconButton>
        <IconButton color="success" onClick={exportExcel} title="Export Excel">
          <FileDownload fontSize="small" />
        </IconButton>
        <Button
          variant="contained"
          startIcon={<Add fontSize="small" />}
          onClick={() => {
            setForm({ name: "", description: "", courseFees: "", examFees: "", duration: "" });
            setEditingId(null);
            setShowModal(true);
          }}
        >
          Add Course
        </Button>
      </Stack>

      {loading ? (
        <Box textAlign="center" py={6}>
          <Typography>Loading courses...</Typography>
        </Box>
      ) : filteredCourses.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">No courses found.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredCourses.map((c) => (
            <Grid item key={c._id} xs={12} sm={6} md={4} lg={3} xl={2}>
              <Card elevation={3} sx={{ height: "100%" }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {c.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {c.description || "No description"}
                  </Typography>
                  <Stack spacing={0.5} mt={1} mb={2}>
                    <Typography variant="body2">
                      Course Fees: <Typography component="span" fontWeight={600}>{c.courseFees || "-"}</Typography>
                    </Typography>
                    <Typography variant="body2">
                      Exam Fees: <Typography component="span" fontWeight={600}>{c.examFees || "-"}</Typography>
                    </Typography>
                    <Typography variant="body2">
                      Duration: <Typography component="span" fontWeight={600}>{c.duration || "-"}</Typography>
                    </Typography>
                  </Stack>
                  <CardActions sx={{ mt: "auto", justifyContent: "flex-end", gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      color="warning"
                      startIcon={<Edit fontSize="small" />}
                      onClick={() => handleEdit(c)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      color="error"
                      startIcon={<Delete fontSize="small" />}
                      onClick={() => handleDelete(c._id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Course" : "Add New Course"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1} component="form" onSubmit={handleSubmit}>
            <TextField
              label="Course Name"
              value={form.name}
              onChange={handleChange("name")}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={handleChange("description")}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Course Fees"
              value={form.courseFees}
              onChange={handleChange("courseFees")}
              type="number"
              fullWidth
            />
            <TextField
              label="Exam Fees"
              value={form.examFees}
              onChange={handleChange("examFees")}
              type="number"
              fullWidth
            />
            <TextField
              label="Duration (e.g., 6 months)"
              value={form.duration}
              onChange={handleChange("duration")}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingId ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Courses;
