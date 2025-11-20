import { useState, useEffect, useMemo } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  Skeleton,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { useApp } from '../context/AppContext';
import { useBranding } from '../context/BrandingContext';
import logoutUser from '../utils/logout';
import BASE_URL from '../config';
import UserMenu from './navbar/UserMenu';
import RightDrawer from './navbar/RightDrawer';

export default function Navbar() {
  const { user, institute, loading } = useApp();
  const { branding } = useBranding();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showMasterItems, setShowMasterItems] = useState(false);
  const [showSettingsItems, setShowSettingsItems] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [attendanceState, setAttendanceState] = useState(null);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const institute_uuid = localStorage.getItem('institute_uuid');

  const instituteTitle = useMemo(
    () => institute?.institute_title || institute?.institute_name || 'Your Institute',
    [institute]
  );

  const username = user?.name || 'User';
  const role = user?.role || '';

  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
    }
  }, [user]);

  useEffect(() => {
    if (userName) {
      initAttendanceState(userName);
    }
  }, [userName]);

  const initAttendanceState = async (currentUserName) => {
    if (!currentUserName) return;

    try {
      const response = await axios.get(
        `${BASE_URL}/api/attendance/getTodayAttendance/${currentUserName}`
      );
      const data = response.data;

      if (!data.success || !Array.isArray(data.flow)) {
        setAttendanceState('In');
        return;
      }

      const flow = data.flow;
      const sequence = ['In', 'Break', 'Start', 'Out'];
      const nextStep = sequence.find((step) => !flow.includes(step));

      if (flow.includes('Out')) {
        setAttendanceState(null);
      } else {
        setAttendanceState(nextStep || null);
      }
    } catch (error) {
      console.error('Failed to fetch attendance state:', error);
      setAttendanceState('In');
    } finally {
      setShowButtons(true);
    }
  };

  const saveAttendance = async (type) => {
    if (!userName || !type) return;

    try {
      const formattedTime = new Date().toLocaleTimeString();

      const response = await axios.post(
        `${BASE_URL}/api/attendance/addAttendance/${institute_uuid}`,
        {
          User_name: userName,
          Type: type,
          Status: 'Present',
          Time: formattedTime,
        }
      );

      if (response.data.success) {
        alert(`Attendance saved successfully for ${type}`);

        await initAttendanceState(userName);
      } else {
        alert('Failed to save attendance.');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  const toggleDrawer = () => setIsOpen((prev) => !prev);

  if (loading) {
    return (
      <AppBar position="fixed" elevation={2} color="default">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Skeleton variant="text" width={160} height={32} />
          <Skeleton variant="circular" width={40} height={40} />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <>
      <AppBar position="fixed" elevation={2} color="default">
        <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={branding?.logo || '/pwa-512x512.png'}
              alt={branding?.institute || 'Logo'}
              sx={{ width: 40, height: 40, border: '1px solid', borderColor: 'divider' }}
            />
            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
                color="primary"
                onClick={() => navigate('/home')}
                sx={{ cursor: 'pointer', lineHeight: 1.2 }}
              >
                {instituteTitle}
              </Typography>
              {branding?.tagline && (
                <Typography variant="caption" color="text.secondary">
                  {branding.tagline}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" pr={1} position="relative">
            <IconButton
              color="primary"
              size="large"
              onClick={() => setShowUserMenu((v) => !v)}
              aria-label="Open user menu"
            >
              <AccountCircleIcon fontSize="inherit" />
            </IconButton>
            <IconButton
              size="large"
              onClick={toggleDrawer}
              aria-label="Open navigation drawer"
              sx={{ color: theme.palette.text.primary }}
            >
              <MenuIcon />
            </IconButton>

            {showUserMenu && (
              <UserMenu
                username={username}
                role={role}
                showButtons={showButtons}
                attendanceState={attendanceState}
                userName={userName}
                saveAttendance={saveAttendance}
                setShowButtons={setShowButtons}
                logoutUser={logoutUser}
                onClose={() => setShowUserMenu(false)}
              />
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <RightDrawer
        isOpen={isOpen}
        showMasterItems={showMasterItems}
        setShowMasterItems={setShowMasterItems}
        showSettingsItems={showSettingsItems}
        setShowSettingsItems={setShowSettingsItems}
        navigate={navigate}
        user={user}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
