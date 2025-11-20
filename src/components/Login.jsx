import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { getInstituteId } from '../utils/instituteUtils';
import { fetchBranding } from '../utils/brandingUtils';
import { fetchAndStoreMasters } from '../utils/masterUtils';
import { storeUserData, storeInstituteData } from '../utils/storageUtils';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [branding, setBranding] = useState(JSON.parse(localStorage.getItem('branding')) || null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const accentColor = branding?.theme?.color || '#5b5b5b';

  useEffect(() => {
    inputRef.current?.focus();
    if (branding?.theme?.color) {
      document.documentElement.style.setProperty('--theme-color', branding.theme.color);
    }
    const user = localStorage.getItem('user');
    const insti = localStorage.getItem('institute');
    if (user && insti) {
      navigate('/home');
    }
  }, [navigate, branding]);

  // ✅ Auto-login if token present in URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) return;

    localStorage.setItem('authToken', token);

    // Verify token with backend
    axios
      .post(`https://canvaback.onrender.com/api/auth/verify`, { token })
      .then(async (res) => {
        if (res.data.success) {
          const user = res.data.user;
          const institute = res.data.institute;

          // Store data in same format your app expects
          storeUserData({
            id: user.id,
            name: user.name,
            role: user.role,
            username: user.username,
          });
          storeInstituteData({
            institute_uuid: institute.institute_uuid,
            institute_name: institute.institute_name,
            institute_id: institute.institute_id,
            theme_color: institute.theme_color,
          });

          // Branding + masters
          await fetchBranding(institute.institute_uuid, setBranding);
          await fetchAndStoreMasters();

          document.documentElement.style.setProperty(
            '--theme-color',
            institute.theme_color || '#5b5b5b'
          );

          toast.success(`Welcome, ${user.name}`);
          navigate(`/home`); // ✅ force redirect to home after auto-login
        } else {
          toast.error('Invalid or expired session, please login again');
          navigate('/login');
        }
      })
      .catch(() => {
        toast.error('Token verification failed');
        navigate('/login');
      });
  }, [searchParams, navigate]);

  // fetch branding on first load so login page shows correct logo/tagline
  useEffect(() => {
    if (!branding) {
      const insti = getInstituteId(searchParams);
      fetchBranding(insti, setBranding);
    }
  }, [searchParams, branding]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const insti = getInstituteId(searchParams);
    try {
      // Make sure backend uses bcrypt.compare for hashed password check!
      const { data } = await axios.post(`https://canvaback.onrender.com/api/auth/user/login`, {
        username,
        password,
      });
      if (data.message !== 'success') {
        toast.error(data.message || 'Invalid credentials');
        setLoading(false);
        return;
      }
      toast.success(`Welcome, ${data.user_name}`);
      storeUserData({
        id: data.user_id,
        name: data.user_name,
        role: data.user_role,
        username: data.login_username,
      });
      storeInstituteData({
        institute_uuid: data.institute_uuid,
        institute_name: data.institute_name,
        institute_id: data.institute_id,
        theme_color: data.theme_color,
      });
      if (data.trialExpiresAt) {
        localStorage.setItem('trialExpiresAt', data.trialExpiresAt);
      }
      document.documentElement.style.setProperty('--theme-color', data.theme_color || '#5b5b5b');
      if (window.updateAppContext) {
        window.updateAppContext({
          user: JSON.parse(localStorage.getItem('user')),
          institute: JSON.parse(localStorage.getItem('institute')),
        });
      }
      await fetchBranding(insti, setBranding);
      await fetchAndStoreMasters();
      setTimeout(() => navigate(`/home`), 600);
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.response?.data?.message || 'Server error during login');
    } finally {
      setPassword('');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        px: 2,
      }}
    >
      <Toaster position="top-center" />
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
          <Stack spacing={2} alignItems="center">
            <Box
              component="img"
              src={branding?.logo || '/pwa-512x512.png'}
              onError={(e) => {
                e.target.src = '/pwa-512x512.png';
              }}
              alt="Logo"
              sx={{ width: 80, height: 80, objectFit: 'contain' }}
            />
            <Typography
              variant="h5"
              fontWeight={700}
              align="center"
              sx={{ color: accentColor }}
            >
              {branding?.institute || 'Login'}
            </Typography>
            {branding?.tagline && (
              <Typography variant="body2" color="text.secondary" align="center">
                {branding.tagline}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" align="center">
              (Login using your Center Code as both username and password)
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 3 }}>
            <Stack spacing={2}>
              <TextField
                inputRef={inputRef}
                label="Center Code"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setPassword(e.target.value);
                }}
                required
                fullWidth
                placeholder="Enter Center Code"
                autoComplete="username"
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                placeholder="Enter Password"
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.2,
                  backgroundColor: accentColor,
                  '&:hover': { backgroundColor: accentColor },
                }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </Stack>
          </Box>

          <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Don’t have an account?
            </Typography>
            <Button onClick={() => navigate('/signup')} size="small">
              Register
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
