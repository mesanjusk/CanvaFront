import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../../config';

const ConfirmAdmissionModal = ({ admission, onClose, onUpdated }) => {
  const [status, setStatus] = useState(admission?.confirmationStatus || '');
  const [dropoutReason, setDropoutReason] = useState(admission?.dropoutReason || '');
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const modalRef = useRef();
  const institute_uuid = localStorage.getItem('institute_uuid');

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleBackdrop = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  const handleSave = async () => {
    if (!status) {
      toast.error('Please select a status');
      return;
    }

    if (status === 'DropOut' && !dropoutReason.trim()) {
      toast.error('Please provide a reason for dropout');
      return;
    }

    try {
      setLoading(true);
      await axios.put(`${BASE_URL}/api/admissions/${admission.uuid}`, {
        confirmationStatus: status,
        dropoutReason: status === 'DropOut' ? dropoutReason : '',
        institute_uuid,
      });
      toast.success('Admission status updated');
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-40 z-[60]"
        onMouseDown={handleBackdrop}
      >
        <div
          ref={modalRef}
          className="bg-white rounded-lg p-6 w-full max-w-sm"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold mb-4">Admission Status</h2>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">Select Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="DropOut">Drop-out</option>
            </select>
          </div>

          {status === 'DropOut' && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Drop-out Remark</label>
              <textarea
                value={dropoutReason}
                onChange={(e) => setDropoutReason(e.target.value)}
                rows={3}
                required
                className="w-full border p-2 rounded"
                placeholder="Reason for Drop-out"
              />
            </div>
          )}

          {status === 'Confirmed' && (
            <div className="mb-4">
              <button
                onClick={() => setShowConfirmModal(true)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Confirmed Admission
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
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

      {showConfirmModal && (
        <ConfirmedAdmissionPopup onClose={() => setShowConfirmModal(false)} />
      )}
    </>
  );
};

export default ConfirmAdmissionModal;

const ConfirmedAdmissionPopup = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto z-[60]">
    <div className="bg-white p-6 rounded shadow max-w-sm w-full">
      <h2 className="text-xl font-bold mb-4">Confirmed Admission Details</h2>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

