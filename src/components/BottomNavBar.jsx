import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const value = React.useMemo(() => {
    if (location.pathname.startsWith('/home')) return 'home';
    if (location.pathname.startsWith('/CanvasEditor')) return 'create';
    if (location.pathname.includes('Gallary')) return 'profile';
    return null;
  }, [location.pathname]);

  return (
    <Paper
      elevation={8}
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200 }}
      square
    >
      <BottomNavigation showLabels value={value} sx={{ height: 56 }}>
        <BottomNavigationAction
          label="Home"
          value="home"
          icon={<HomeIcon />}
          onClick={() => navigate('/home')}
        />
        <BottomNavigationAction label="Explore" value="explore" icon={<SearchIcon />} />
        <BottomNavigationAction
          label="Create"
          value="create"
          icon={<AddCircleIcon color="primary" />}
          onClick={() => navigate('/CanvasEditor')}
        />
        <BottomNavigationAction label="Alerts" value="alerts" icon={<NotificationsIcon />} />
        <BottomNavigationAction
          label="Profile"
          value="profile"
          icon={<AccountCircleIcon />}
          onClick={() => navigate('/dashboard/Gallary')}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNavBar;
