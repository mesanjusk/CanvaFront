import React from 'react';
import { Button } from '@mui/material';
import { formatDisplayDate } from '../../utils/dateUtils';

const AttendanceButton = ({
  showButtons,
  attendanceState,
  userName,
  saveAttendance,
  setShowButtons,
}) => {
  if (!showButtons || !attendanceState) return null;
  return (
    <Button
      fullWidth
      variant="contained"
      color="success"
      size="small"
      disabled={!showButtons}
      onClick={async () => {
        setShowButtons(false);
        await saveAttendance(attendanceState);
        setShowButtons(true);
      }}
      sx={{ fontWeight: 700, textTransform: 'none' }}
    >
      {showButtons
        ? `${userName} ${attendanceState} - ${formatDisplayDate(new Date())}`
        : 'Saving...'}
    </Button>
  );
};

export default AttendanceButton;
