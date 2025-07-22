import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const PrivateRoute = ({ children }) => {
  const { user, institute, loading } = useApp();
  const location = useLocation();

  // Wait for context to load before deciding
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user || !institute?.institute_uuid) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Allow access
  return children;
};

export default PrivateRoute;
