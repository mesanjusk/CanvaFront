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
  MenuItem,
  Select,
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
import { Delete, Edit } from '@mui/icons-material';

const AddSubcategory = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editIsLoading, setEditIsLoading] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');

  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editPreviewImage, setEditPreviewImage] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('https://canvaback.onrender.com/api/category');
      setCategories(res.data.categories || res.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const res = await axios.get('https://canvaback.onrender.com/api/subcategory');
      setSubcategories(res.data.subcategories || res.data || []);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('categoryId', category);
    if (image) formData.append('image', image);

    try {
      await axios.post('https://canvaback.onrender.com/api/subcategory', formData);
      setIsModalOpen(false);
      setName('');
      setCategory('');
      setImage(null);
      setPreviewImage('');
      fetchSubcategories();
    } catch (err) {
      console.error('Error creating subcategory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditIsLoading(true);
    const formData = new FormData();
    formData.append('name', editName);
    formData.append('categoryId', editCategory);
    if (editImage) formData.append('image', editImage);

    try {
      await axios.put(`https://canvaback.onrender.com/api/subcategory/${editTarget._id}`, formData);
      setEditModalOpen(false);
      fetchSubcategories();
    } catch (err) {
      console.error('Error updating subcategory:', err);
    } finally {
      setEditIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) return;
    try {
      await axios.delete(`https://canvaback.onrender.com/api/subcategory/${id}`);
      fetchSubcategories();
    } catch (err) {
      console.error('Error deleting subcategory:', err);
    }
  };

  const filteredSubcategories = subcategories.filter((sub) =>
    sub.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} align="center" gutterBottom>
        Subcategory List
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" mb={3}>
        <TextField
          placeholder="Search subcategory"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={() => setIsModalOpen(true)}>
          Add Subcategory
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSubcategories.map((sub) => (
              <TableRow key={sub._id} hover>
                <TableCell>
                  <IconButton onClick={() => { setSelectedImage(sub.imageUrl); setIsImageModalOpen(true); }}>
                    <Avatar src={sub.imageUrl} alt={sub.name} />
                  </IconButton>
                </TableCell>
                <TableCell>{sub.name}</TableCell>
                <TableCell>{sub.categoryId?.name || 'N/A'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button
                      startIcon={<Edit />}
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setEditTarget(sub);
                        setEditName(sub.name);
                        setEditCategory(sub.categoryId?._id || sub.categoryId);
                        setEditPreviewImage(sub.imageUrl);
                        setEditImage(null);
                        setEditModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      startIcon={<Delete />}
                      color="error"
                      variant="contained"
                      size="small"
                      onClick={() => handleDelete(sub._id)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {filteredSubcategories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                  No subcategories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Subcategory</DialogTitle>
        <DialogContent>
          <Stack component="form" onSubmit={handleSubmit} spacing={2} mt={1}>
            <TextField
              label="Subcategory Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
            />
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              displayEmpty
              fullWidth
              required
            >
              <MenuItem value="">
                <em>Select Category</em>
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
            <Button variant="outlined" component="label">
              Upload Image
              <input hidden type="file" accept="image/*" onChange={(e) => { setImage(e.target.files[0]); setPreviewImage(URL.createObjectURL(e.target.files[0])); }} />
            </Button>
            {previewImage && (
              <Avatar src={previewImage} alt="Preview" sx={{ width: 80, height: 80 }} />
            )}
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setIsModalOpen(false)} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </DialogActions>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Subcategory</DialogTitle>
        <DialogContent>
          <Stack component="form" onSubmit={handleEditSubmit} spacing={2} mt={1}>
            <TextField
              label="Subcategory Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
              required
            />
            <Select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              displayEmpty
              fullWidth
              required
            >
              <MenuItem value="">
                <em>Select Category</em>
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
            <Button variant="outlined" component="label">
              Upload Image
              <input hidden type="file" accept="image/*" onChange={(e) => { setEditImage(e.target.files[0]); setEditPreviewImage(URL.createObjectURL(e.target.files[0])); }} />
            </Button>
            {editPreviewImage && (
              <Avatar src={editPreviewImage} alt="Edit Preview" sx={{ width: 80, height: 80 }} />
            )}
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setEditModalOpen(false)} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained" disabled={editIsLoading}>
                {editIsLoading ? 'Updating...' : 'Update'}
              </Button>
            </DialogActions>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} maxWidth="md">
        <DialogContent sx={{ textAlign: 'center' }}>
          <Box component="img" src={selectedImage} alt="Subcategory" sx={{ maxWidth: '100%', maxHeight: '70vh' }} />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default AddSubcategory;
