import React, { useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BASE_URL from "../config";
import { useApp } from "../context/AppContext";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { institute } = useApp();
  const themeColor = institute?.theme_color || "#5b5b5b";

  const [centerCode, setCenterCode] = useState("");
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [serverOtp, setServerOtp] = useState("");
  const [userId, setUserId] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!/^[0-9]{10}$/.test(mobile)) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setServerOtp(generatedOtp);

    const message = `Your OTP for Institute registration is ${generatedOtp}`;

    try {
      const res = await axios.post(`${BASE_URL}/api/institute/send-message`, {
        mobile: `91${mobile}`,
        message,
        type: "forgot",
        userName: centerCode,
      });

      if (res.data.success && res.data.userId) {
        setUserId(res.data.userId);
        setOtpSent(true);
        toast.success("OTP sent to your mobile");
      } else {
        toast.error("User ID missing in response");
      }
    } catch (err) {
      console.error("OTP Send Error:", err);
      toast.error("Error sending OTP");
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();

    if (!otp || otp !== serverOtp) {
      toast.error("Invalid OTP");
      return;
    }

    toast.success("OTP verified. Redirecting...");
    navigate(`/reset-password/${userId}`);
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
        <Typography
          variant="h5"
          fontWeight={700}
          textAlign="center"
          mb={3}
          sx={{ color: themeColor }}
        >
          Forgot Password
        </Typography>

        <Stack
          component="form"
          spacing={2}
          onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
        >
          <TextField
            label="Center Code"
            value={centerCode}
            onChange={(e) => setCenterCode(e.target.value)}
            required
            size="medium"
            InputProps={{
              sx: { boxShadow: `0 0 0 1.5px ${themeColor} inset` },
            }}
          />

          <TextField
            label="Registered Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            inputProps={{ pattern: "[0-9]{10}", maxLength: 10, inputMode: "numeric" }}
            required
            size="medium"
            InputProps={{
              sx: { boxShadow: `0 0 0 1.5px ${themeColor} inset` },
            }}
          />

          {otpSent && (
            <TextField
              label="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputProps={{ maxLength: 6 }}
              required
              size="medium"
              InputProps={{
                sx: { boxShadow: `0 0 0 1.5px ${themeColor} inset` },
              }}
            />
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            sx={{
              backgroundColor: themeColor,
              "&:hover": { opacity: 0.9, backgroundColor: themeColor },
            }}
          >
            {otpSent ? "Verify OTP" : "Send OTP"}
          </Button>
        </Stack>

        <Stack direction="row" justifyContent="center" spacing={1} mt={3}>
          <Typography variant="body2" color="text.secondary">
            Remembered your password?
          </Typography>
          <Button variant="text" size="small" onClick={() => navigate("/")}>
            Login
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ForgotPassword;
