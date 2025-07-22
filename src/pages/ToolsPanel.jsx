import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const ToolsPanel = () => {
  const { user } = useApp();
  const navigate = useNavigate();

  if (!user || user.role !== 'super_admin') {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Superadmin Tools</h1>
      <p className="text-gray-600">Future tools will appear here.</p>
      <button onClick={() => navigate(-1)} className="text-blue-600 underline">
        Go Back
      </button>
    </div>
  );
};

export default ToolsPanel;
