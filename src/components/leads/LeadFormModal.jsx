import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import BASE_URL from '../../config';

const LeadFormModal = ({ onClose, onSuccess, institute_uuid }) => {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [studentData, setStudentData] = useState({
    firstName: '',
    lastName: '',
    mobileSelf: '',
    course: '',
  });

  // Default followup is today
  const todayStr = new Date().toISOString().substring(0, 10);

  const [leadData, setLeadData] = useState({
    followupDate: '',
    referredBy: '',
    followups: [{
      date: todayStr,
      status: 'follow-up',
      remark: '',
      createdBy: JSON.parse(localStorage.getItem('user'))?.name || 'System',
    }],
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/courses`);
        setCourses(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching courses:', err);
        toast.error('Failed to load courses');
      }
    };
    fetchCourses();
  }, []);

  const handleFollowupDateChange = (dateVal) => {
    setLeadData((prev) => ({
      ...prev,
      followupDate: dateVal,
      followups: [
        { ...prev.followups[0], date: dateVal },
        ...prev.followups.slice(1)
      ]
    }));
  };

  const handleFollowupRemarkChange = (remarkVal) => {
    setLeadData((prev) => ({
      ...prev,
      followups: [
        { ...prev.followups[0], remark: remarkVal },
        ...prev.followups.slice(1)
      ]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(studentData.mobileSelf)) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }
    if (!studentData.course) {
      toast.error('Please select a course');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/leads`, {
        institute_uuid,
        course: studentData.course,
        studentData,
        referredBy: leadData.referredBy,
        followupDate: leadData.followupDate,
        followups: leadData.followups,
      });
      toast.success('Lead created successfully');
      onSuccess();
      onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Mobile number already exists for this institute.');
      } else {
        toast.error('Error creating lead');
      }
      console.error('Error creating lead:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50 z-[60]">
      <Toaster />
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative">
        {/* X close button in top right */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
          aria-label="Close"
          type="button"
        >
          ×
        </button>

        <h2 className="text-lg font-semibold mb-4">Add New Lead</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="First Name"
              value={studentData.firstName}
              onChange={(e) => setStudentData({ ...studentData, firstName: e.target.value })}
              required
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={studentData.lastName}
              onChange={(e) => setStudentData({ ...studentData, lastName: e.target.value })}
              className="border p-2 rounded"
            />
          </div>
          <input
            type="tel"
            placeholder="Mobile (10 digits)"
            value={studentData.mobileSelf}
            onChange={(e) => setStudentData({ ...studentData, mobileSelf: e.target.value })}
            required
            maxLength={10}
            pattern="[0-9]{10}"
            className="border p-2 rounded w-full"
          />
          <select
            value={studentData.course}
            onChange={(e) => setStudentData({ ...studentData, course: e.target.value })}
            required
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select Course --</option>
            {courses.map((course) => (
              <option key={course._id} value={course.Course_uuid}>{course.name}</option>
            ))}
          </select>

          <label className="block mb-2 mt-3">Follow Up Date</label>
          <input
            type="date"
            onChange={e => handleFollowupDateChange(e.target.value)}
            value={leadData.followupDate}
            className="border p-2 rounded w-full"
            required
          />

          <label className="block font-medium mt-3">Referred By</label>
          <input
            type="text"
            value={leadData.referredBy}
            onChange={(e) => setLeadData({ ...leadData, referredBy: e.target.value })}
            placeholder="Enter Referred By"
            className="border p-2 rounded w-full"
          />

          <label className="block font-medium mt-3">Remark</label>
          <input
            type="text"
            value={leadData.followups[0].remark}
            onChange={(e) => handleFollowupRemarkChange(e.target.value)}
            placeholder="Enter Remark"
            className="border p-2 rounded w-full"
          />

          {/* Centered Save button below all fields */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold transition"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeadFormModal;
