import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useApp } from "../context/AppContext";

const PrivateRoute = ({ children }) => {
  const { user, institute, loading } = useApp();
  const location = useLocation();

  // Wait for context to load before deciding
  if (loading) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={20} />
          <Typography color="text.secondary" variant="body2">
            Loading...
          </Typography>
        </Stack>
      </Box>
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
