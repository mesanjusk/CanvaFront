import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import BASE_URL from '../../config';
import { useMetadata } from '../../context/MetadataContext';
import { useNavigate, useParams } from 'react-router-dom';

const EnquiryFormModal = ({ onClose }) => {
  const initialForm = {
    enquiryDate: new Date().toISOString().substring(0, 10),
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    gender: '',
    mobileSelf: '',
    mobileSelfWhatsapp: false,
    mobileParent: '',
    mobileParentWhatsapp: false,
    address: '',
    education: '',
    schoolName: '',
    referredBy: '',
    followUpDate: '',
    remarks: '',
    course: '',
    fees: '' // For auto-loading fees on course selection
  };

  const [form, setForm] = useState(initialForm);
  const { courses } = useMetadata();
  const institute_uuid = localStorage.getItem('institute_uuid');
  const navigate = useNavigate();
  const { username } = useParams();

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-load fees from course selection
  useEffect(() => {
    if (form.course && Array.isArray(courses)) {
      const selectedCourse = courses.find(c => c.name === form.course);
      if (selectedCourse && selectedCourse.fees) {
        setForm((prev) => ({ ...prev, fees: selectedCourse.fees }));
      } else {
        setForm((prev) => ({ ...prev, fees: '' }));
      }
    }
  }, [form.course, courses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!institute_uuid) {
      toast.error('Missing institute UUID');
      return;
    }

    const payload = {
      ...form,
      institute_uuid,
      type: 'enquiry'
    };

    try {
      await axios.post(`${BASE_URL}/api/record`, payload);
      toast.success('Enquiry added successfully');
      handleClose();
    } catch {
      toast.error('Failed to add enquiry');
    }
  };

  const handleClose = () => {
    navigate(`/${username}/allEnquiry`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto z-[60]">
      <Toaster />
      <div className="bg-white rounded p-4 w-full max-w-lg shadow">
        <h2 className="text-lg font-bold mb-4">Add Enquiry</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input value={form.firstName} onChange={handleChange('firstName')} placeholder="First Name" className="border p-2 rounded" />
          <input value={form.lastName} onChange={handleChange('lastName')} placeholder="Last Name" className="border p-2 rounded" />
          <input
            value={form.mobileSelf}
            onChange={handleChange('mobileSelf')}
            placeholder="Mobile"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            className="border p-2 rounded"
          />
          <select value={form.course} onChange={handleChange('course')} className="border p-2 rounded">
            <option value="">Select Course</option>
            {Array.isArray(courses) && courses.map(c => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </select>
          {form.fees && (
            <input
              value={form.fees}
              readOnly
              placeholder="Course Fees"
              className="border p-2 rounded bg-gray-100"
            />
          )}
          <input
            type="date"
            value={form.followUpDate}
            onChange={handleChange('followUpDate')}
            className="border p-2 rounded"
          />
          <input
            value={form.remarks}
            onChange={handleChange('remarks')}
            placeholder="Remarks"
            className="border p-2 rounded"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={handleClose} className="bg-gray-500 text-white px-4 py-2 rounded">
              Cancel
            </button>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
              Add Enquiry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnquiryFormModal;
