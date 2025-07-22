import React, { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../config';
import { useApp } from '../context/AppContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { institute } = useApp();
  const themeColor = institute?.theme_color || '#5b5b5b';

  const [centerCode, setCenterCode] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [serverOtp, setServerOtp] = useState('');
  const [userId, setUserId] = useState('');

 const handleSendOtp = async (e) => {
  e.preventDefault();

  if (!/^[0-9]{10}$/.test(mobile)) {
    toast.error('Enter a valid 10-digit mobile number');
    return;
  }

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  setServerOtp(generatedOtp);

  const message = `Your OTP for Institute registration is ${generatedOtp}`;

  try {
    const res = await axios.post(`${BASE_URL}/api/institute/send-message`, {
      mobile: `91${mobile}`,
      message,
      type: 'forgot',
      userName: centerCode,
    });

   if (res.data.success && res.data.userId) {
  setUserId(res.data.userId); 
  setOtpSent(true);
  toast.success('OTP sent to your mobile');
} else {
  toast.error('User ID missing in response');
}

  } catch (err) {
    console.error('OTP Send Error:', err);
    toast.error('Error sending OTP');
  }
};


  const handleVerifyOtp = (e) => {
    e.preventDefault();

    if (!otp || otp !== serverOtp) {
      toast.error('Invalid OTP');
      return;
    }

    toast.success('OTP verified. Redirecting...');
    navigate(`/reset-password/${userId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: themeColor }}>
      <Toaster position="top-center" />
      <div className="bg-white w-full max-w-md rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-center mb-6" style={{ color: themeColor }}>
          Forgot Password
        </h2>

        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
          <input
            type="text"
            value={centerCode}
            onChange={(e) => setCenterCode(e.target.value)}
            placeholder="Center Code"
            required
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
          />

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Registered Mobile Number"
            required
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
          />

          {otpSent && (
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              maxLength={6}
              className="w-full px-3 py-2 border rounded-md shadow-sm"
              style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
              required
            />
          )}

          <button
            type="submit"
            className="w-full text-white py-2 rounded-md transition hover:opacity-90"
            style={{ backgroundColor: themeColor }}
          >
            {otpSent ? 'Verify OTP' : 'Send OTP'}
          </button>
        </form>

        <div className="text-center mt-4 text-sm text-gray-600">
          Remembered your password?
          <button
            onClick={() => navigate('/')}
            className="ml-1 text-blue-600 hover:underline font-medium"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
