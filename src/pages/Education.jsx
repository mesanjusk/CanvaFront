import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import BASE_URL from '../config';
// import { getThemeColor } from '../utils/storageUtils'; // if you want to use

const Education = () => {
  
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ education: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const inputRef = useRef();
  const searchTimeout = useRef(); // <-- critical fix!
  const themeColor = localStorage.getItem('theme_color') || '#5b5b5b';

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      const res = await axios.get(`${BASE_URL}/api/education`);
      setList(res.data || []);
    } catch {
      toast.error('Failed to fetch data');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showModal && inputRef.current) inputRef.current.focus();
  }, [showModal]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  // Optional: Escape closes modal
  useEffect(() => {
    if (!showModal) return;
    const handler = (e) => { if (e.key === "Escape") setShowModal(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showModal]);

  const filtered = list.filter(item =>
    item.education.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.education) return toast.error('Education is required');
    setLoading(true);

    try {
      if (editingId) {
        if (!window.confirm('Update this entry?')) return;
        await axios.put(`${BASE_URL}/api/education/${editingId}`, form);
        toast.success('Updated');
      } else {
        await axios.post(`${BASE_URL}/api/education`, form);
        toast.success('Added');
      }
      setForm({ education: '', description: '' });
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
    setForm({ education: item.education, description: item.description });
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/education/${id}`);
      toast.success('Deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen p-2" style={{ backgroundColor: themeColor }}>
      <Toaster />
      <div className="flex items-center gap-2 mb-4 w-full">
        <input
          placeholder="Search education"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border p-2 rounded flex-1 min-w-0"
        />
        <button
          onClick={() => {
            setForm({ education: '', description: '' });
            setEditingId(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex-shrink-0"
        >
          +
        </button>
      </div>

      {fetchLoading ? (
        <div className="text-center p-6">Loading entries...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-6 text-gray-500">No entries found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 overflow-x-auto">
          {filtered.map(item => (
            <div
              key={item._id}
              className="border rounded-lg p-3 shadow hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <h2 className="font-semibold text-lg text-gray-800">{item.education}</h2>
                <p className="text-sm text-gray-600 mt-1">{item.description || <span className="italic text-gray-400">No description</span>}</p>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  aria-label="Edit"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
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
              {editingId ? 'Edit Education' : 'Add New Education'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={form.education}
                onChange={handleChange('education')}
                className="border p-2 w-full rounded"
                placeholder="Education"
                required
              />
              <textarea
                value={form.description}
                onChange={handleChange('description')}
                className="border p-2 w-full rounded"
                placeholder="Description (optional)"
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
                  {loading ? (
                    <span className="animate-spin inline-block mr-2 border-t-2 border-b-2 border-white rounded-full w-4 h-4"></span>
                  ) : (
                    editingId ? 'Update' : 'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Education;
