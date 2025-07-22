import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [institute, setInstitute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storage = localStorage;
    try {
      const userStr = storage.getItem('user');
      const instiStr = storage.getItem('institute');

      if (userStr && instiStr) {
        const userObj = JSON.parse(userStr);
        const instiObj = JSON.parse(instiStr);
        if (!instiObj.institute_uuid) {
          const legacyUuid = storage.getItem('institute_uuid');
          if (legacyUuid) {
            instiObj.institute_uuid = legacyUuid;
          }
        }
        setUser(userObj);
        setInstitute(instiObj);
        // Sync legacy uuid key
        if (instiObj.institute_uuid)
          storage.setItem('institute_uuid', instiObj.institute_uuid);
        console.log('✅ [AppContext] Restored user and institute:', { userObj, instiObj });
      } else {
        console.warn('⚠️ [AppContext] No stored user or institute found in storage.');
      }
    } catch (err) {
      console.error('❌ [AppContext] Failed parsing user/institute:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.updateAppContext = ({ user, institute }) => {
      const storage = localStorage;
      if (user) {
        setUser(user);
        storage.setItem('user', JSON.stringify(user));
      }
      if (institute) {
        setInstitute(institute);
        storage.setItem('institute', JSON.stringify(institute));
        if (institute.institute_uuid || institute.uuid)
          storage.setItem('institute_uuid', institute.institute_uuid || institute.uuid);
      }
    };
  }, []);

  // Helper: always get the right UUID
  const institute_uuid = institute?.institute_uuid || institute?.uuid || null;

  return (
    <AppContext.Provider value={{ user, setUser, institute, setInstitute, institute_uuid, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
