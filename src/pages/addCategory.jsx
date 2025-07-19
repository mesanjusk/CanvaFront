import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_URL = 'https://canvaback.onrender.com/api/category';

const AddCategory = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [usedCategoryNames, setUsedCategoryNames] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryImage, setEditCategoryImage] = useState(null);
  const [editPreviewImage, setEditPreviewImage] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const user = location.state?.id || localStorage.getItem('User_name');
    if (!user) navigate('/login');
    fetchCategories();
  }, []);

 const fetchCategories = async () => {
  try {
    const res = await axios.get('https://canvaback.onrender.com/api/category/with-usage');

    // Fix: ensure correct extraction
    const categoryList = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.result)
      ? res.data.result
      : [];

    setCategories(categoryList);
    setFilteredCategories(categoryList);
    setUsedCategoryNames(categoryList.map((cat) => cat.name.toLowerCase()));
  } catch (err) {
    toast.error('Failed to fetch categories.');
  }
};


  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const name = categoryName.trim();
    if (!name || !categoryImage) return toast.error('Name and image required.');
    if (usedCategoryNames.includes(name.toLowerCase())) return toast.error('Name already exists.');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', categoryImage);

    try {
      await axios.post(API_URL, formData);
      toast.success('Category created.');
      setCategoryName('');
      setCategoryImage(null);
      setPreviewImage(null);
      setIsCreateModalOpen(false);
      fetchCategories();
    } catch {
      toast.error('Upload failed.');
    }
  };

  const handleFileChange = (e, type = 'create') => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'create') setPreviewImage(reader.result);
      else setEditPreviewImage(reader.result);
    };
    if (file) {
      reader.readAsDataURL(file);
      type === 'create' ? setCategoryImage(file) : setEditCategoryImage(file);
    }
  };

  const openImageModal = (src) => {
    setModalImageSrc(src);
    setIsImageModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditCategoryId(cat._id);
    setEditCategoryName(cat.name);
    setEditPreviewImage(cat.imageUrl);
    setEditCategoryImage(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    const name = editCategoryName.trim();
    if (!name) return toast.error('Name required.');
    if (
      usedCategoryNames.includes(name.toLowerCase()) &&
      name.toLowerCase() !== categories.find((c) => c._id === editCategoryId)?.name.toLowerCase()
    ) return toast.error('Name already exists.');

    const formData = new FormData();
    formData.append('name', name);
    if (editCategoryImage) formData.append('image', editCategoryImage);

    try {
      await axios.put(`${API_URL}/${editCategoryId}`, formData);
      toast.success('Category updated.');
      setIsEditModalOpen(false);
      fetchCategories();
    } catch {
      toast.error('Update failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success('Deleted');
      fetchCategories();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Upload Category</h2>

      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search categories..."
          className="flex-1 p-2 border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + New Category
        </button>
      </div>

      <table className="w-full border border-gray-300 rounded-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Image</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCategories.map((cat) => (
            <tr key={cat._id} className="text-center">
              <td className="p-2 border">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="h-12 mx-auto cursor-pointer"
                  onClick={() => openImageModal(cat.imageUrl)}
                />
              </td>
              <td className="p-2 border">{cat.name}</td>
              <td className="p-2 border space-x-2">
                <button
                  onClick={() => openEditModal(cat)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                {!cat.isUsed && (
                  <button
                    onClick={() => handleDelete(cat._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={() => setIsImageModalOpen(false)}>
          <img
            src={modalImageSrc}
            alt="Category Full View"
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
            <h3 className="text-xl font-semibold mb-4">New Category</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Category Name"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'create')}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              {previewImage && <img src={previewImage} alt="Preview" className="h-24 rounded border" />}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Edit Category</h3>
            <input
              type="text"
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'edit')}
              className="w-full p-2 border border-gray-300 rounded-md mb-2"
            />
            {editPreviewImage && (
              <img src={editPreviewImage} alt="Edit Preview" className="h-24 rounded border mb-2" />
            )}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCategory;
