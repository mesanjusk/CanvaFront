// src/pages/Signup.jsx
import React, { useState, useEffect } from 'react';
import { useBranding } from '../context/BrandingContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import BASE_URL from '../config';
import { storeUserData, storeInstituteData } from '../utils/storageUtils';

const Signup = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [form, setForm] = useState({
    institute_title: '',
    institute_type: '',
    center_code: '',
    institute_call_number: '',
    center_head_name: '',
    theme_color: '#5b5b5b',
  });

  const themeColor = form.theme_color || '#5b5b5b';

  const [orgTypes, setOrgTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [serverOtp, setServerOtp] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);

  useEffect(() => {
    axios
      .get(`https://canvaback.onrender.com/api/org-categories`)
      .then((res) => {
        setOrgTypes(res.data);
        setLoadingTypes(false);
      })
      .catch((err) => {
        console.error('Failed to fetch institute types:', err);
        toast.error('Failed to load institute types');
        setLoadingTypes(false);
      });
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!/^[0-9]{10}$/.test(form.institute_call_number)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }

    const res = await axios.post(`https://canvaback.onrender.com/api/institute/send-message`, {
      mobile: `91${form.institute_call_number}`,
      type: 'signup',
      userName: form.center_head_name,
    });

    if (res.data.success) {
      setServerOtp(String(res.data.otp));
      setOtpSent(true);
      toast.success('OTP sent to your mobile');
    } else {
      toast.error('Failed to send OTP');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim() !== String(serverOtp)) {
      toast.error('Invalid OTP');
      return;
    }

    const formData = new FormData();
    formData.append('institute_title', form.institute_title);
    formData.append('institute_type', form.institute_type);
    formData.append('center_code', form.center_code);
    formData.append('institute_call_number', form.institute_call_number);
    formData.append('center_head_name', form.center_head_name);
    formData.append('theme_color', form.theme_color || '#5b5b5b');
    formData.append('plan_type', 'trial');
    formData.append('logo', logoFile);
    formData.append('signature', signatureFile);
    try {
      // Use center_code as passwordHash for admin user
      const res = await axios.post(`https://canvaback.onrender.com/api/institute/signup`, formData);
      const data = res.data;
      if (data.message === 'exist') {
        toast.error('Center code or email already registered');
      } else if (data.message === 'duplicate_call_number') {
        toast.error('Mobile number already registered');
      } else if (data.message === 'success') {
        toast.success('Signup successful. You are now on a 14-day trial.');

        storeUserData({
          id: data.owner_id,
          name: form.center_head_name,
          role: 'admin',
          username: form.center_code,
        });
        storeInstituteData({
          institute_uuid: data.institute_uuid,
          institute_name: data.institute_title,
          institute_id: data.institute_id,
          theme_color: data.theme_color || '#45818e',
        });

        if (data.trialExpiresAt) {
          localStorage.setItem('trialExpiresAt', data.trialExpiresAt);
        }

        document.documentElement.style.setProperty('--theme-color', data.theme_color || '#45818e');

        // --- Account Creation Logic (optional, can remove if not needed) ---
        try {
          const groupRes = await axios.get(`${BASE_URL}/api/accountgroup/GetAccountgroupList`);
          const accountGroup = groupRes.data.result.find((g) => g.Account_group === 'ACCOUNT');
          const accountBank = groupRes.data.result.find((g) => g.Account_group === 'Bank');

          if (accountGroup) {
            await axios.post(`${BASE_URL}/api/account/addAccount`, {
              Account_name: form.center_head_name,
              Mobile_number: form.institute_call_number,
              Account_group: accountGroup.Account_group_uuid,
              institute_uuid: data.institute_uuid,
            });
            toast.success('Institute account created');
          } else {
            toast.error('ACCOUNT group not found');
          }

          if (accountGroup) {
            await axios.post(`${BASE_URL}/api/account/addAccount`, {
              Account_name: 'Fees Receivable',
              Mobile_number: form.institute_call_number,
              Account_group: accountGroup.Account_group_uuid,
              institute_uuid: data.institute_uuid,
            });
            toast.success('Fees Receivable account created');
          } else {
            toast.error('ACCOUNT group not found');
          }
          if (accountBank) {
            await axios.post(`${BASE_URL}/api/account/addAccount`, {
              Account_name: 'Bank',
              Mobile_number: form.institute_call_number,
              Account_group: accountBank.Account_group_uuid,
              institute_uuid: data.institute_uuid,
            });
            toast.success('Bank account created');
          } else {
            toast.error('ACCOUNT group not found');
          }
          if (accountBank) {
            await axios.post(`${BASE_URL}/api/account/addAccount`, {
              Account_name: 'Cash',
              Mobile_number: form.institute_call_number,
              Account_group: accountBank.Account_group_uuid,
              institute_uuid: data.institute_uuid,
            });
            toast.success('Cash account created');
          } else {
            toast.error('ACCOUNT group not found');
          }
        } catch (err) {
          console.error('Error creating institute account:', err);
          toast.error('Failed to create institute account');
        }
        // ---------------------------------------------------------------

        if (window.updateAppContext) {
          window.updateAppContext({
            user: JSON.parse(localStorage.getItem('user')),
            institute: JSON.parse(localStorage.getItem('institute')),
          });
        }

        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        toast.error('Unexpected server response');
      }
    } catch (err) {
      console.error('Signup Error:', err);
      toast.error(err.response?.data?.message || 'Server error during signup');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: { xs: 4, sm: 6 },
        backgroundColor: '#f3f4f6',
      }}
    >
      <Toaster position="top-center" />
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
          <Stack spacing={1.5} alignItems="center" textAlign="center">
            <Box
              component="img"
              src="/pwa-512x512.png"
              alt="Logo"
              onError={(e) => {
                e.target.src = '/pwa-512x512.png';
              }}
              sx={{ width: 80, height: 80, objectFit: 'contain' }}
            />
            <Typography variant="h5" fontWeight={700} sx={{ color: themeColor }}>
              Register Institute
            </Typography>
            {branding?.tagline && (
              <Typography variant="body2" color="text.secondary">
                {branding.tagline}
              </Typography>
            )}
          </Stack>

          <Box component="form" onSubmit={otpSent ? handleSignup : handleSendOtp} sx={{ mt: 3 }}>
            <Stack spacing={2.5}>
              <TextField
                label="Institute Name"
                value={form.institute_title}
                onChange={handleChange('institute_title')}
                required
                fullWidth
              />

              <FormControl fullWidth required>
                <InputLabel>Institute Type</InputLabel>
                <Select
                  value={form.institute_type}
                  label="Institute Type"
                  onChange={handleChange('institute_type')}
                  disabled={loadingTypes}
                >
                  <MenuItem value="">
                    <em>Select Institute Type</em>
                  </MenuItem>
                  {loadingTypes ? (
                    <MenuItem disabled>Loading...</MenuItem>
                  ) : (
                    orgTypes.map((type) => (
                      <MenuItem key={type._id} value={type.category}>
                        {type.category}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Center Code"
                  value={form.center_code}
                  onChange={handleChange('center_code')}
                  required
                  fullWidth
                />
                <TextField
                  label="Theme Color"
                  type="color"
                  value={form.theme_color}
                  onChange={handleChange('theme_color')}
                  fullWidth
                  inputProps={{ style: { padding: 0, height: 40 } }}
                />
              </Stack>

              <TextField
                label="Mobile Number"
                value={form.institute_call_number}
                onChange={handleChange('institute_call_number')}
                placeholder="Enter 10 digit mobile number"
                inputProps={{ maxLength: 10, pattern: '[0-9]{10}' }}
                required
                fullWidth
              />

              <TextField
                label="Center Head Name"
                value={form.center_head_name}
                onChange={handleChange('center_head_name')}
                required
                fullWidth
              />

              {otpSent && (
                <TextField
                  label="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  inputProps={{ maxLength: 6 }}
                  required
                  fullWidth
                />
              )}

              <Stack spacing={1}>
                <Button variant="outlined" component="label">
                  Upload Logo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files[0])}
                    required
                  />
                </Button>
                {logoFile && (
                  <Typography variant="body2" color="text.secondary">
                    Selected: {logoFile.name}
                  </Typography>
                )}
              </Stack>

              <Stack spacing={1}>
                <Button variant="outlined" component="label">
                  Upload Signature
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => setSignatureFile(e.target.files[0])}
                    required
                  />
                </Button>
                {signatureFile && (
                  <Typography variant="body2" color="text.secondary">
                    Selected: {signatureFile.name}
                  </Typography>
                )}
              </Stack>

              <Button
                type="submit"
                variant="contained"
                sx={{
                  py: 1.2,
                  backgroundColor: themeColor,
                  '&:hover': { backgroundColor: themeColor },
                }}
              >
                {otpSent ? 'Verify OTP & Register' : 'Send OTP'}
              </Button>
            </Stack>
          </Box>

          <Stack direction="row" justifyContent="center" spacing={1.2} sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?
            </Typography>
            <Button onClick={() => navigate('/')} size="small">
              Login
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;
