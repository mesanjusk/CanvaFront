import React from "react";
import { Home, Search, Plus, Bell, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BottomNavBar = () => {
  const navigate = useNavigate();
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t shadow-md z-40 flex justify-around items-center"
    >
      <button className="flex flex-col items-center text-gray-600 text-xs" onClick={() => navigate("/home")}>
        <Home size={24} />
        <span>Home</span>
      </button>
      <button className="flex flex-col items-center text-gray-600 text-xs">
        <Search size={24} />
        <span>Explore</span>
      </button>
      <button
        onClick={() => navigate("/CanvasEditor")}
        className="relative flex flex-col items-center text-xs text-white"
      >
        <div className="w-12 h-12 -mt-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
          <Plus size={28} />
        </div>
        <span className="text-gray-600 mt-1">Create</span>
      </button>
      <button className="flex flex-col items-center text-gray-600 text-xs">
        <Bell size={24} />
        <span>Alerts</span>
      </button>
      <button className="flex flex-col items-center text-gray-600 text-xs" onClick={() => navigate("/dashboard/Gallary")}>
        <User size={24} />
        <span>Profile</span>
      </button>
    </nav>
  );
};

export default BottomNavBar;
