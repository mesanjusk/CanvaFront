import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../config';
import { useApp } from '../context/AppContext';

const User = () => {
  const { user, institute, loading } = useApp();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    password: '',
    role: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fetchLoading, setFetchLoading] = useState(true);
  const navigate = useNavigate();
  const searchTimeout = useRef();

  const themeColor = institute?.theme_color || '#5b5b5b';

  // Prevent early redirect until loading is complete
  useEffect(() => {
    if (!loading && !institute?.institute_uuid) {
      toast.error("Institute not found. Please log in.");
      navigate('/');
    }
  }, [institute, loading]);

  // Fetch users once institute is ready
  useEffect(() => {
    if (institute?.institute_uuid) {
      fetchUsers();
    }
    // eslint-disable-next-line
  }, [institute]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const fetchUsers = async () => {
    const orgId = institute?.institute_uuid;
    if (!orgId) return;

    try {
      setFetchLoading(true);
      const res = await axios.get(`${BASE_URL}/api/auth/GetUserList/${orgId}`);
      if (res.data?.success) {
        setUsers(res.data.result);
      } else {
        setUsers([]);
        toast.error('No users found');
      }
    } catch (error) {
      setUsers([]);
      toast.error('Error fetching users');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const orgId = institute?.institute_uuid;
    if (!orgId) {
      toast.error('Institute ID missing.');
      return;
    }

    const dataToSend = { ...form, institute_uuid: orgId };

    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/api/auth/${editingId}`, dataToSend);
        toast.success('User updated');
      } else {
        // Step 1: Register user
        const res = await axios.post(`${BASE_URL}/api/auth/register`, dataToSend);

        if (res.data === 'exist') {
          toast.error('User already exists');
          return;
        } else if (res.data === 'notexist') {
          toast.success('User added');

          // Step 2: Get "ACCOUNT" group UUID
          const groupRes = await axios.get(`${BASE_URL}/api/accountgroup/GetAccountgroupList`);
          const accountGroup = groupRes.data.result.find(g => g.Account_group === "ACCOUNT");

          if (!accountGroup) {
            toast.error('ACCOUNT group not found');
            return;
          }

          // Step 3: Create account linked to this user
          await axios.post(`${BASE_URL}/api/account/addAccount`, {
            Account_name: form.name,
            Mobile_number: form.mobile,
            Account_group: accountGroup.Account_group_uuid,
            institute_uuid: orgId
          });

          toast.success('Account also created');
        } else {
          toast.error('Unexpected user registration response');
          return;
        }
      }

      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error('Failed to submit');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this User?')) return;

    try {
      await axios.delete(`${BASE_URL}/api/auth/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name || '',
      password: item.password || '',
      mobile: item.mobile || '',
      role: item.role || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', password: '', mobile: '', role: '' });
  };

  // Filtered user list
  const filteredUsers = users.filter(
    (item) =>
      item.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item.mobile?.includes(debouncedSearch) ||
      item.role?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Show loading screen if Context is still initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2" style={{ backgroundColor: themeColor }}>
      <Toaster position="top-right" />
      <div className="flex items-center gap-2 mb-4 w-full">
        <input
          placeholder="Search user"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border p-2 rounded flex-1 min-w-0"
        />
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex-shrink-0"
        >
          + 
        </button>
      </div>

      {fetchLoading ? (
        <div className="text-center p-6">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center p-6 text-gray-500">No users found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          {filteredUsers.map((item) => (
            <div key={item._id} className="border rounded-lg p-3 shadow hover:shadow-md transition flex flex-col justify-between">
              <div>
                <h2 className="font-semibold text-lg text-gray-800">{item.name}</h2>
                <div className="text-sm text-gray-700 mt-1">
                  <div>Mobile: <span className="font-medium">{item.mobile}</span></div>
                  <div>Role: <span className="font-medium">{item.role}</span></div>
                </div>
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
            <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" value={form.name} onChange={handleInputChange('name')} className="w-full p-2 border rounded" placeholder="Name" required />
              <input type="text" value={form.password} onChange={handleInputChange('password')} className="w-full p-2 border rounded" placeholder="Password" required />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                value={form.mobile}
                onChange={handleInputChange('mobile')}
                className="w-full p-2 border rounded"
                placeholder="Mobile No."
                required
              />
              <select value={form.role} onChange={handleInputChange('role')} className="w-full p-2 border rounded" required>
                <option value="">-- Select Role --</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="owner">Owner</option>
              </select>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Cancel</button>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">{editingId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default User;
