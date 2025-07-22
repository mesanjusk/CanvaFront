import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../../config';
import { useNavigate } from 'react-router-dom';

const CertificateModal = ({ certificate, onClose }) => {
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50 z-[60]">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Certificate</h2>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Date</label>
          <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border p-2 rounded"
            />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">File upload</label>
          <input
              type="file"
              className="w-full border p-2 rounded"
            />
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {loading ? 'Uploding...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
