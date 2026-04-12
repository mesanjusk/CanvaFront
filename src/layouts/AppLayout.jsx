import { AppBar, Box, Drawer, IconButton, List, ListItemButton, ListItemText, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const drawerWidth = 250;

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const menu = useMemo(() => {
    const items = [{ label: 'Dashboard', path: '/app' }];
    if (user?.role === 'super_admin') items.push({ label: 'Schools', path: '/app/schools' });
    if (['super_admin', 'school_admin', 'principal'].includes(user?.role)) items.push({ label: 'Users', path: '/app/users' });
    if (user?.role !== 'student') items.push({ label: 'Students', path: '/app/students' });
    if (user?.role !== 'student') items.push({ label: 'Templates', path: '/app/templates' });
    if (user?.role !== 'student') items.push({ label: 'ID Cards', path: '/app/id-cards' });
    if (['super_admin', 'school_admin', 'principal', 'teacher'].includes(user?.role)) items.push({ label: 'Edit Requests', path: '/app/edit-requests' });
    return items;
  }, [user?.role]);

  const drawer = (
    <Box sx={{ width: drawerWidth }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">School Platform</Typography>
        <Typography variant="body2" color="text.secondary">{user?.schoolName || 'Platform'}</Typography>
      </Box>
      <List>
        {menu.map((item) => (
          <ListItemButton key={item.path} selected={location.pathname === item.path} onClick={() => { navigate(item.path); setOpen(false); }}>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: 1201 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setOpen(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">{user?.name}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>{user?.role?.replace('_', ' ')}</Typography>
          </Box>
          <IconButton color="inherit" onClick={() => { logout(); navigate('/'); }}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer variant="temporary" open={open} onClose={() => setOpen(false)}>{drawer}</Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
