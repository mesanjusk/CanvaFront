
import { Box, Container, Typography } from '@mui/material';
import Banner from './Banner';
import AllCategory from '../reports/allCategory.jsx';
import Navbar from '../components/Navbar.jsx';
import BottomNavBar from '../components/BottomNavBar.jsx';
import useMediaQuery from '../hooks/useMediaQuery';


export default function CanvaHome() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100vh' }}>
      <Navbar />
      <Banner />
      <Container sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Design Anything
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select a category to start designing like a pro.
        </Typography>
      </Container>
      <AllCategory />

      {isMobile && <BottomNavBar />}
    </Box>
  );
}
