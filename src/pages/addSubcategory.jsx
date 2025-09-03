import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const AddSubcategory = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [viewImageModal, setViewImageModal] = useState({ open: false, imageUrl: '' });

  const [editModal, setEditModal] = useState({ open: false, subcategory: null });
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editIsLoading, setEditIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchCategories = () => {
    axios
      .get('https://canvaback.onrender.com/api/category/with-usage')
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.result)
          ? res.data.result
          : [];
        setCategories(data);
      })
      .catch((err) => console.error('Error fetching categories:', err));
  };

  const fetchSubcategories = () => {
    axios
      .get('https://canvaback.onrender.com/api/subcategory')
      .then((res) => setSubcategories(res.data))
      .catch((err) => console.error('Error fetching subcategories:', err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setIsLoading(true);

    if (!name || !image || !categoryId) {
      setStatus('❌ Please provide name, image, and select a category.');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('categoryId', categoryId);
    formData.append('image', image);

    try {
      await axios.post('https://canvaback.onrender.com/api/subcategory', formData);
      setStatus('Subcategory uploaded successfully!');
      setName('');
      setImage(null);
      setCategoryId('');
      fetchSubcategories();
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('❌ Failed to upload subcategory.');
    } finally {
      setIsLoading(false);
      setModalOpen(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) return;
    try {
      await axios.delete(`https://canvaback.onrender.com/api/subcategory/${id}`);
      fetchSubcategories();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const openImageModal = (imageUrl) => setViewImageModal({ open: true, imageUrl });
  const closeImageModal = () => setViewImageModal({ open: false, imageUrl: '' });

  const openEditModal = (sub) => {
    setEditModal({ open: true, subcategory: sub });
    setEditName(sub.name);
    setEditCategoryId(sub.categoryId?.category_uuid || sub.categoryId);
    setEditImage(null);
  };

  const closeEditModal = () => {
    setEditModal({ open: false, subcategory: null });
    setEditName('');
    setEditCategoryId('');
    setEditImage(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditIsLoading(true);

    if (!editName || !editCategoryId) {
      alert('Name and category are required.');
      setEditIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', editName);
    formData.append('categoryId', editCategoryId);
    if (editImage) formData.append('image', editImage);

    try {
      await axios.put(
        `https://canvaback.onrender.com/api/subcategory/${editModal.subcategory._id}`,
        formData
      );
      fetchSubcategories();
      closeEditModal();
    } catch (error) {
      console.error('Edit error:', error);
      alert('Failed to update subcategory.');
    } finally {
      setEditIsLoading(false);
    }
  };

  const filteredSubcategories = subcategories.filter(sub =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-center mb-6">Subcategory List</h2>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search Subcategories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded w-full max-w-sm"
        />
        <button
          onClick={() => setModalOpen(true)}
          className="ml-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + New Subcategory
        </button>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2">Image</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubcategories.length > 0 ? filteredSubcategories.map((sub) => (
              <tr key={sub._id} className="border-t text-sm text-center">
                <td className="p-2 border">
                  <img
                    src={sub.imageUrl}
                    alt={sub.name}
                    width="50"
                    className="h-12 mx-auto cursor-pointer"
                    onClick={() => openImageModal(sub.imageUrl)}
                  />
                </td>
                <td className="p-2 border">{sub.name}</td>
                <td className="p-2 border">
                  {categories.find(cat => cat.category_uuid === sub.categoryId)?.name || 'N/A'}
                </td>
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() => openEditModal(sub)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  {!sub.isUsed && (
                    <button
                      onClick={() => handleDelete(sub._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="text-center text-gray-500 py-4">No subcategories found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg relative">
            <button
              className="absolute top-2 right-4 text-2xl text-gray-500"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-semibold mb-4">New Subcategory</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Subcategory Name"
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              >
                <option value="">-- Select a Category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.category_uuid}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
              <button
                type="submit"
                className={`w-full py-2 text-white rounded-md ${isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
                disabled={isLoading}
              >
                {isLoading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {viewImageModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={closeImageModal}>
          <img
            src={viewImageModal.imageUrl}
            alt="Subcategory"
            className="max-w-full max-h-full rounded"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 text-white text-3xl font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={closeEditModal}>
          <div className="bg-white p-6 rounded shadow-lg space-y-4 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold">Edit Subcategory</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              >
                <option value="">-- Select a Category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.category_uuid}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditImage(e.target.files[0])}
                className="w-full p-3 border border-gray-300 rounded-md"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeEditModal} className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editIsLoading}
                  className={`px-4 py-2 text-white rounded ${editIsLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {editIsLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSubcategory;
