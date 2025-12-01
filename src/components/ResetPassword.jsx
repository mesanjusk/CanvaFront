import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import BASE_URL from "../config";
import { getThemeColor } from "../utils/storageUtils";

const ResetPassword = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const themeColor = getThemeColor();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/institute/reset-password/${id}`, {
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (res.data.message === "reset_success") {
        toast.success("Password reset successful. Please login.");
        navigate("/");
      } else {
        toast.error(res.data.message || "Reset failed");
      }
    } catch (err) {
      toast.error("Reset error");
      console.error(err);
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={2}
      sx={{ backgroundColor: themeColor }}
    >
      <Toaster position="top-center" />
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
        <Stack spacing={3} component="form" onSubmit={handleReset}>
          <Typography variant="h5" fontWeight={700} textAlign="center" sx={{ color: themeColor }}>
            Reset Password
          </Typography>
          <TextField
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            label="Old Password"
            required
            InputProps={{ sx: { boxShadow: `0 0 0 1.5px ${themeColor} inset` } }}
          />
          <TextField
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            label="New Password"
            required
            InputProps={{ sx: { boxShadow: `0 0 0 1.5px ${themeColor} inset` } }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            sx={{
              backgroundColor: themeColor,
              "&:hover": { backgroundColor: themeColor, opacity: 0.9 },
            }}
          >
            Reset Password
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ResetPassword;
