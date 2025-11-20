import React from 'react';
import { Box, Divider, Paper, Typography, Button } from '@mui/material';
import AttendanceButton from './AttendanceButton';

const UserMenu = ({
  username,
  role,
  showButtons,
  attendanceState,
  userName,
  saveAttendance,
  setShowButtons,
  logoutUser,
  onClose,
}) => (
  <>
    <Box position="fixed" zIndex={40} onClick={onClose} sx={{ inset: 0 }} />
    <Paper
      elevation={6}
      sx={{
        position: 'absolute',
        top: 56,
        right: 8,
        width: 320,
        zIndex: 50,
        p: 2,
        borderRadius: 2,
      }}
    >
      <Box mb={1.5}>
        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
          {username}
        </Typography>
        {role && (
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {role}
          </Typography>
        )}
      </Box>
      <AttendanceButton
        showButtons={showButtons}
        attendanceState={attendanceState}
        userName={userName}
        saveAttendance={saveAttendance}
        setShowButtons={setShowButtons}
      />
      <Divider sx={{ my: 1.5 }} />
      <Button
        fullWidth
        variant="outlined"
        color="error"
        onClick={logoutUser}
        sx={{ fontWeight: 600, textTransform: 'none' }}
      >
        Logout
      </Button>
    </Paper>
  </>
);

export default UserMenu;
