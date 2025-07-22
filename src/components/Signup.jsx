// src/pages/Signup.jsx
import React, { useState, useEffect } from 'react';
import { useBranding } from '../context/BrandingContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
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
    theme_color: '#5b5b5b'
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
    axios.get(`https://canvaback.onrender.com/api/org-categories`)
      .then(res => {
        setOrgTypes(res.data);
        setLoadingTypes(false);
      })
      .catch(err => {
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

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setServerOtp(generatedOtp); // Save it for comparison later

    const message = `Your OTP for Institute registration is ${generatedOtp}`;

    try {
      const res = await axios.post(`https://canvaback.onrender.com/api/institute/send-message`, {
        mobile: `91${form.institute_call_number}`,
        message,
        type: 'signup',
        userName: form.center_head_name,
      });

      if (res.data.success) {
        setOtpSent(true);
        toast.success('OTP sent to your mobile');
      } else {
        toast.error('Failed to send OTP');
      }
    } catch (err) {
      console.error('OTP Send Error:', err);
      toast.error('Error sending OTP');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!otp || otp !== serverOtp) {
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
      const signupData = { 
        ...form, 
        plan_type: 'trial', 
        passwordHash: form.center_code 
      };

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
          const accountGroup = groupRes.data.result.find(g => g.Account_group === "ACCOUNT");
          const accountBank = groupRes.data.result.find(g => g.Account_group === "Bank");

          if (accountGroup) {
            await axios.post(`${BASE_URL}/api/account/addAccount`, {
              Account_name: form.center_head_name,
              Mobile_number: form.institute_call_number,
              Account_group: accountGroup.Account_group_uuid,
              institute_uuid: data.institute_uuid
            });
            toast.success("Institute account created");
          } else {
            toast.error("ACCOUNT group not found");
          }

          if (accountGroup) {
            await axios.post(`${BASE_URL}/api/account/addAccount`, {
              Account_name: "Fees Receivable",
              Mobile_number: form.institute_call_number,
              Account_group: accountGroup.Account_group_uuid,
              institute_uuid: data.institute_uuid
            });
            toast.success("Fees Receivable account created");
          } else {
            toast.error("ACCOUNT group not found");
          }
          if (accountBank) {
            await axios.post(`${BASE_URL}/api/account/addAccount`, {
              Account_name: "Bank",
              Mobile_number: form.institute_call_number,
              Account_group: accountBank.Account_group_uuid,
              institute_uuid: data.institute_uuid
            });
            toast.success("Bank account created");
          } else {
            toast.error("ACCOUNT group not found");
          }
          if (accountBank) {
            await axios.post(`${BASE_URL}/api/account/addAccount`, {
              Account_name: "Cash",
              Mobile_number: form.institute_call_number,
              Account_group: accountBank.Account_group_uuid,
              institute_uuid: data.institute_uuid
            });
            toast.success("Cash account created");
          } else {
            toast.error("ACCOUNT group not found");
          }
        } catch (err) {
          console.error("Error creating institute account:", err);
          toast.error("Failed to create institute account");
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: themeColor }}>
      <Toaster position="top-center" />
      <div className="bg-white w-full max-w-md rounded-lg shadow p-6">
        <div className="flex justify-center mb-2">
          <img
            src="/pwa-512x512.png"
            alt="Logo"
            onError={(e) => (e.target.src = '/pwa-512x512.png')}
            className="w-20 h-20 object-contain"
          />
        </div>
        <h2 className="text-2xl font-bold text-center text-theme mb-1">Register Institute</h2>
        <p className="text-center text-sm text-gray-600 mb-4">{branding?.tagline}</p>
        <form onSubmit={otpSent ? handleSignup : handleSendOtp} className="space-y-4">
          <input
            type="text"
            value={form.institute_title}
            onChange={handleChange('institute_title')}
            placeholder="Institute Name"
            className="w-full px-3 py-2 border rounded-md shadow-sm"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
            required
          />
          <select
            value={form.institute_type}
            onChange={handleChange('institute_type')}
            className="w-full px-3 py-2 border rounded-md shadow-sm"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
            required
          >
            <option value="">Select Institute Type</option>
            {loadingTypes ? (
              <option disabled>Loading...</option>
            ) : (
              orgTypes.map((type) => (
                <option key={type._id} value={type.category}>
                  {type.category}
                </option>
              ))
            )}
          </select>
          <input
            type="text"
            value={form.center_code}
            onChange={handleChange('center_code')}
            placeholder="Center Code"
            className="w-full px-3 py-2 border rounded-md shadow-sm"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
            required
          />
          <input
            type="tel"
            value={form.institute_call_number}
            onChange={handleChange('institute_call_number')}
            placeholder="Mobile Number"
            maxLength={10}
            pattern="[0-9]{10}"
            className="w-full px-3 py-2 border rounded-md shadow-sm"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
            required
          />
          <input
            type="text"
            value={form.center_head_name}
            onChange={handleChange('center_head_name')}
            placeholder="Center Head Name"
            className="w-full px-3 py-2 border rounded-md shadow-sm"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
            required
          />
          {otpSent && (
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="w-full px-3 py-2 border rounded-md shadow-sm"
              style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
              required
            />
          )}

          <input
  type="file"
  accept="image/*"
  onChange={(e) => setLogoFile(e.target.files[0])}
  required
/>
<label className="block text-sm text-gray-600">Upload Logo</label>

<input
  type="file"
  accept="image/*"
  onChange={(e) => setSignatureFile(e.target.files[0])}
  required
/>
<label className="block text-sm text-gray-600">Upload Signature</label>

          <button
            type="submit"
            className="w-full bg-theme text-white py-2 rounded-md transition hover:opacity-90"
          >
            {otpSent ? 'Verify OTP & Register' : 'Send OTP'}
          </button>
        </form>
        <div className="text-center mt-4 text-sm text-gray-600">
          Already have an account?
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

export default Signup;
