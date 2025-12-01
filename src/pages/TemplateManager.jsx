import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { fabric } from "fabric";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const LOCAL_KEY = "localTemplates";

const TemplateManager = () => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const newCanvas = new fabric.Canvas("template-canvas", {
      width: 600,
      height: 400,
      backgroundColor: "#fff",
    });
    canvasRef.current = newCanvas;
    setCanvas(newCanvas);

    return () => {
      newCanvas.dispose();
    };
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
    fetchSubcategories();
  }, []);

  useEffect(() => {
    const filtered = subcategories.filter(
      (sc) => sc.categoryId === category || sc.categoryId?.category_uuid === category
    );
    setFilteredSubcategories(filtered);
    setSubcategory("");
  }, [category, subcategories]);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get("/api/template");
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.templates)
        ? res.data.templates
        : [];

      const mapped = data.map((t) => ({ ...t, id: t._id }));
      setTemplates(mapped);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(mapped));
    } catch (err) {
      console.error("Error fetching templates:", err);
      const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
      setTemplates(local);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        "https://canvaback.onrender.com/api/category/with-usage"
      );
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.result)
        ? res.data.result
        : [];

      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const res = await axios.get(
        "https://canvaback.onrender.com/api/subcategory"
      );
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.subcategories)
        ? res.data.subcategories
        : [];

      setSubcategories(data);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      setSubcategories([]);
    }
  };

  const handleSaveTemplate = async () => {
    if (!title || !category || !subcategory || !price || !imageFile) {
      alert("Please fill all fields and select an image.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("subcategory", subcategory);
      formData.append("price", price);
      formData.append("image", imageFile);
      formData.append(
        "canvasJson",
        JSON.stringify(canvasRef.current.toJSON())
      );

      try {
        await axios.post("/api/template/save", formData);
      } catch (e) {
        console.warn("API save failed, storing locally", e);
      }

      const reader = new FileReader();
      reader.onload = () => {
        const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
        const newTemplate = {
          id: Date.now().toString(),
          title,
          category,
          subcategory,
          price,
          image: reader.result,
          canvasJson: canvasRef.current.toJSON(),
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_KEY, JSON.stringify([...local, newTemplate]));
        setTemplates([...local, newTemplate]);
      };
      reader.readAsDataURL(imageFile);
      alert("Template saved!");
      setTitle("");
      setCategory("");
      setSubcategory("");
      setPrice("");
      setImageFile(null);
      fetchTemplates();
    } catch (err) {
      console.error("Error saving template:", err);
      alert("Failed to save template");
    }
    setLoading(false);
  };

  const loadTemplate = async (id) => {
    try {
      const res = await axios.get(`/api/template/${id}`);
      const json = res.data.canvasJson;
      canvas.loadFromJSON(json, () => {
        canvas.renderAll();
      });
    } catch (err) {
      console.error("Error loading template:", err);
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Container>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Template Manager
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }} elevation={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <TextField
                  label="Template Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                />
                <Select
                  value={category}
                  displayEmpty
                  onChange={(e) => setCategory(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Select Category</em>
                  </MenuItem>
                  {Array.isArray(categories) &&
                    categories.map((cat) => (
                      <MenuItem key={cat._id} value={cat.category_uuid}>
                        {cat.name}
                      </MenuItem>
                    ))}
                </Select>
                <Select
                  value={subcategory}
                  displayEmpty
                  onChange={(e) => setSubcategory(e.target.value)}
                  fullWidth
                  disabled={!category}
                >
                  <MenuItem value="">
                    <em>Select Subcategory</em>
                  </MenuItem>
                  {Array.isArray(filteredSubcategories) &&
                    filteredSubcategories.map((sub) => (
                      <MenuItem key={sub._id} value={sub._id}>
                        {sub.name}
                      </MenuItem>
                    ))}
                </Select>
                <TextField
                  label="Price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  fullWidth
                />
                <Button variant="outlined" component="label" fullWidth>
                  {imageFile ? 'Change Image' : 'Upload Image'}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                  />
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveTemplate}
                  disabled={loading}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {loading ? 'Saving...' : 'Save Template'}
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Canvas Preview:
              </Typography>
              <Box sx={{ border: '1px solid', borderColor: 'divider', width: 'fit-content', boxShadow: 1 }}>
                <canvas id="template-canvas" />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Box>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Saved Templates
          </Typography>
          {Array.isArray(templates) && templates.length > 0 ? (
            <Grid container spacing={2}>
              {templates.map((tpl) => (
                <Grid item xs={12} sm={6} md={3} key={tpl.id}>
                  <Card elevation={2}>
                    <CardActionArea onClick={() => loadTemplate(tpl.id)}>
                      <CardContent>
                        <Typography fontWeight={600}>{tpl.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(tpl.createdAt).toLocaleString()}
                        </Typography>
                        {tpl.image && (
                          <Box
                            component="img"
                            src={tpl.image}
                            alt={tpl.title}
                            sx={{ mt: 2, width: '100%', height: 120, objectFit: 'cover', borderRadius: 1 }}
                          />
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary">No templates found.</Typography>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default TemplateManager;
