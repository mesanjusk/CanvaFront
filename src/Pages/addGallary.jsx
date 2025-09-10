import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'https://canvaback.onrender.com/api/gallary';

const AddGallary = () => {
  const [gallaries, setGallaries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState(null);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [logo, setLogo] = useState(null);
  const [signature, setSignature] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [previewSignature, setPreviewSignature] = useState(null);

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editLogo, setEditLogo] = useState(null);
  const [editSignature, setEditSignature] = useState(null);
  const [editPreviewLogo, setEditPreviewLogo] = useState(null);
  const [editPreviewSignature, setEditPreviewSignature] = useState(null);

  const institute_uuid = localStorage.getItem("institute_uuid");

  // ✅ Fetch Gallaries
  const fetchGallaries = async () => {
    try {
      const res = await axios.get(`${API_URL}/GetGallaryList/${institute_uuid}`); 
      const gallaryList = Array.isArray(res.data?.result) ? res.data.result : [];
      setGallaries(gallaryList);
    } catch {
      toast.error('Failed to fetch gallaries.');
    }
  };

  useEffect(() => {
    fetchGallaries();
  }, []);

  // ✅ File Change Preview
  const handleFileChange = (e, type, mode = 'create') => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      if (mode === 'create') {
        if (type === 'logo') {
          setLogo(file);
          setPreviewLogo(reader.result);
        } else {
          setSignature(file);
          setPreviewSignature(reader.result);
        }
      } else {
        if (type === 'logo') {
          setEditLogo(file);
          setEditPreviewLogo(reader.result);
        } else {
          setEditSignature(file);
          setEditPreviewSignature(reader.result);
        }
      }
    };
    if (file) reader.readAsDataURL(file);
  };

  // ✅ Create Gallary
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!logo || !signature) return toast.error('Logo and Signature required.');

    const formData = new FormData();
    formData.append('logo', logo);
    formData.append('signature', signature);
    formData.append('institute_uuid', institute_uuid); 

    try {
      await axios.post(API_URL, formData);
      toast.success('Gallary created.');
      setIsCreateModalOpen(false);
      setLogo(null);
      setSignature(null);
      fetchGallaries();
    } catch {
      toast.error('Upload failed.');
    }
  };

  // ✅ Open Edit Modal
  const openEditModal = (g) => {
    setEditId(g._id);
    setEditPreviewLogo(g.logo);
    setEditPreviewSignature(g.signature);
    setEditLogo(null);
    setEditSignature(null);
    setIsEditModalOpen(true);
  };

  // ✅ Edit Gallary
  const handleEditSubmit = async () => {
    const formData = new FormData();
    if (editLogo) formData.append('logo', editLogo);
    if (editSignature) formData.append('signature', editSignature);
    formData.append('institute_uuid', institute_uuid); 

    try {
      await axios.put(`${API_URL}/${editId}`, formData);
      toast.success('Gallary updated.');
      setIsEditModalOpen(false);
      fetchGallaries();
    } catch {
      toast.error('Update failed.');
    }
  };

  // ✅ Delete Gallary
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this gallary?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success('Deleted');
      fetchGallaries();
    } catch {
      toast.error('Delete failed');
    }
  };

  const openImageModal = (src) => {
    setModalImageSrc(src);
    setIsImageModalOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Gallary</h2>

      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="flex-1 p-2 border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + New Gallary
        </button>
      </div>

      <table className="w-full border border-gray-300 rounded-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Logo</th>
            <th className="p-2 border">Signature</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {gallaries
            .filter((g) =>
              [g.logo, g.signature].some((img) =>
                img?.toLowerCase().includes(searchTerm.toLowerCase())
              )
            )
            .map((g) => (
              <tr key={g._id} className="text-center">
                <td className="p-2 border">
                  <img
                    src={g.logo}
                    className="h-12 mx-auto cursor-pointer"
                    onClick={() => openImageModal(g.logo)}
                  />
                </td>
                <td className="p-2 border">
                  <img
                    src={g.signature}
                    className="h-12 mx-auto cursor-pointer"
                    onClick={() => openImageModal(g.signature)}
                  />
                </td>
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() => openEditModal(g)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(g._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
          onClick={() => setIsImageModalOpen(false)}>
          <img
            src={modalImageSrc}
            alt="Full"
            className="max-h-[90vh] max-w-[90vw] rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="absolute top-4 right-4 text-white text-3xl font-bold">&times;</button>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-xl font-semibold mb-4">New Gallary</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <input type="file" accept="image/*"
                onChange={(e) => handleFileChange(e, 'logo', 'create')}
                className="w-full p-2 border border-gray-300 rounded-md" />
              {previewLogo && <img src={previewLogo} alt="Preview Logo" className="h-24 rounded border" />}
              <input type="file" accept="image/*"
                onChange={(e) => handleFileChange(e, 'signature', 'create')}
                className="w-full p-2 border border-gray-300 rounded-md" />
              {previewSignature && <img src={previewSignature} alt="Preview Signature" className="h-24 rounded border" />}
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Edit Gallary</h3>
            <input type="file" accept="image/*"
              onChange={(e) => handleFileChange(e, 'logo', 'edit')}
              className="w-full p-2 border border-gray-300 rounded-md mb-2" />
            {editPreviewLogo && <img src={editPreviewLogo} alt="Edit Logo" className="h-24 rounded border mb-2" />}
            <input type="file" accept="image/*"
              onChange={(e) => handleFileChange(e, 'signature', 'edit')}
              className="w-full p-2 border border-gray-300 rounded-md mb-2" />
            {editPreviewSignature && <img src={editPreviewSignature} alt="Edit Signature" className="h-24 rounded border mb-2" />}
            <div className="flex justify-end space-x-4">
              <button onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
              <button onClick={handleEditSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddGallary;
