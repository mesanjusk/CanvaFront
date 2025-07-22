import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import BASE_URL from '../config';
import { getThemeColor } from '../utils/storageUtils';

const OrgCategories = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const categoryInputRef = useRef();
  const themeColor = getThemeColor();

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/org-categories`);
      setCategories(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch categories');
    }
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error('Category is required');
    setLoading(true);

    try {
      if (editingId) {
        if (!window.confirm('Update this category?')) return;
        await axios.put(`${BASE_URL}/api/org-categories/${editingId}`, form);
        toast.success('Category updated');
      } else {
        await axios.post(`${BASE_URL}/api/org-categories`, form);
        toast.success('Category added');
      }
      setForm({ category: '', description: '' });
      setEditingId(null);
      setShowModal(false);
      fetchCategories();
    } catch {
      toast.error('Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setForm({ category: item.category, description: item.description });
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/org-categories/${id}`);
      toast.success('Deleted');
      fetchCategories();
    } catch {
      toast.error('Failed to delete');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (showModal && categoryInputRef.current) {
      categoryInputRef.current.focus();
    }
  }, [showModal]);

  const filtered = categories.filter(c =>
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: themeColor }}>
      <Toaster />
      <div className="flex justify-between items-center mb-4">
        <input
          placeholder="Search category"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={() => {
            setForm({ category: '', description: '' });
            setEditingId(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Category
        </button>
      </div>

      <div className="overflow-x-auto max-h-[70vh]">
      <table className="min-w-full border">
        <thead className="bg-gray-100 sticky top-0">
          <tr>
            <th className="p-2 border">Category</th>
            <th className="p-2 border hidden md:table-cell">Description</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center py-4 text-gray-500">
                No categories found
              </td>
            </tr>
          ) : (
            filtered.map((c) => (
              <tr key={c._id} className="text-center hover:bg-gray-100 transition">
                <td className="border p-2 truncate">{c.category}</td>
                <td className="border p-2 truncate hidden md:table-cell">{c.description}</td>
                <td className="border p-2">
                  <button
                    onClick={() => handleEdit(c)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 overflow-y-auto z-[60]">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Category' : 'Add New Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                ref={categoryInputRef}
                type="text"
                value={form.category}
                onChange={handleChange('category')}
                className="border p-2 w-full"
                placeholder="Category"
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

export default OrgCategories;
