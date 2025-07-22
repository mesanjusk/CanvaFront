// src/utils/logoutUser.js

import { clearUserAndInstituteData } from './storageUtils';
import { purgeAllData } from '../db/dbService';
import toast from 'react-hot-toast';

/**
 * Logs out the user safely by clearing all user/institute data,
 * resetting AppContext if available, and redirecting to login.
 */
const logoutUser = () => {
  // ✅ Clear user and institute data
  clearUserAndInstituteData();

  // ✅ Purge IndexedDB data (async, non-blocking)
  purgeAllData().catch(console.error);

  // ✅ Clear additional related values
  localStorage.removeItem('remember_me');
  localStorage.removeItem('last_password_change');
  sessionStorage.removeItem('remember_me');
  sessionStorage.removeItem('last_password_change');

  // ✅ Reset AppContext if your app uses it
  if (window.updateAppContext) {
    window.updateAppContext({ user: null, institute: null });
  }

  // ✅ Notify and redirect
  toast.success('Logged out successfully');
  setTimeout(() => {
    window.location.href = '/login'; // Update if your login route differs
  }, 500);
};

export default logoutUser;
