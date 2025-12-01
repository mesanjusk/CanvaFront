import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { fabric } from 'fabric';
import imageCompression from 'browser-image-compression';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { Add, Close, Delete, Edit, OpenInNew } from '@mui/icons-material';

const AddTemplate = () => {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const fabricCanvasRef = useRef(null);
  const [existingImageURLs, setExistingImageURLs] = useState([]);
  const [form, setForm] = useState({ title: '', category: '', subcategory: '', price: '' });
  const [image, setImage] = useState();
  const [previewImage, setPreviewImage] = useState();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dropdownData, setDropdownData] = useState({ categories: [], subcategories: [] });
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fileInputRef = useRef(null);

  const safeExtract = (res) => (Array.isArray(res) ? res : res?.result || []);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    const newCanvas = new fabric.Canvas(canvasRef.current, {
      height: 500,
      width: 800,
      backgroundColor: '#fff',
    });

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: 'red',
      width: 100,
      height: 100,
    });

    newCanvas.add(rect);

    fabricCanvasRef.current = newCanvas;

    return () => {
      newCanvas.dispose();
    };
  }, []);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [categoryRes, subcategoryRes, templateRes] = await Promise.all([
          axios.get('https://canvaback.onrender.com/api/category/with-usage'),
          axios.get('https://canvaback.onrender.com/api/subcategory'),
          axios.get('https://canvaback.onrender.com/api/template/')
        ]);
        setDropdownData({
          categories: safeExtract(categoryRes.data),
          subcategories: safeExtract(subcategoryRes.data),
        });
        setTemplates(Array.isArray(templateRes.data) ? templateRes.data : templateRes.data?.result || []);
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch dropdown or templates.');
      }
    };
    fetchDropdowns();
  }, []);

  const handleInputChange = (field) => (e) => {
    const value = e?.target?.value ?? e;
    if (field === 'price' && value && !/^\d*\.?\d*$/.test(value)) return;
    setForm({ ...form, [field]: value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, or WEBP allowed.');
      return;
    }

    setLoading(true);

    try {
      const compressedBlob = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const compressedFile = new File([compressedBlob], `${Date.now()}-${file.name}`, {
        type: compressedBlob.type,
      });

      setImage(compressedFile);
      setPreviewImage([{ url: URL.createObjectURL(compressedFile) }]);
    } catch (error) {
      console.error(error);
      toast.error('Image compression failed.');
    }

    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.category || !form.subcategory || !form.price) {
      return toast.error('Fill all fields');
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (image) formData.append("image", image);

    const canvas = fabricCanvasRef.current;
    if (canvas) {
      const json = canvas.toJSON();
      formData.append("canvasJson", JSON.stringify(json));
    }


    if (editingId && existingImageURLs.length > 0) {
      formData.append("existingImages", JSON.stringify(existingImageURLs));
    }

    try {
      if (editingId) {
        await axios.put(`https://canvaback.onrender.com/api/template/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Template updated");
      } else {
        await axios.post("https://canvaback.onrender.com/api/template/save", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total))
        });
        toast.success("Template created");
        localStorage.removeItem("canvasJson");
      }

      setForm({ title: '', category: '', subcategory: '', price: '' });
      setImage();
      setExistingImageURLs([]);
      setPreviewImage([]);
      setUploadProgress(0);
      setEditingId(null);
      setShowModal(false);

      const updated = await axios.get("https://canvaback.onrender.com/api/template/");
      setTemplates(updated.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Submit failed.");
    }
  };

  const getName = (uuid, type) => {
    const list = dropdownData[type];
    const keyMap = { categories: 'category_uuid', subcategories: 'subcategory_uuid' };
    const key = keyMap[type];
    const found = Array.isArray(list) ? list.find(item => item[key] === uuid) : null;
    return found?.name || '';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    await axios.delete(`https://canvaback.onrender.com/api/template/${id}`);
    setTemplates(templates.filter(item => item._id !== id));
    toast.success('Template deleted');
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || '',
      category: item.category_uuid || '',
      subcategory: item.subcategory_uuid || '',
      price: item.price || '',
    });
    setImage();
    setExistingImageURLs(item.images || []);
    setPreviewImage((item.images || []).map((url) => ({ url })));
    setShowModal(true);
  };

  const openTemplateEditor = (id) => {
    navigate(`/template-editor/${id}`);
  };

  const filteredTemplates = templates.filter(item => (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', py: 4 }}>
      <Toaster position="top-right" />
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={3}>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Upload Template
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowModal(true)}>
            New Template
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3} alignItems="center">
          <TextField
            label="Search title"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            sx={{ maxWidth: 420 }}
          />
        </Stack>

        <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Template Canvas
          </Typography>
          <Box
            component="canvas"
            ref={canvasRef}
            width={800}
            height={500}
            sx={{ width: '100%', maxWidth: 800, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'common.white' }}
          />
        </Paper>

        <TableContainer component={Paper} elevation={1}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Subcategory</TableCell>
                <TableCell>Price</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">No templates found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((item, i) => (
                  <TableRow key={i} hover>
                    <TableCell>
                      <Box display="flex" justifyContent="flex-start">
                        <Box
                          component="img"
                          src={item.image}
                          alt={item.title || 'Template'}
                          sx={{ width: 56, height: 56, borderRadius: 1, objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => openTemplateEditor(item._id)}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{getName(item.category, 'categories')}</TableCell>
                    <TableCell>{getName(item.subCategory, 'subcategories')}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" startIcon={<OpenInNew />} onClick={() => openTemplateEditor(item._id)}>
                          Open
                        </Button>
                        <Button size="small" color="warning" variant="outlined" startIcon={<Edit />} onClick={() => handleEdit(item)}>
                          Edit
                        </Button>
                        <Button size="small" color="error" variant="outlined" startIcon={<Delete />} onClick={() => handleDelete(item._id)}>
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      <Dialog open={showModal} onClose={() => setShowModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit Listing' : 'Create New Listing'}</DialogTitle>
        <DialogContent>
          <Stack component="form" onSubmit={handleSubmit} spacing={2} mt={1}>
            <TextField
              label="Title"
              value={form.title}
              onChange={handleInputChange('title')}
              required
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                label="Category"
                value={form.category}
                onChange={handleInputChange('category')}
              >
                <MenuItem value="">
                  <em>Select Category</em>
                </MenuItem>
                {dropdownData.categories.map((c) => (
                  <MenuItem key={c.category_uuid} value={c.category_uuid}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel id="subcategory-label">Subcategory</InputLabel>
              <Select
                labelId="subcategory-label"
                label="Subcategory"
                value={form.subcategory}
                onChange={handleInputChange('subcategory')}
              >
                <MenuItem value="">
                  <em>Select Subcategory</em>
                </MenuItem>
                {dropdownData.subcategories.map((s) => (
                  <MenuItem key={s.subcategory_uuid} value={s.subcategory_uuid}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Price"
              value={form.price}
              onChange={handleInputChange('price')}
              placeholder="Enter price (numeric only)"
              required
              fullWidth
            />
            <Box>
              <Button variant="outlined" component="label">
                Upload Image
                <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
              </Button>
            </Box>
            {previewImage && previewImage[0] && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  component="img"
                  src={previewImage[0].url}
                  alt="preview"
                  sx={{ width: 80, height: 80, borderRadius: 1, objectFit: 'cover', border: '1px solid', borderColor: 'divider' }}
                />
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => {
                    setImage(null);
                    setPreviewImage([]);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <Close />
                </IconButton>
              </Stack>
            )}
            {uploadProgress > 0 && (
              <LinearProgress variant="determinate" value={uploadProgress} />
            )}
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setShowModal(false)} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? `Uploading... ${uploadProgress}%` : editingId ? 'Update' : 'Save'}
              </Button>
            </DialogActions>
          </Stack>
        </DialogContent>
      </Dialog>

    </Box>
  );
};

export default AddTemplate;
