import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Avatar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { Delete, Edit, Image } from '@mui/icons-material';

const AddCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editPreviewImage, setEditPreviewImage] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://canvaback.onrender.com/api/category');
      setCategories(response.data.categories || response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    if (image) formData.append('image', image);

    try {
      await axios.post('https://canvaback.onrender.com/api/category', formData);
      setName('');
      setImage(null);
      setPreviewImage('');
      setIsCreateModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Error creating category:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await axios.delete(`https://canvaback.onrender.com/api/category/${id}`);
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const openEditModal = (category) => {
    setEditCategory(category);
    setEditName(category.name);
    setEditPreviewImage(category.imageUrl);
    setEditImage(null);
    setEditModalOpen(true);
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImage(file);
      setEditPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editCategory) return;
    const formData = new FormData();
    formData.append('name', editName);
    if (editImage) formData.append('image', editImage);

    try {
      await axios.put(`https://canvaback.onrender.com/api/category/${editCategory._id}` , formData);
      setEditModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} align="center" gutterBottom>
        Upload Category
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" mb={3}>
        <TextField
          label="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
        <Button variant="outlined" component="label">
          Upload Image
          <input hidden type="file" accept="image/*" onChange={handleImageChange} />
        </Button>
        <Button variant="contained" onClick={() => setIsCreateModalOpen(true)}>
          Add Category
        </Button>
      </Stack>

      {previewImage && (
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Avatar src={previewImage} alt="Preview" sx={{ width: 64, height: 64 }} />
          <Typography color="text.secondary">Preview</Typography>
        </Stack>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat._id} hover>
                <TableCell>
                  <IconButton onClick={() => { setSelectedImage(cat.imageUrl); setIsImageModalOpen(true); }}>
                    <Avatar src={cat.imageUrl} alt={cat.name} />
                  </IconButton>
                </TableCell>
                <TableCell>{cat.name}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button startIcon={<Edit />} onClick={() => openEditModal(cat)} variant="outlined" size="small">
                      Edit
                    </Button>
                    <Button startIcon={<Delete />} color="error" onClick={() => handleDelete(cat._id)} variant="contained" size="small">
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>
                  No categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} maxWidth="md">
        <DialogContent sx={{ textAlign: 'center' }}>
          <Box component="img" src={selectedImage} alt="Category" sx={{ maxWidth: '100%', maxHeight: '70vh' }} />
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Category</DialogTitle>
        <DialogContent>
          <Stack component="form" onSubmit={handleCreateSubmit} spacing={2} mt={1}>
            <TextField
              label="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
            />
            <Button variant="outlined" component="label">
              Upload Image
              <input hidden type="file" accept="image/*" onChange={handleImageChange} />
            </Button>
            {previewImage && (
              <Avatar src={previewImage} alt="Preview" sx={{ width: 80, height: 80 }} />
            )}
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setIsCreateModalOpen(false)} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained">Save</Button>
            </DialogActions>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <Stack component="form" onSubmit={handleEditSubmit} spacing={2} mt={1}>
            <TextField
              label="Category name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
              required
            />
            <Button variant="outlined" component="label">
              Upload Image
              <input hidden type="file" accept="image/*" onChange={handleEditImageChange} />
            </Button>
            {editPreviewImage && (
              <Avatar src={editPreviewImage} alt="Edit Preview" sx={{ width: 80, height: 80 }} />
            )}
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setEditModalOpen(false)} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained">Update</Button>
            </DialogActions>
          </Stack>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default AddCategory;
