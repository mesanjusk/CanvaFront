// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ children, allowed = ['institute'] }) {
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    const type = localStorage.getItem('type');
    const userId = localStorage.getItem('institute_id') || localStorage.getItem('user_id'); // adjust for other roles

    if (allowed.includes(type) && userId) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, [allowed]);

  if (authorized === null) return null; // Optional: replace with spinner

  return authorized ? children : <Navigate to="/" replace />;
}
