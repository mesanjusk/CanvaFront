
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../../config';

const ManageExamModal = ({ admission, onClose, onUpdated }) => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(admission?.examEvent || '');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef();
  const institute_uuid = localStorage.getItem('institute_uuid');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/exams`, {
          params: { institute_uuid }
        });
        setExams(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast.error('Failed to load exams');
      }
    };
    fetchExams();

    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, institute_uuid]);

  const handleBackdrop = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  const handleSave = async () => {
    if (!selectedExam) return toast.error('Please select an exam');
    setLoading(true);
    try {
      await axios.put(`${BASE_URL}/api/admissions/${admission.uuid}`, {
        examEvent: selectedExam,
        institute_uuid,
      });
      toast.success('Exam updated');
      onUpdated && onUpdated();
      onClose();
    } catch (err) {
      toast.error('Failed to update exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-40 z-[60]"
      onMouseDown={handleBackdrop}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg p-6 w-full max-w-sm"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Manage Exam</h2>
        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        >
          <option value="">-- Select Exam --</option>
          {exams.map((ex) => (
            <option key={ex._id} value={ex.exam}>
              {ex.exam}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageExamModal;
