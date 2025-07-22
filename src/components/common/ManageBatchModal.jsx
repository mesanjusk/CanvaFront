import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../../config';

const ManageBatchModal = ({ admission, onClose, onUpdated }) => {
  const [batches, setBatches] = useState([]);
 const [selectedBatch, setSelectedBatch] = useState(() => {
  const batchObj = batches.find(
    b => b.time === admission?.batchTime || b.name === admission?.batchTime
  );
  return batchObj?._id || '';
});

  const [loading, setLoading] = useState(false);
  const modalRef = useRef();
  const institute_uuid = localStorage.getItem('institute_uuid');

useEffect(() => {
  const fetchBatches = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/batches`, {
        params: { institute_uuid },
      });
      const batchList = Array.isArray(res.data) ? res.data : [];
      setBatches(batchList);

      const matched = batchList.find(
        b => b.time === admission?.batchTime || b.name === admission?.batchTime
      );
      if (matched) setSelectedBatch(matched._id);
    } catch (err) {
      toast.error('Failed to load batches');
    }
  };
  fetchBatches();
}, [admission?.batchTime, institute_uuid]);


  const handleBackdrop = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  const handleSave = async () => {
  if (!selectedBatch) return toast.error('Please select a batch');
  setLoading(true);

  const selected = batches.find(b => b._id === selectedBatch);
  const batchTime = selected?.time || selected?.batchTime || selected?.name;

  if (!batchTime) {
    toast.error('Invalid batch selected');
    setLoading(false);
    return;
  }

  try {
    await axios.put(`${BASE_URL}/api/admissions/${admission.uuid}`, {
      batchTime, 
      institute_uuid,
    });
    toast.success('Batch updated');
    onUpdated && onUpdated();
    onClose();
  } catch (err) {
    toast.error('Failed to update batch');
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
        <h2 className="text-lg font-semibold mb-4">Manage Batch</h2>
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        >
          <option value="">-- Select Batch --</option>
          {batches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.time || b.batchTime || b.name || 'Unnamed Batch'}
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

export default ManageBatchModal;
