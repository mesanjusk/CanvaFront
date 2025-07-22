import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BASE_URL from '../config';
import { getThemeColor } from '../utils/storageUtils';
import { formatDisplayDate } from '../utils/dateUtils';

const Institutes = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);

  useEffect(() => {
    if (user && user.role !== 'owner' && user.role !== 'super_admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/institute/GetOrganizList`);
      if (res.data?.success) {
        setInstitutes(res.data.result);
      } else {
        toast.error('No institutes found');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch institutes');
    }
  };

  const handleDelete = async (uuid) => {
    if (!window.confirm('Delete this institute and all related data?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/institute/${uuid}`);
      toast.success('Institute deleted');
      fetchInstitutes();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  const themeColor = getThemeColor();

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: themeColor }}>
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Manage Institutes</h1>
      <div className="overflow-x-auto max-h-[70vh]">
        <table className="min-w-full border border-gray-300 rounded-md">
          <thead className="sticky top-0 bg-gray-200">
            <tr className="bg-gray-200 text-center text-sm">
              <th className="p-2 border">Name</th>
              <th className="p-2 border hidden md:table-cell">Center Code</th>
              <th className="p-2 border hidden md:table-cell">Plan</th>
              <th className="p-2 border">Start Date</th>
              <th className="p-2 border">Expiry</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {institutes.map((inst) => (
              <tr key={inst.institute_uuid || inst._id} className="text-center text-sm">
                <td className="p-2 border truncate">{inst.institute_title}</td>
                <td className="p-2 border truncate hidden md:table-cell">{inst.center_code}</td>
                <td className="p-2 border truncate hidden md:table-cell">{inst.plan_type || 'trial'}</td>
                <td className="p-2 border">{inst.start_date ? formatDisplayDate(inst.start_date) : '-'}</td>
                <td className="p-2 border">{inst.expiry_date ? formatDisplayDate(inst.expiry_date) : '-'}</td>
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() => handleDelete(inst.institute_uuid || inst._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Institutes;
