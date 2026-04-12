import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Container, Skeleton } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

function ShimmerSlide() {
  return <Skeleton variant="rounded" height={260} sx={{ width: '100%', borderRadius: 2 }} />;
}

export default function Banner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await axios.get('https://idbackend-rf1u.onrender.com/api/banners');
        setBanners(response.data);
      } catch (err) {
        console.error('Error fetching banners:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  return (
    <Box component="section" sx={{ py: 4 }}>
      <Container disableGutters>
        {loading ? (
          <Box px={2}>
            <ShimmerSlide />
          </Box>
        ) : (
          <Swiper
            spaceBetween={10}
            slidesPerView={1}
            loop
            autoplay={{ delay: 3000 }}
            pagination={{ clickable: true }}
            modules={[Autoplay, Pagination]}
            style={{ width: '100%' }}
          >
            {banners.map((img, idx) => (
              <SwiperSlide key={idx}>
                <Box
                  sx={{
                    width: '100%',
                    height: { xs: 224, md: 320 },
                    bgcolor: 'grey.200',
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    component="img"
                    src={img.imageUrl}
                    alt={img.altText || `Banner image ${idx + 1}`}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/fallback-image.jpg';
                    }}
                  />
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </Container>
    </Box>
  );
}
