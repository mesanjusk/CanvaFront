import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Edit, Delete, Add, PictureAsPdf, FileDownload } from '@mui/icons-material';
import BASE_URL from '../config';
import { getThemeColor } from '../utils/storageUtils';

const CoursesCategory = () => {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    name: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const themeColor = getThemeColor();

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/courseCategory`);
      setCourses(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch courseCategory');
    }
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { ...form };


    try {
      if (editingId) {
        if (!window.confirm('Update this courseCategory?')) return;
        await axios.put(`${BASE_URL}/api/courseCategory/${editingId}`, payload);
        toast.success('CourseCategory updated');
      } else {
        await axios.post(`${BASE_URL}/api/courseCategory`, payload);
        toast.success('CourseCategory added');
      }
      setForm({ name: '' });
      setEditingId(null);
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      toast.error('Failed to submit');
    }
  };

  const handleEdit = (course) => {
    setForm({
      name: course.name,
    });
    setEditingId(course._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this courseCategory?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/courseCategory/${id}`);
      toast.success('Deleted');
      fetchCourses();
    } catch {
      toast.error('Failed to delete');
    }
  };

 
  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 relative" style={{ backgroundColor: themeColor }}>
      <Toaster />
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <input
          placeholder="Search course"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border p-2 rounded w-full max-w-sm"
        />
        <div className="flex gap-2">
          <button onClick={() => { setForm({ name: ''}); setEditingId(null); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded" title="Add CourseCategory">
            <Add fontSize="small" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[70vh]">
      <table className="min-w-full border">
        <thead className="bg-gray-100 sticky top-0">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredCourses.map((c, i) => (
            <tr key={i} className="text-center">
              <td className="border p-2 truncate">{c.name}</td>
              <td className="border p-2 space-x-2">
                <button onClick={() => handleEdit(c)} className="bg-yellow-500 text-white px-2 py-1 rounded" title="Edit">
                  <Edit fontSize="small" />
                </button>
                <button onClick={() => handleDelete(c._id)} className="bg-red-600 text-white px-2 py-1 rounded" title="Delete">
                  <Delete fontSize="small" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 overflow-y-auto z-[60]">
          <div className="bg-white p-6 rounded w-full max-w-md max-h-screen overflow-y-auto shadow">
            <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Course' : 'Add New Course Category'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
              <input type="text" value={form.name} onChange={handleChange('name')} className="border p-2 w-full" placeholder="Category Name" required />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesCategory;
