import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import BASE_URL from '../config';

const MetadataContext = createContext({
  courses: [],
  educations: [],
  exams: [],
  batches: [],
  paymentModes: [],
  refresh: () => {},
  loading: false,
});

export const MetadataProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [educations, setEducations] = useState([]);
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const institute_uuid = localStorage.getItem('institute_uuid');

      const [coursesRes, educationsRes, examsRes, batchesRes, paymentModesRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/courses`, { params: { institute_uuid } }),
        axios.get(`${BASE_URL}/api/education`, { params: { institute_uuid } }),
        axios.get(`${BASE_URL}/api/exams`, { params: { institute_uuid } }),
        axios.get(`${BASE_URL}/api/batches`, { params: { institute_uuid } }),
        axios.get(`${BASE_URL}/api/paymentmode`, { params: { institute_uuid } }),
      ]);

      setCourses(Array.isArray(coursesRes.data.data) ? coursesRes.data.data : []);
      setEducations(Array.isArray(educationsRes.data.data) ? educationsRes.data.data : []);
      setExams(Array.isArray(examsRes.data.data) ? examsRes.data.data : []);
      setBatches(Array.isArray(batchesRes.data.data) ? batchesRes.data.data : []);
      setPaymentModes(Array.isArray(paymentModesRes.data.data) ? paymentModesRes.data.data : []);

      console.log("Metadata loaded");
    } catch (err) {
      console.warn('❌ Failed to load metadata', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <MetadataContext.Provider
      value={{
        courses,
        educations,
        exams,
        batches,
        paymentModes,
        refresh: load,
        loading,
      }}
    >
      {children}
    </MetadataContext.Provider>
  );
};

export const useMetadata = () => useContext(MetadataContext);

export default MetadataProvider;
