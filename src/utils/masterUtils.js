// src/utils/masterUtils.js

import axios from 'axios';
import BASE_URL from '../config';
import toast from 'react-hot-toast';
import { saveRecord } from '../db/dbService';

export const fetchAndStoreMasters = async () => {
  try {
    const institute_uuid = localStorage.getItem('institute_uuid');

    const [courses, educations, exams, paymentModes, batches] = await Promise.all([
      axios.get(`${BASE_URL}/api/courses`, { params: { institute_uuid } }),
      axios.get(`${BASE_URL}/api/education`, { params: { institute_uuid } }),
      axios.get(`${BASE_URL}/api/exams`, { params: { institute_uuid } }),
      axios.get(`${BASE_URL}/api/paymentmode`, { params: { institute_uuid } }),
      axios.get(`${BASE_URL}/api/batches`, { params: { institute_uuid } }),
    ]);

    const courseList = courses.data.data || [];
    const educationList = educations.data.data || [];
    const examList = exams.data.data || [];
    const paymentModeList = paymentModes.data.data || [];
    const batchList = batches.data.data || [];

    localStorage.setItem('courses', JSON.stringify(courseList));
    localStorage.setItem('educations', JSON.stringify(educationList));
    localStorage.setItem('exams', JSON.stringify(examList));
    localStorage.setItem('paymentModes', JSON.stringify(paymentModeList));
    localStorage.setItem('batches', JSON.stringify(batchList));

    // Cache data offline using IndexedDB
    await Promise.all([
      saveRecord('courses', { id: 'list', data: courseList }),
      saveRecord('educations', { id: 'list', data: educationList }),
      saveRecord('exams', { id: 'list', data: examList }),
      saveRecord('paymentModes', { id: 'list', data: paymentModeList }),
      saveRecord('batches', { id: 'list', data: batchList })
    ]);
  } catch (error) {
    console.error('Failed to fetch master data', error);
    toast.error('⚠️ Failed to fetch master data');
  }
};
