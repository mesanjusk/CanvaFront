import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import BASE_URL from '../config';
import { getThemeColor } from '../utils/storageUtils';

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ name: '', timing: '' });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const nameInputRef = useRef();
  const searchTimeout = useRef();

  const institute_id = localStorage.getItem('institute_uuid');
  const themeColor = getThemeColor();

  const fetchBatches = async () => {
    try {
      setFetchLoading(true);
      const res = await axios.get(`${BASE_URL}/api/batches`);
      setBatches(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch batches');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (showModal && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showModal]);

  // Debounce for search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const filtered = batches.filter(b =>
    b.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!institute_id) return toast.error('Missing institute ID');

    const payload = { ...form, institute_uuid: institute_id };
    setLoading(true);
    try {
      if (editingId) {
        if (!window.confirm('Update this batch?')) return;
        await axios.put(`${BASE_URL}/api/batches/${editingId}`, payload);
        toast.success('Batch updated');
      } else {
        await axios.post(`${BASE_URL}/api/batches`, payload);
        toast.success('Batch added');
      }
      setForm({ name: '', timing: '' });
      setEditingId(null);
      setShowModal(false);
      fetchBatches();
    } catch (err) {
      toast.error('Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (batch) => {
    setForm({ name: batch.name, timing: batch.timing });
    setEditingId(batch._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this batch?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/batches/${id}`);
      toast.success('Deleted');
      fetchBatches();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen p-2" style={{ backgroundColor: themeColor }}>
      <Toaster />
      <div className="flex items-center gap-2 mb-4 w-full">
        <input
          placeholder="Search batch"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border p-2 rounded flex-1 min-w-0"
        />
        <button
          onClick={() => {
            setForm({ name: '', timing: '' });
            setEditingId(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex-shrink-0"
        >
          + Batch
        </button>
      </div>

      {fetchLoading ? (
        <div className="text-center p-6">Loading batches...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-6 text-gray-500">No batches found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          {filtered.map((b) => (
            <div
              key={b._id}
              className="border rounded-lg p-3 shadow hover:shadow-md transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <h2 className="font-semibold text-lg text-gray-800">{b.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{b.timing || <span className="italic text-gray-400">No timing</span>}</p>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => handleEdit(b)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  aria-label="Edit"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(b._id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  aria-label="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 overflow-y-auto z-[60]">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Batch' : 'Add New Batch'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                ref={nameInputRef}
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                className="border p-2 w-full rounded"
                placeholder="Batch Name"
                required
              />
              <input
                type="text"
                value={form.timing}
                onChange={handleChange('timing')}
                className="border p-2 w-full rounded"
                placeholder="Timing (e.g., 10AM–12PM)"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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

export default Batches;
