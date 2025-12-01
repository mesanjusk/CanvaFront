import React from 'react';
import { Box, Card, CardActionArea, CardContent, CardMedia, Container, Grid, Typography } from '@mui/material';

const templates = [
  { id: 1, title: 'Modern Flyer', image: 'https://via.placeholder.com/300x200?text=Flyer' },
  { id: 2, title: 'Business Card', image: 'https://via.placeholder.com/300x200?text=Business+Card' },
  { id: 3, title: 'Poster', image: 'https://via.placeholder.com/300x200?text=Poster' },
  { id: 4, title: 'Social Media', image: 'https://via.placeholder.com/300x200?text=Social+Media' },
];

const TemplateGallery = ({ onSelect }) => {
  return (
    <Box sx={{ py: 4 }}>
      <Container>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Choose a Template
        </Typography>
        <Grid container spacing={2}>
          {templates.map((tpl) => (
            <Grid item xs={12} sm={6} md={3} key={tpl.id}>
              <Card>
                <CardActionArea onClick={() => onSelect?.(tpl)}>
                  <CardMedia component="img" height={140} image={tpl.image} alt={tpl.title} />
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {tpl.title}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default TemplateGallery;
