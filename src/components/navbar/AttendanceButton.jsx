import React from 'react';
import { formatDisplayDate } from '../../utils/dateUtils';

const AttendanceButton = ({
  showButtons,
  attendanceState,
  userName,
  saveAttendance,
  setShowButtons
}) => {
  if (!showButtons || !attendanceState) return null;
  return (
    <div className="w-full">
      <button
        onClick={async () => {
          setShowButtons(false);
          await saveAttendance(attendanceState);
          setShowButtons(true);
        }}
        disabled={!showButtons}
        className={`w-full text-white font-semibold py-1.5 px-3 text-sm rounded-md transition-all ${
          showButtons ? 'bg-green-500 hover:bg-green-600 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {showButtons
          ? `${userName} ${attendanceState} - ${formatDisplayDate(new Date())}`
          : 'Saving...'}
      </button>
    </div>
  );
};

export default AttendanceButton;
