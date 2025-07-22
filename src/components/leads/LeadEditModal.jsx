import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../../config';

const LeadEditModal = ({ lead, courses, onClose, onSuccess }) => {
  const [studentData, setStudentData] = useState({
    firstName: lead.studentData?.firstName || '',
    lastName: lead.studentData?.lastName || '',
    mobileSelf: lead.studentData?.mobileSelf || '',
    course: lead.studentData?.course || lead.course || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${BASE_URL}/api/leads/${lead.Lead_uuid}/edit`, {
        ...lead,
        studentData,
        course: studentData.course,
      });
      toast.success('Lead updated!');
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to update lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50 z-[60]">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Edit Lead Details</h2>
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
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadEditModal;
