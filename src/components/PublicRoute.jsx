import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const PublicRoute = ({ children }) => {
  const { user, institute, loading } = useApp();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  if (user && institute?.institute_uuid) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
