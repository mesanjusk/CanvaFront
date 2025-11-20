import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';

export default function AllCategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('https://canvaback.onrender.com/api/category');
        setCategories(response.data.categories || response.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const skeletons = Array.from({ length: 9 });

  return (
    <Box component="section" sx={{ py: 4 }}>
      <Container>
        {loading ? (
          <Grid container spacing={2} columns={{ xs: 3, sm: 6, md: 9 }}>
            {skeletons.map((_, i) => (
              <Grid item xs={1} key={i}>
                <Card sx={{ p: 2 }}>
                  <Skeleton variant="circular" width={64} height={64} sx={{ mx: 'auto', mb: 1 }} />
                  <Skeleton variant="text" width="80%" sx={{ mx: 'auto' }} />
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : categories.length === 0 ? (
          <Typography color="text.secondary" align="center">
            No categories found.
          </Typography>
        ) : (
          <Grid container spacing={2} columns={{ xs: 3, sm: 6, md: 9 }}>
            {categories.map((item) => (
              <Grid item xs={1} key={item._id}>
                <Card elevation={1}>
                  <CardActionArea
                    onClick={() => navigate(`/subcategory/${item.category_uuid}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/subcategory/${item.category_uuid}`);
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Stack spacing={1} alignItems="center">
                        {item.imageUrl?.length ? (
                          <Avatar
                            src={item.imageUrl}
                            alt={item.name || 'Category'}
                            sx={{ width: 80, height: 80, bgcolor: 'grey.200' }}
                            imgProps={{ loading: 'lazy' }}
                          />
                        ) : (
                          <Avatar sx={{ width: 80, height: 80, bgcolor: 'grey.200', color: 'text.secondary' }}>
                            No Image
                          </Avatar>
                        )}
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {item.name}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
