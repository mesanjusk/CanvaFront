import { AppBar, Avatar, Box, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { Outlet } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import BottomNav from '../components/BottomNav';

export default function AppShell() {
  const { user, settings, logout } = useAppContext();
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 9 }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
            <Avatar src={settings?.logoUrl || ''}>{(settings?.schoolName || 'S')[0]}</Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{settings?.schoolName || 'School ERP'}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.name || 'User'}</Typography>
            </Box>
          </Stack>
          <IconButton onClick={logout}><LogoutRoundedIcon /></IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
        <Outlet />
      </Box>
      <BottomNav />
    </Box>
  );
}
