import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../config';

function getSubdomain() {
  const parts = window.location.hostname.split('.');
  return parts.length > 2 ? parts[0] : null;
}

const AppLoader = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const subdomain = getSubdomain();
  const isDevDomain = window.location.hostname.includes('vercel.app') ||
                      window.location.hostname.includes('localhost');

  if (!subdomain || isDevDomain) {
    setLoading(false);
    return;
  }

  axios.get(`${BASE_URL}/api/resolve-org?subdomain=${subdomain}`)
    .then((res) => {
      const org = res.data.institute;
      localStorage.setItem('institute_id', org._id);
      localStorage.setItem('institute_uuid', org.institute_uuid);
      localStorage.setItem('institute_title', org.institute_title);
      localStorage.setItem('theme_color', org.theme_color || '#5b5b5b');
      document.documentElement.style.setProperty('--theme-color', org.theme_color || '#5b5b5b');
      setLoading(false);
    })
    .catch(() => {
      toast.error('Invalid subdomain.');
      setLoading(false);
    });
}, []);


  if (loading) return <div className="text-center p-10">🌐 Loading...</div>;

  return <>{children}</>;
};

export default AppLoader;