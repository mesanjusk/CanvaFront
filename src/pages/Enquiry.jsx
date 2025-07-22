import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import BASE_URL from '../config';

const Enquiry = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    mobileSelf: '',
    course: '',
  });
  const [enquiries, setEnquiries] = useState([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpRemarks, setFollowUpRemarks] = useState('');
  const [search, setSearch] = useState('');
  const [actionModal, setActionModal] = useState(null);
  const institute_uuid = localStorage.getItem('institute_uuid');

  const fetchEnquiries = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/record/enquiry`, {
        params: { institute_uuid, page, limit }
      });
      const { data, total: t, page: p, limit: l } = res.data;
      setEnquiries(Array.isArray(data) ? data : []);
      setTotal(t || 0);
      setPage(p ?? page);
      setLimit(l ?? limit);
    } catch (err) {
      toast.error('Failed to fetch enquiries');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.mobileSelf) {
      toast.error('First name and mobile are required');
      return;
    }
    try {
      if (isEditMode && selectedEnquiry) {
        await axios.put(`${BASE_URL}/api/record/${selectedEnquiry._id}`, {
          ...form,
          institute_uuid,
          type: 'enquiry',
        });
        toast.success('Enquiry updated');
      } else {
        await axios.post(`${BASE_URL}/api/record`, {
          ...form,
          institute_uuid,
          type: 'enquiry',
        });
        toast.success('Enquiry added');
      }
      setForm({ firstName: '', lastName: '', mobileSelf: '', course: '' });
      setShowModal(false);
      fetchEnquiries();
    } catch (err) {
      toast.error('Failed to save enquiry');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/record/${id}`);
      toast.success('Enquiry deleted');
      fetchEnquiries();
    } catch (err) {
      toast.error('Failed to delete enquiry');
    }
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/api/followup`, {
        enquiry_uuid: selectedEnquiry.uuid,
        followUpDate,
        remarks: followUpRemarks,
        updatedBy: localStorage.getItem('name') || 'admin',
      });
      toast.success('Follow-Up saved');
      setShowFollowUpModal(false);
      setFollowUpDate('');
      setFollowUpRemarks('');
      fetchEnquiries();
    } catch (err) {
      toast.error('Failed to save follow-up');
    }
  };

  const openAddModal = () => {
    setForm({ firstName: '', lastName: '', mobileSelf: '', course: '' });
    setIsEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (enquiry) => {
    setForm({
      firstName: enquiry.firstName || '',
      lastName: enquiry.lastName || '',
      mobileSelf: enquiry.mobileSelf || '',
      course: enquiry.course || '',
    });
    setSelectedEnquiry(enquiry);
    setIsEditMode(true);
    setShowModal(true);
  };

  const openFollowUpModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowFollowUpModal(true);
  };

  useEffect(() => {
    fetchEnquiries();
  }, [page, limit]);

  const filtered = enquiries.filter(
    (e) =>
      e.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      e.mobileSelf?.includes(search)
  );

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <Toaster />
      <div className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile"
          className="border p-2 w-full max-w-xs rounded"
        />
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add Enquiry
        </button>
      </div>

      {/* Card View (mobile-friendly like WhatsApp) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((e) => (
          <div
            key={e._id}
            className="bg-white p-4 rounded shadow cursor-pointer hover:ring hover:ring-blue-400"
            onClick={() => setActionModal(e)}
          >
            <div className="font-semibold text-lg">{e.firstName} {e.lastName}</div>
            <div className="text-gray-600 text-sm">📞 {e.mobileSelf}</div>
            <div className="text-gray-500 text-xs">{e.course || 'No course selected'}</div>
          </div>
        ))}
      </div>
      <div className="text-sm text-gray-600 mt-2">
        Page {page + 1} - Showing {enquiries.length} of {total}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 overflow-y-auto z-[60]">
          <div className="bg-white p-6 rounded max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">{isEditMode ? 'Edit Enquiry' : 'Add Enquiry'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="First Name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Mobile Number"
                value={form.mobileSelf}
                onChange={(e) => setForm({ ...form, mobileSelf: e.target.value })}
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Course"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                className="border p-2 rounded"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {isEditMode ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-Up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 overflow-y-auto z-[60]">
          <div className="bg-white p-6 rounded max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Add Follow-Up</h2>
            <form onSubmit={handleFollowUpSubmit} className="flex flex-col gap-3">
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="border p-2 rounded"
                required
              />
              <textarea
                value={followUpRemarks}
                onChange={(e) => setFollowUpRemarks(e.target.value)}
                placeholder="Remarks"
                className="border p-2 rounded"
                required
              ></textarea>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 overflow-y-auto z-[60]">
          <div className="bg-white p-6 rounded max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">
              {actionModal.firstName} {actionModal.lastName}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  openEditModal(actionModal);
                  setActionModal(null);
                }}
                className="bg-yellow-500 text-white px-4 py-2 rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  handleDelete(actionModal._id);
                  setActionModal(null);
                }}
                className="bg-red-500 text-white px-4 py-2 rounded text-sm"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  toast('Convert to Admission logic pending');
                  setActionModal(null);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm"
              >
                Convert
              </button>
              <button
                onClick={() => {
                  openFollowUpModal(actionModal);
                  setActionModal(null);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
              >
                Follow-Up
              </button>
              <button
                onClick={() => setActionModal(null)}
                className="bg-gray-400 text-white px-4 py-2 rounded text-sm ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enquiry;
