// src/utils/brandingUtils.js

import axios from 'axios';
import BASE_URL from '../config';
import toast from 'react-hot-toast';

export const fetchBranding = async (insti, setBranding) => {
  try {
    const res = await axios.get(`https://canvaback.onrender.com/api/branding?i=${insti || 'default'}`);
    const data = res.data;
    const themeColor = data.theme?.color || '#5b5b5b';

    localStorage.setItem('branding', JSON.stringify(data));
    localStorage.setItem('institute_title', data.institute || '');
    localStorage.setItem('theme_color', themeColor);
    localStorage.setItem('favicon', data.favicon || '');
    localStorage.setItem('logo', data.logo || '');

    setBranding(data);
    document.documentElement.style.setProperty('--theme-color', themeColor);

    const updateFavicon = (iconUrl) => {
      let link = document.querySelector("link[rel~='icon']");
      if (link) document.head.removeChild(link);
      link = document.createElement('link');
      link.rel = 'icon';
      link.href = iconUrl || '/icon.svg';
      document.head.appendChild(link);
    };
    updateFavicon(data.favicon);

    document.title = `${data.institute || 'Welcome'} | Instify`;
  } catch (err) {
    console.error('Branding fetch error:', err);
    toast.error('⚠️ Failed to load branding');
  }
};
