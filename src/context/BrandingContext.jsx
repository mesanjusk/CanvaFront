import React, { createContext, useEffect, useState } from 'react';
import axios from 'axios';

export const BrandingContext = createContext();

const defaultTheme = {
  color: '#5b5b5b', // fallback theme color
  logo: '/pwa-512x512.png',
  favicon: '/icon.svg',
  institute: 'Instify',
  tagline: 'Manage your institute with ease'
};

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r} ${g} ${b}`;
}

const getInstituteId = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const fromQuery = urlParams.get('i');
  if (fromQuery) return fromQuery;

  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const subdomain = parts.length > 2 ? parts[0] : null;

  if (subdomain && subdomain !== 'www' && subdomain !== 'instify') {
    return subdomain;
  }

  return null;
};

const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(defaultTheme);

  useEffect(() => {
    const fetchBranding = async () => {
      const insti = getInstituteId();

      try {
       const res = await axios.get(`https://canvaback.onrender.com/api/branding${insti ? `?i=${insti}` : ''}`);
        const data = res.data || {};

        const final = {
          institute: data.institute || defaultTheme.institute,
          color: data.theme?.color || defaultTheme.color,
          logo: data.logo || defaultTheme.logo,
          favicon: data.favicon || defaultTheme.favicon,
          tagline: data.tagline || defaultTheme.tagline,
        };

        setBranding(final);

        const rgb = hexToRgb(final.color);
        document.documentElement.style.setProperty('--tw-color-primary', rgb);
        document.documentElement.style.setProperty('--theme-color', final.color);

        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = final.favicon || '/icon.svg';

        document.title = `${final.institute} | Instify`;
      } catch (err) {
        console.warn('⚠️ Failed to fetch branding, using default.');
        const rgb = hexToRgb(defaultTheme.color);
        document.documentElement.style.setProperty('--tw-color-primary', rgb);
        document.documentElement.style.setProperty('--theme-color', defaultTheme.color);
        setBranding(defaultTheme);
      }
    };

    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export default BrandingProvider;

export const useBranding = () => React.useContext(BrandingContext);
