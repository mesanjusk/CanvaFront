import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Edit, Delete, Add, PictureAsPdf, FileDownload } from '@mui/icons-material';
import BASE_URL from '../config';
import { getThemeColor } from '../utils/storageUtils';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    courseFees: '',
    examFees: '',
    duration: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const searchTimeout = useRef();
  const themeColor = getThemeColor();

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/courses`);
      setCourses(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { ...form };

    try {
      if (editingId) {
        if (!window.confirm('Update this course?')) return;
        await axios.put(`${BASE_URL}/api/courses/${editingId}`, payload);
        toast.success('Course updated');
      } else {
        await axios.post(`${BASE_URL}/api/courses`, payload);
        toast.success('Course added');
      }
      setForm({ name: '', description: '', courseFees: '', examFees: '', duration: '' });
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
      description: course.description,
      courseFees: course.courseFees || '',
      examFees: course.examFees || '',
      duration: course.duration || ''
    });
    setEditingId(course._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/courses/${id}`);
      toast.success('Deleted');
      fetchCourses();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Course Name', 'Description', 'Course Fees', 'Exam Fees', 'Duration']],
      body: filteredCourses.map(c => [
        c.name,
        c.description || '-',
        c.courseFees || '-',
        c.examFees || '-',
        c.duration || '-'
      ])
    });
    doc.save('courses.pdf');
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredCourses.map(c => ({
      'Course Name': c.name,
      Description: c.description,
      'Course Fees': c.courseFees,
      'Exam Fees': c.examFees,
      Duration: c.duration
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Courses');
    XLSX.writeFile(wb, 'courses.xlsx');
  };

  return (
    <div className="min-h-screen p-2" style={{ backgroundColor: themeColor }}>
      <Toaster />
      <div className="flex items-center gap-2 mb-4 w-full flex-wrap">
        <input
          placeholder="Search course"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border p-2 rounded flex-1 min-w-0 max-w-xs"
        />
        <button onClick={exportPDF} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" title="Export PDF">
          <PictureAsPdf fontSize="small" />
        </button>
        <button onClick={exportExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" title="Export Excel">
          <FileDownload fontSize="small" />
        </button>
        <button
          onClick={() => { setForm({ name: '', description: '', courseFees: '', examFees: '', duration: '' }); setEditingId(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          title="Add Course"
        >
          <Add fontSize="small" />
        </button>
      </div>

      {loading ? (
        <div className="text-center p-6">Loading courses...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center p-6 text-gray-500">No courses found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          {filteredCourses.map((c) => (
            <div key={c._id} className="border rounded-lg p-3 shadow hover:shadow-md transition flex flex-col justify-between">
              <div>
                <h2 className="font-semibold text-lg text-gray-800">{c.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{c.description || <span className="italic text-gray-400">No description</span>}</p>
                <div className="mt-2 text-sm text-gray-700">
                  <div>Course Fees: <span className="font-medium">{c.courseFees || '-'}</span></div>
                  <div>Exam Fees: <span className="font-medium">{c.examFees || '-'}</span></div>
                  <div>Duration: <span className="font-medium">{c.duration || '-'}</span></div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => handleEdit(c)} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600" title="Edit">
                  <Edit fontSize="small" />
                </button>
                <button onClick={() => handleDelete(c._id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700" title="Delete">
                  <Delete fontSize="small" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 overflow-y-auto z-[60]">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Course' : 'Add New Course'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
              <input type="text" value={form.name} onChange={handleChange('name')} className="border p-2 w-full rounded" placeholder="Course Name" required />
              <textarea value={form.description} onChange={handleChange('description')} className="border p-2 w-full rounded" placeholder="Description" rows={3} />
              <input type="number" value={form.courseFees} onChange={handleChange('courseFees')} className="border p-2 w-full rounded" placeholder="Course Fees" />
              <input type="number" value={form.examFees} onChange={handleChange('examFees')} className="border p-2 w-full rounded" placeholder="Exam Fees" />
              <input type="text" value={form.duration} onChange={handleChange('duration')} className="border p-2 w-full rounded" placeholder="Duration (e.g., 6 months)" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">{editingId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
