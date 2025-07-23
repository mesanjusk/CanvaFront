// src/utils/storageUtils.js

/**
 * Store institute-related data safely in localStorage.
 * Accepts an object with optional fields: institute_uuid, institute_name, institute_id, theme_color.
 */
export const storeInstituteData = ({ institute_uuid, institute_name, institute_id, theme_color }) => {
  const instituteObj = {
    institute_uuid,
    institute_name,
    institute_id,
    theme_color,
  };
  localStorage.setItem('institute', JSON.stringify(instituteObj)); // ✅ Now stores combined object for AppContext

  if (institute_uuid) localStorage.setItem('institute_uuid', institute_uuid);
  if (institute_name) localStorage.setItem('institute_title', institute_name);
  if (institute_id) localStorage.setItem('institute_id', institute_id);
  if (theme_color) {
    localStorage.setItem('theme_color', theme_color);
    document.documentElement.style.setProperty('--theme-color', theme_color);
  }
};

/**
 * Store user-related data safely in localStorage.
 * Accepts an object with optional fields: id, name, role, username.
 */
export const storeUserData = ({ id, name, role, username }) => {
  const userObj = {
    id,
    name,
    role: role || 'admin',
    username,
    institute_uuid
  };

  localStorage.setItem('user', JSON.stringify(userObj));
  if (name) localStorage.setItem('name', name);
  if (role) localStorage.setItem('user_type', role);
  if (username) {
    localStorage.setItem('login_username', username);
    localStorage.setItem('center_code', username);
  }
};

/**
 * Clear all user and institute-related localStorage values safely.
 * Useful during logout or session expiration.
 */
export const clearUserAndInstituteData = () => {
  const keys = [
    'user',
    'name',
    'user_type',
    'login_username',
    'center_code',
    'institute',
    'institute_title',
    'institute_id',
    'institute_uuid',
    'theme_color',
    'branding',
    'logo',
    'favicon',
    'trialExpiresAt'
  ];
  keys.forEach(key => localStorage.removeItem(key));
};

/**
 * Utility to get stored institute UUID safely.
 */
export const getStoredInstituteUUID = () => {
  return localStorage.getItem('institute_uuid') || null;
};

/**
 * Utility to get stored user data safely.
 */
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
};

/**
 * Retrieve the current theme color from localStorage.
 * Falls back to '#5b5b5b' when none is stored.
 */
export const getThemeColor = () => {
  const color = localStorage.getItem('theme_color') || '#5b5b5b';
  document.documentElement.style.setProperty('--theme-color', color);
  return color;
};
