import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardMedia,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
  Paper,
} from '@mui/material';

const API_URL = 'https://canvaback.onrender.com/api/gallary';
const acceptTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const AddGallary = ({ onImageSelect }) => {
  const [gallaries, setGallaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const institute_uuid = useMemo(() => localStorage.getItem('institute_uuid'), []);

  const resetFileState = useCallback(() => {
    if (preview && preview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(preview);
      } catch (err) {
        console.error('Failed to revoke preview URL', err);
      }
    }
    setImageFile(null);
    setPreview(null);
  }, [preview]);

  const closeCreate = () => {
    setIsCreateModalOpen(false);
    resetFileState();
  };

  const closeEdit = () => {
    setIsEditModalOpen(false);
    setEditId(null);
    resetFileState();
  };

  const validateFile = (file) => {
    if (!file) return false;
    if (!acceptTypes.includes(file.type)) {
      toast.error('Unsupported file type');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10 MB)');
      return false;
    }
    return true;
  };

  const handleFileChange = (file) => {
    if (!validateFile(file)) return;
    setImageFile(file);
    if (preview && preview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(preview);
      } catch (err) {
        console.error('Failed to revoke preview URL', err);
      }
    }
    setPreview(URL.createObjectURL(file));
  };

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFileChange(f);
  };
  const onDragOver = (e) => e.preventDefault();

  const fetchGallaries = useCallback(
    async (signal) => {
      if (!institute_uuid) {
        toast.error('Missing institute id');
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/GetGallaryList/${institute_uuid}`, { signal });
        setGallaries(Array.isArray(res.data?.result) ? res.data.result : []);
      } catch (err) {
        if (!axios.isCancel(err)) toast.error('Failed to fetch gallery');
        setGallaries([]);
      } finally {
        setLoading(false);
      }
    },
    [institute_uuid]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchGallaries(controller.signal);
    return () => controller.abort();
  }, [fetchGallaries]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!imageFile) return toast.error('Select an image first');
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('institute_uuid', institute_uuid);
    try {
      await axios.post(API_URL, formData);
      toast.success('Image uploaded');
      closeCreate();
      fetchGallaries();
    } catch {
      toast.error('Upload failed');
    }
  };

  const openEdit = (g) => {
    setEditId(g._id || g.Gallary_uuid);
    resetFileState();
    setPreview(g.image);
    setIsEditModalOpen(true);
  };

  const handleEdit = async () => {
    if (!editId) return;
    if (!imageFile) return toast.error('Choose a new image');
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('institute_uuid', institute_uuid);
    try {
      await axios.put(`${API_URL}/${editId}`, formData);
      toast.success('Image updated');
      closeEdit();
      fetchGallaries();
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success('Deleted');
      fetchGallaries();
    } catch {
      toast.error('Delete failed');
    }
  };

  const useImage = (src) => {
    if (onImageSelect) onImageSelect(src);
    toast.success('Image selected for template');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Gallery
        </Typography>
        <Button variant="contained" color="success" onClick={() => setIsCreateModalOpen(true)}>
          + New Image
        </Button>
      </Stack>

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading images…
        </Typography>
      ) : gallaries.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No images yet. Click <strong>New Image</strong> to upload.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {gallaries.map((g) => {
            const id = g._id || g.Gallary_uuid;
            return (
              <Grid item xs={6} sm={4} md={3} key={id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardActionArea onClick={() => useImage(g.image)} sx={{ flexGrow: 1 }}>
                    <CardMedia
                      component="img"
                      height="220"
                      image={g.image}
                      alt="Gallery"
                      crossOrigin="anonymous"
                      loading="lazy"
                    />
                  </CardActionArea>
                  <CardActions sx={{ justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => useImage(g.image)}>
                        Use
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => openEdit(g)}>
                        Edit
                      </Button>
                    </Stack>
                    <Button size="small" color="error" onClick={() => handleDelete(id)}>
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={isCreateModalOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>Add Image</DialogTitle>
        <Box component="form" onSubmit={handleCreate} noValidate>
          <DialogContent dividers>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                color: 'text.secondary',
                mb: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              Drag & drop or choose a file
            </Box>
            <TextField
              type="file"
              fullWidth
              inputProps={{ accept: acceptTypes.join(',') }}
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
            {preview && (
              <Box
                component="img"
                src={preview}
                alt="Preview"
                sx={{ height: 200, width: '100%', objectFit: 'contain', borderRadius: 2, mt: 2, bgcolor: 'grey.50' }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCreate}>Cancel</Button>
            <Button type="submit" variant="contained">
              Upload
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={isEditModalOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit Image</DialogTitle>
        <DialogContent dividers>
          <TextField
            type="file"
            fullWidth
            inputProps={{ accept: acceptTypes.join(',') }}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
          {preview && (
            <Box
              component="img"
              src={preview}
              alt="Preview"
              sx={{ height: 200, width: '100%', objectFit: 'contain', borderRadius: 2, mt: 2, bgcolor: 'grey.50' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AddGallary;
