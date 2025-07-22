import { useState, useEffect } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useApp } from '../context/AppContext';
import { useBranding } from '../context/BrandingContext';
import { useNavigate } from 'react-router-dom';
import logoutUser from '../utils/logout';
import { FaHeart } from "react-icons/fa";
import axios from 'axios';
import BASE_URL from '../config';
import UserMenu from './navbar/UserMenu';
import RightDrawer from './navbar/RightDrawer';

export default function Navbar({ toggleSidebar }) {
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
  const institute_uuid = localStorage.getItem("institute_uuid");

  const instituteTitle =
    institute?.institute_title || institute?.institute_name || 'Your Institute';

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

          const initAttendanceState = async (userName) => {
        if (!userName) return;

        try {
            const response = await axios.get(`${BASE_URL}/api/attendance/getTodayAttendance/${userName}`);
            const data = response.data;

            if (!data.success || !Array.isArray(data.flow)) {
                setAttendanceState("In");
                return;
            }

            const flow = data.flow;
            const sequence = ["In", "Break", "Start", "Out"];
            const nextStep = sequence.find(step => !flow.includes(step));

            if (flow.includes("Out")) {
                setAttendanceState(null)
            } else {
                setAttendanceState(nextStep || null);
            }
        } catch (error) {
            console.error("Failed to fetch attendance state:", error);
            setAttendanceState("In");
        } finally {
            setShowButtons(true);
        }
    };

    const saveAttendance = async (type) => {
        if (!userName || !type) return;

        try {
            const formattedTime = new Date().toLocaleTimeString();

            const response = await axios.post(`${BASE_URL}/api/attendance/addAttendance/${institute_uuid}`, {
                User_name: userName,
                Type: type,
                Status: "Present",
                Time: formattedTime
            });

            if (response.data.success) {
                alert(`Attendance saved successfully for ${type}`);
                
                await initAttendanceState(userName);
            } else {
                alert("Failed to save attendance.");
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
        }
    };

  const toggleDrawer = () => setIsOpen(!isOpen);

  if (loading) {
    return (
      <header className="bg-white shadow-md px-4 py-3 flex justify-between items-center z-30">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
      </header>
    );
  }

  return (
    <>
      <header className="bg-white  px-4 py-3 flex justify-between items-center z-30 relative">
        <div className="flex items-center gap-3">
          <button className="md:hidden" onClick={toggleSidebar}>
            {/* sidebar icon here if needed */}
          </button>
          <div className="leading-tight">
            <button
              onClick={() => navigate('/dashboard')}
              className="font-bold text-lg text-blue-600 hover:underline focus:outline-none"
            >
              {instituteTitle}
            </button>
            {branding?.tagline && (
              <div className="text-xs text-gray-500">{branding.tagline}</div>
            )}
          </div>
        </div>

        <div className="flex items-center pr-3 gap-4 relative">

          {/* 1. Square 'F' */}
          <button
            className="flex items-center gap-2 focus:outline-none"
            onClick={() => {/* your action here */ }}
          >
            <div className="w-8 h-8 bg-blue-200 flex items-center justify-center rounded text-lg font-bold text-blue-700">
              F
            </div>
          </button>

          {/* 2. Heart Icon */}
          <button
            className="flex items-center gap-2 focus:outline-none"
            onClick={() => {/* your action here */ }}
          >
            <FaHeart className="text-2xl text-red-500" />
          </button>

          {/* 3. User Icon */}
          <button
            className="flex items-center gap-2 focus:outline-none"
            onClick={() => setShowUserMenu((v) => !v)}
          >
            <AccountCircleIcon className="text-3xl text-blue-500" />
          </button>

          {/* Drawer/menu icon */}
          <button onClick={toggleDrawer} className="text-2xl focus:outline-none">
            <MenuIcon />
          </button>

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
        </div>
      </header>

      {/* Right Drawer */}
      {isOpen && (
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
      )}
    </>
  );
}
