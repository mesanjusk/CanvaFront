import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [institute, setInstitute] = useState(() => JSON.parse(localStorage.getItem('institute') || 'null'));
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (institute?.institute_uuid) {
      fetchSettings(institute.institute_uuid);
    }
  }, [institute?.institute_uuid]);

  const fetchSettings = async (instituteUuid) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/school-settings/${instituteUuid}`);
      setSettings(data.data);
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const { data } = await api.post('/api/auth/user/login', { username, password });
    if (data.message !== 'success') throw new Error(data.message || 'Login failed');
    const nextUser = {
      id: data.user_id,
      name: data.user_name,
      role: data.user_role,
      username: data.login_username,
    };
    const nextInstitute = {
      institute_id: data.institute_id,
      institute_uuid: data.institute_uuid,
      institute_name: data.institute_name,
      theme_color: data.theme_color,
    };
    localStorage.setItem('user', JSON.stringify(nextUser));
    localStorage.setItem('institute', JSON.stringify(nextInstitute));
    setUser(nextUser);
    setInstitute(nextInstitute);
    await fetchSettings(nextInstitute.institute_uuid);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('institute');
    setUser(null);
    setInstitute(null);
    setSettings(null);
  };

  const value = useMemo(() => ({ user, institute, settings, setSettings, fetchSettings, login, logout, loading }), [user, institute, settings, loading]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
