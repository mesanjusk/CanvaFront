import { Outlet, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Box, Container } from '@mui/material';

import Navbar from '../components/Navbar';
import FloatingButtons from './floatingButton';
import BottomNavBar from '../components/BottomNavBar';

export default function DashboardLayout() {
  const navigate = useNavigate();

  const buttonsList = useMemo(
    () => [
      { onClick: () => navigate('/admin/add-Lead'), label: 'Enquiry' },
      { onClick: () => navigate('/admin/addNewAdd'), label: 'Admission' },
      { onClick: () => navigate('/admin/addReciept'), label: 'Receipt' },
      { onClick: () => navigate('/admin/addPayment'), label: 'Payment' },
    ],
    [navigate]
  );

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column" bgcolor="#f9fafb">
      <Navbar />
      <Box component="main" flex={1} pt={10} pb={8} px={{ xs: 2, sm: 3 }} overflow="auto">
        <Container maxWidth="xl" disableGutters>
          <Outlet />
        </Container>
      </Box>
      <FloatingButtons buttonType="bars" buttonsList={buttonsList} direction="up" />
      <BottomNavBar />
    </Box>
  );
}
