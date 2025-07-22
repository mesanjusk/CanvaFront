import { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BASE_URL from '../config'; // Adjust the path based on your folder structure
import { getThemeColor } from '../utils/storageUtils';
import { formatDisplayDate } from '../utils/dateUtils';


const Owner = () => {
  const [orgs, setOrgs] = useState([]);
  const [orgTypes, setOrgTypes] = useState([]);
  const [form, setForm] = useState({
    institute_title: '',  
institute_call_number: '', 
center_head_name: '',
 institute_type: '',
    center_code: '',
     theme_color: '#5b5b5b'
  });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();
  const { user } = useApp();

  const themeColor = getThemeColor();

  useEffect(() => {
    if (user && user.role !== 'owner' && user.role !== 'super_admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    axios.get(`${BASE_URL}/api/org-categories`)
      .then(res => {
        setOrgTypes(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch institute types:', err);
        toast.error('Failed to load institute types');
      });
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {

    try {
      const res = await axios.get(`${BASE_URL}/api/institute/GetOrganizList`);
      if (res.data?.success) {
        setOrgs(res.data.result);
      } else {
        toast.error('No orgs found');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching orgs');
    }
  };

  const handleInputChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


    try {
      if (editingId) {
  await axios.put(`${BASE_URL}/api/organize/update/${editingId}`, form);
  toast.success('institute updated');
} else {
  const res = await axios.post(`${BASE_URL}/api/organize/add`, form);
  if (res.data === 'exist') toast.error('institute already exists');
  else if (res.data === 'notexist') toast.success('institute added');
  else toast.error('Unexpected error');
}


      // 🔄 Cleanup and refresh
      setShowModal(false);
      resetForm();
      fetchOrgs();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit');
    }
  };

  const handleDelete = async (uuid) => {
    if (!window.confirm('Are you sure you want to delete this institute and all related data?')) return;

    try {
      await axios.delete(`${BASE_URL}/api/institute/${uuid}`);
      toast.success('Institute deleted');
      fetchOrgs();
    } catch (error) {
      toast.error('Error deleting institute');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      institute_title: item.institute_title || '',
      institute_call_number: item.institute_call_number || '',
      center_head_name: item.center_head_name || '',
      institute_type: item.institute_type || '',
    center_code: item.center_code || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ institute_title: '', institute_call_number: '', center_head_name: '', institute_type: '', center_code:'' });
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: themeColor }}>
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Owners</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + New Owner
        </button>
      </div>

      <div className="overflow-x-auto max-h-[70vh]">
      <table className="min-w-full border border-gray-300 rounded-md">
        <thead className="sticky top-0 bg-gray-200">
          <tr className="bg-gray-200 text-center">
            <th className="p-2 border">Name</th>
            <th className="p-2 border hidden md:table-cell">Mobile</th>
            <th className="p-2 border">Head Name</th>
            <th className="p-2 border hidden md:table-cell">Plan</th>
            <th className="p-2 border">Start</th>
            <th className="p-2 border">Expiry</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {orgs.map((item, idx) => (
            <tr key={idx} className="text-center">
              <td className="p-2 border truncate">{item.institute_title}</td>
              <td className="p-2 border truncate hidden md:table-cell">{item.institute_call_number}</td>
              <td className="p-2 border truncate">{item.center_head_name}</td>
              <td className="p-2 border truncate hidden md:table-cell">{item.plan_type || 'trial'}</td>
              <td className="p-2 border">{item.start_date ? formatDisplayDate(item.start_date) : '-'}</td>
              <td className="p-2 border">{item.expiry_date ? formatDisplayDate(item.expiry_date) : '-'}</td>
              <td className="p-2 border space-x-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.institute_uuid || item._id)}
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 overflow-y-auto z-[60]">
          <div className="bg-white p-6 rounded shadow max-w-xl w-full max-h-screen overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit institute' : 'Add New institute'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" value={form.institute_title} onChange={handleInputChange('institute_title')} className="w-full p-2 border rounded" placeholder="institute_title" required />
              <input type="text" value={form.center_head_name} onChange={handleInputChange('center_head_name')} className="w-full p-2 border rounded" placeholder="center_head_name" required />
               <select
            value={form.institute_type}
            onChange={handleInputChange('institute_type')}
            className="w-full px-3 py-2 border rounded-md shadow-sm"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
            required
          >
            <option value="">Select institute Type</option>
            {
              orgTypes.map((type) => (
                <option key={type._id} value={type.category}>{type.category}</option>
              ))
            }
          </select>
               <input
            type="text"
            value={form.center_code}
            onChange={handleInputChange('center_code')}
            placeholder="Center Code (Login ID & Password)"
            className="w-full px-3 py-2 border rounded-md shadow-sm"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
            required
          />
              <input type="text"  inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10} 
                value={form.institute_call_number} 
                onChange={handleInputChange('institute_call_number')} 
                className="w-full p-2 border rounded" placeholder="institute_call_number" required />
             
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Owner;
