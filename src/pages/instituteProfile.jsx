import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import BASE_URL from '../config';
import { useApp } from '../context/AppContext';

const InstituteProfile = () => {
  const { institute, setInstitute } = useApp();
  const [data, setData] = useState(null);

  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState('');
  const [faviconFile, setFaviconFile] = useState(null);

  const themeColor = institute?.theme_color || '#5b5b5b';
  const instituteUUID = institute?.institute_uuid;

  useEffect(() => {
    if (instituteUUID) fetchProfile();
  }, [instituteUUID]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/institute/${instituteUUID}`);
      const result = res.data.result;
      setData(result);
      setLogoPreview(result.institute_logo || '');
      setFaviconPreview(result.theme_favicon || '');
    } catch (err) {
      toast.error('Failed to load profile');
      console.error(err);
    }
  };

  const handleChange = (field) => (e) => {
    setData({ ...data, [field]: e.target.value });
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return null;
    const formData = new FormData();
    formData.append('file', logoFile);
    try {
      const res = await axios.post(`${BASE_URL}/api/upload`, formData);
      return res.data.url;
    } catch (err) {
      toast.error('Logo upload failed');
      console.error(err);
      return null;
    }
  };

  const handleFaviconUpload = async () => {
    if (!faviconFile) return null;
    const formData = new FormData();
    formData.append('file', faviconFile);
    try {
      const res = await axios.post(`${BASE_URL}/api/upload`, formData);
      return res.data.url;
    } catch (err) {
      toast.error('Favicon upload failed');
      console.error(err);
      return null;
    }
  };

  const handleSave = async () => {
    if (!data || !instituteUUID) return;
    if (!window.confirm('Are you sure you want to save these changes?')) return;

    try {
      let logoUrl = logoPreview;
      let faviconUrl = faviconPreview;

      if (logoFile) {
        const uploaded = await handleLogoUpload();
        if (!uploaded) return;
        logoUrl = uploaded;
      }

      if (faviconFile) {
        const uploaded = await handleFaviconUpload();
        if (!uploaded) return;
        faviconUrl = uploaded;
      }

      const updated = {
        ...data,
        institute_logo: logoUrl,
        theme_color: data.theme_color || '#5b5b5b',
        theme_logo: logoUrl,
        theme_favicon: faviconUrl,
      };

      await axios.put(`${BASE_URL}/api/institute/update/${instituteUUID}`, updated);
      toast.success('Profile updated');
      fetchProfile();

      document.documentElement.style.setProperty('--theme-color', updated.theme_color);

      document.title = `${updated.institute_title || 'Instify'} | Instify`;

      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = updated.theme_favicon || '/icon.svg';

      localStorage.setItem('institute_title', updated.institute_title);
      localStorage.setItem('theme_color', updated.theme_color);
      localStorage.setItem('favicon', updated.theme_favicon);
      localStorage.setItem('logo', updated.institute_logo);

      setInstitute((prev) => ({
        ...prev,
        institute_title: updated.institute_title,
        theme_color: updated.theme_color,
        institute_logo: updated.institute_logo,
        theme_favicon: updated.theme_favicon,
      }));
    } catch (err) {
      toast.error('Update failed');
      console.error(err);
    }
  };

  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: themeColor }}>
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto bg-white p-6 shadow rounded">
        <h2 className="text-2xl font-bold mb-6">Institute Profile</h2>

        <div className="space-y-4">
          <Field label="Institute Title" value={data.institute_title} onChange={handleChange('institute_title')} />
          <Field label="Institute Type" value={data.institute_type} onChange={handleChange('institute_type')} />
          <Field label="Center Code" value={data.center_code} onChange={handleChange('center_code')} />
          <Field label="Call Number" value={data.institute_call_number} onChange={handleChange('institute_call_number')} />
          <Field label="Center Head Name" value={data.center_head_name || ''} onChange={handleChange('center_head_name')} />
          <Field label="Address" value={data.address || ''} onChange={handleChange('address')} />
          <Field label="Email" type="email" value={data.email || ''} onChange={handleChange('email')} />

          <div>
            <label className="font-medium">Theme Color</label>
            <input
              type="color"
              value={data.theme_color}
              onChange={handleChange('theme_color')}
              className="w-20 h-10 border rounded"
            />
          </div>

          <div>
            <label className="font-medium">Institute Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setLogoFile(file);
                setLogoPreview(URL.createObjectURL(file));
              }}
            />
            {logoPreview && <img src={logoPreview} alt="Logo" className="h-24 mt-2 rounded border" />}
          </div>

          <div>
            <label className="font-medium">Favicon</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setFaviconFile(file);
                setFaviconPreview(URL.createObjectURL(file));
              }}
            />
            {faviconPreview && (
              <img src={faviconPreview} alt="Favicon" className="h-10 mt-2 border rounded" />
            )}
          </div>

          <button
            onClick={handleSave}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, ...rest }) => (
  <div className="flex flex-col">
    <label className="font-medium">{label}</label>
    <input value={value} onChange={onChange} className="border p-2 rounded" {...rest} />
  </div>
);

export default InstituteProfile;
