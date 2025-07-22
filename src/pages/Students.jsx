import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Edit, Delete, Add, PictureAsPdf, FileDownload } from '@mui/icons-material';
import BASE_URL from '../config';
import { getThemeColor } from '../utils/storageUtils';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
   firstName: '',
   middleName: '',
  lastName: '',
    dob: '',
  gender: '',
   mobileSelf: '',
   institute_uuid: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const searchTimeout = useRef();
  const themeColor = getThemeColor();
  const institute_uuid = localStorage.getItem("institute_uuid");

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/students`);
setStudents(Array.isArray(res.data?.data) ? res.data.data : []);

    } catch (err) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append('firstName', form.firstName);
  formData.append('middleName', form.middleName);
  formData.append('lastName', form.lastName);
  formData.append('dob', form.dob);
  formData.append('gender', form.gender);
  formData.append('mobileSelf', form.mobileSelf);
  formData.append('institute_uuid', institute_uuid);

  photos.forEach((file) => {
    formData.append('photos', file);
  });

  try {
    if (editingId) {
      if (!window.confirm('Update this student?')) return;
      await axios.put(`${BASE_URL}/api/students/${editingId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Student updated');
    } else {
      await axios.post(`https://canvaback.onrender.com/api/students`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Student added');
    }

    setForm({ firstName: '', middleName: '', lastName: '', dob: '', gender: '', mobileSelf: '', institute_uuid });
    setPhotos([]);
    setEditingId(null);
    setShowModal(false);
    fetchStudents();
  } catch (err) {
    toast.error('Failed to submit');
  }
};


  const handleEdit = (student) => {
    setForm({
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName, 
      dob: student.dob,
      gender: student.gender,
      mobileSelf: student.mobileSelf
    });
    setEditingId(student._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/students/${id}`);
      toast.success('Deleted');
      fetchStudents();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filteredStudents = students.filter(s =>
    s.firstName.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['FirstName', 'MiddleName', 'LastName', 'DOB', 'Gender', 'Mobile']],
      body: filteredStudents.map(s => [
        s.firstName,
        s.middleName,
        s.lastName,
        s.dob,
        s.gender,
        s.mobileSelf
      ])
    });
    doc.save('students.pdf');
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredStudents.map(s => ({
      'First Name': s.firstName,
      'Middle Name': s.middleName,
      'Last Name': s.lastName,
      'DOB': s.dob,
      'Gender': s.gender,
      'Mobile': s.mobileSelf
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'students.xlsx');
  };

  return (
    <div className="min-h-screen p-2" style={{ backgroundColor: themeColor }}>
      <Toaster />
      <div className="flex items-center gap-2 mb-4 w-full flex-wrap">
        <input
          placeholder="Search student"
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
          onClick={() => { setForm({ firstName: '', middleName: '', lastName: '', dob: '', gender: '', mobileSelf: '' }); setEditingId(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          title="Add Student"
        >
          <Add fontSize="small" />
        </button>
      </div>

      {loading ? (
        <div className="text-center p-6">Loading students...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center p-6 text-gray-500">No students found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          {filteredStudents.map((s) => (
            <div key={s._id} className="border rounded-lg p-3 shadow hover:shadow-md transition flex flex-col justify-between">
              <div>
                <h2 className="font-semibold text-lg text-gray-800">{s.firstName}{s.lastName}</h2>
                <p className="text-sm text-gray-600 mt-1">{s.mobileSelf}</p>
                <div className="mt-2 text-sm text-gray-700">
                  <div>DOB: <span className="font-medium">{s.dob}</span></div>
                  <div>Gender: <span className="font-medium">{s.gender}</span></div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => handleEdit(s)} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600" title="Edit">
                  <Edit fontSize="small" />
                </button>
                <button onClick={() => handleDelete(s._id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700" title="Delete">
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
            <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Student' : 'Add New Student'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
              <input type="text" value={form.firstName} onChange={handleChange('firstName')} className="border p-2 w-full rounded" placeholder="First Name" required />
              <input type="text" value={form.middleName} onChange={handleChange('middleName')} className="border p-2 w-full rounded" placeholder="Middele Name" required />
              <input type="text" value={form.lastName} onChange={handleChange('lastName')} className="border p-2 w-full rounded" placeholder="Last Name" required />
              <input type="number" value={form.mobileSelf} onChange={handleChange('mobileSelf')} className="border p-2 w-full rounded" placeholder="Mobile number" />
              <input type='date' value={form.dob} onChange={handleChange('dob')} className="border p-2 w-full rounded" placeholder="DOB" />
              <input type="text" value={form.gender} onChange={handleChange('gender')} className="border p-2 w-full rounded" placeholder="Gender" />
              <input
  type="file"
  multiple
  accept="image/*"
  onChange={(e) => setPhotos([...e.target.files])}
  className="border p-2 w-full rounded"
/>
<div className="flex gap-2 flex-wrap">
  {photos?.length > 0 &&
    Array.from(photos).map((photo, idx) => (
      <img
        key={idx}
        src={URL.createObjectURL(photo)}
        alt="preview"
        className="w-16 h-16 object-cover rounded border"
      />
    ))}
</div>


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

export default Students;
