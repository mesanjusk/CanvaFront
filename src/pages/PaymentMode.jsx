import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import BASE_URL from '../config';
import { getThemeColor } from '../utils/storageUtils';

const PaymentMode = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ mode: '', description: '' });
  const [editingId, setEditingId] = useState(null); 
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const themeColor = getThemeColor();

  const fetchData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/paymentmode`);
      setList(res.data || []);
    } catch {
      toast.error('Failed to fetch payment modes');
    }
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mode) return toast.error('Mode is required');
    setLoading(true);

    try {
      if (editingId) {
        if (!window.confirm('Update this payment mode?')) return;
        await axios.put(`${BASE_URL}/api/paymentmode/${editingId}`, form);
        toast.success('Updated');
      } else {
        await axios.post(`${BASE_URL}/api/paymentmode`, form);
        toast.success('Added');
      }
      setForm({ mode: '', description: '' });
      setEditingId(null);
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setForm({ mode: item.mode, description: item.description });
    setEditingId(item._id); 
    setShowModal(true);
  };

  const handleDelete = async (_id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/paymentmode/${_id}`);
      toast.success('Deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showModal && inputRef.current) inputRef.current.focus();
  }, [showModal]);

  const filtered = [...list]
    .sort((a, b) => a.mode.localeCompare(b.mode))
    .filter(item => item.mode.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: themeColor }}>
      <Toaster />
      <div className="flex justify-between items-center mb-4">
        <input
          placeholder="Search mode"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={() => {
            setForm({ mode: '', description: '' });
            setEditingId(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Mode
        </button>
      </div>

      <div className="overflow-x-auto max-h-[70vh]">
      <table className="min-w-full border">
        <thead className="bg-gray-100 sticky top-0">
          <tr>
            
            <th className="p-2 border">Mode</th>
            <th className="p-2 border hidden md:table-cell">Description</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center py-4 text-gray-500">No modes found</td>
            </tr>
          ) : (
            filtered.map((item) => (
              <tr key={item._id} className="text-center hover:bg-gray-100 transition">
                
                <td className="border p-2 truncate">{item.mode}</td>
                <td className="border p-2 truncate hidden md:table-cell">{item.description}</td>
                <td className="border p-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 overflow-y-auto z-[60]">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Mode' : 'Add New Mode'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={form.mode}
                onChange={handleChange('mode')}
                className="border p-2 w-full"
                placeholder="Mode"
                required
              />
              <textarea
                value={form.description}
                onChange={handleChange('description')}
                className="border p-2 w-full"
                placeholder="Description (optional)"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-green-600 text-white px-4 py-2 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMode;
