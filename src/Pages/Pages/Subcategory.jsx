import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Navbar from '../components/Navbar';
import BottomNavBar from '../components/BottomNavBar.jsx';
import useMediaQuery from '../hooks/useMediaQuery';

export default function Subcategory() {
  const { categoryId } = useParams();
  const id = categoryId;

  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [subcategories, setSubcategories] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [originalTemplates, setOriginalTemplates] = useState([]);

  useEffect(() => {
    const fetchTemplatesByCategoryId = async () => {
      try {
        const [templatesRes, categoriesRes] = await Promise.all([
          axios.get('https://canvaback.onrender.com/api/template'),
          axios.get('https://canvaback.onrender.com/api/category'),
        ]);

        const templates = templatesRes.data;
        const categories = categoriesRes.data;

        const matchedCategory = categories.find((cat) => cat.category_uuid === id);
        if (!matchedCategory) {
          console.warn('No category found with ID:', id);
          setOriginalTemplates([]);
          setAllTemplates([]);
          setSelectedCategoryName('');
          return;
        }

        setSelectedCategoryName(matchedCategory.name);

        const filtered = templates.filter(
          (temp) => temp.category === matchedCategory.category_uuid || temp.category === matchedCategory._id
        );
        setOriginalTemplates(filtered);
        setAllTemplates(filtered);
      } catch (err) {
        console.error('Error fetching templates or categories:', err);
      }
    };

    if (id) {
      fetchTemplatesByCategoryId();
    }
  }, [id]);

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const response = await axios.get('https://canvaback.onrender.com/api/subcategory');
        const matched = response.data.filter((sub) => {
          const catId = sub.categoryId?._id || sub.categoryId?.$oid || sub.categoryId;
          return catId?.toString() === id?.toString();
        });
        setSubcategories(matched);
      } catch (err) {
        console.error('Error fetching subcategories:', err);
      }
    };
    fetchSubcategories();
  }, [id]);

  const handleClick = async (item) => {
    const subcategoryId = item._id;
    navigate(`/editor/${subcategoryId}`);
  };

  return (
    <>
      <Navbar />
      <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100vh' }}>
        <Container sx={{ pt: 3, pb: 6 }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={3}>
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{ alignSelf: 'flex-start' }}
            >
              Back
            </Button>
            <Typography variant="h6" fontWeight={700}>
              {selectedCategoryName}
            </Typography>
          </Stack>

          <Box sx={{ overflowX: 'auto', pb: 2 }}>
            <Stack direction="row" spacing={3} sx={{ minWidth: '100%', px: 0.5 }}>
              {subcategories.map((item) => (
                <Stack key={item._id} spacing={1} alignItems="center">
                  <CardActionArea
                    onClick={() => {
                      const filteredBySub = originalTemplates.filter(
                        (temp) =>
                          temp.subcategory?.trim().toLowerCase() === item.name?.trim().toLowerCase()
                      );
                      setAllTemplates(filteredBySub);
                    }}
                    sx={{ borderRadius: '50%', width: 88, height: 88 }}
                    aria-label={`Filter by ${item.name}`}
                  >
                    {item.imageUrl ? (
                      <Avatar
                        src={item.imageUrl}
                        alt={item.name || 'Subcategory'}
                        sx={{ width: 88, height: 88, border: '2px solid', borderColor: 'divider' }}
                        imgProps={{ loading: 'lazy' }}
                      />
                    ) : (
                      <Avatar
                        sx={{ width: 88, height: 88, bgcolor: 'grey.200', color: 'text.secondary', border: '2px solid', borderColor: 'divider' }}
                      >
                        No Image
                      </Avatar>
                    )}
                  </CardActionArea>
                  <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 96, textAlign: 'center' }}>
                    {item.name}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {allTemplates.length > 0 ? (
            <Grid container spacing={2} sx={{ pt: 2 }}>
              {allTemplates.map((temp) => (
                <Grid item xs={6} sm={4} md={2} key={temp._id}>
                  <Card
                    elevation={2}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': { transform: 'scale(1.02)', boxShadow: 6 },
                    }}
                  >
                    <CardActionArea onClick={() => handleClick(temp)} sx={{ height: '100%' }}>
                      <Box sx={{ position: 'relative', pt: '100%', overflow: 'hidden' }}>
                        <Box
                          component="img"
                          src={temp.image}
                          alt={temp.title || 'Template'}
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          loading="lazy"
                        />
                      </Box>
                      <CardContent>
                        <Typography variant="body2" fontWeight={600} textAlign="center" noWrap>
                          {temp.title}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ pt: 4 }}>
              No templates found in “{selectedCategoryName || 'Selected Category'}”.
            </Typography>
          )}
        </Container>
      </Box>

      {isMobile && <BottomNavBar />}
    </>
  );
}
