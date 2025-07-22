import React from 'react';
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
  onClose
}) => (
  <>
    <div className="fixed inset-0 z-40" onClick={onClose} />
    <div className="absolute top-12 right-0 w-80 bg-white rounded-lg z-50 p-4">
      <div className="mb-2">
        <div className="font-semibold text-gray-800">{username}</div>
        {role && <div className="text-xs text-gray-500 capitalize">{role}</div>}
      </div>
      <AttendanceButton
        showButtons={showButtons}
        attendanceState={attendanceState}
        userName={userName}
        saveAttendance={saveAttendance}
        setShowButtons={setShowButtons}
      />
      <button
        onClick={logoutUser}
        className="w-full text-left px-4 py-2 rounded bg-red-50 hover:bg-red-100 text-red-600 font-medium mt-2"
      >
        Logout
      </button>
    </div>
  </>
);

export default UserMenu;
