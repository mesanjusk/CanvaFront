import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = "https://canvaback.onrender.com/api/gallary";

const AddGallary = ({ onImageSelect }) => {
  const [gallaries, setGallaries] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const institute_uuid = localStorage.getItem("institute_uuid");

  // Fetch list
  const fetchGallaries = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/GetGallaryList/${institute_uuid}`
      );
      setGallaries(Array.isArray(res.data?.result) ? res.data.result : []);
    } catch {
      toast.error("Failed to fetch gallary list");
    }
  };
  useEffect(() => {
    fetchGallaries();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Create new record
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!imageFile) return toast.error("Select an image first");
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("institute_uuid", institute_uuid);

    try {
      await axios.post(API_URL, formData);
      toast.success("Image uploaded");
      setIsCreateModalOpen(false);
      setImageFile(null);
      setPreview(null);
      fetchGallaries();
    } catch {
      toast.error("Upload failed");
    }
  };

  // Edit record
  const openEdit = (g) => {
    setEditId(g._id);
    setPreview(g.image);
    setImageFile(null);
    setIsEditModalOpen(true);
  };

  const handleEdit = async () => {
    if (!imageFile) return toast.error("Choose a new image");
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("institute_uuid", institute_uuid);

    try {
      await axios.put(`${API_URL}/${editId}`, formData);
      toast.success("Image updated");
      setIsEditModalOpen(false);
      setImageFile(null);
      setPreview(null);
      fetchGallaries();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success("Deleted");
      fetchGallaries();
    } catch {
      toast.error("Delete failed");
    }
  };

  // When user clicks an image for template use
  const handleImageSelect = (src) => {
    if (onImageSelect) onImageSelect(src);
    toast.success("Image selected for template");
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Gallery</h2>

      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="mb-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        + New Image
      </button>

      {/* Grid of images */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {gallaries.map((g) => (
          <div
            key={g._id || g.Gallary_uuid}
            className="border rounded overflow-hidden group relative"
          >
            <img
              src={g.image}
              alt="Gallery"
              className="w-full h-48 object-cover cursor-pointer group-hover:scale-105 transition-transform"
              onClick={() => handleImageSelect(g.image)}
              crossOrigin="anonymous"
            />
          
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Image</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full border p-2 rounded"
              />
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="h-40 object-contain rounded"
                />
              )}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Image</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border p-2 rounded"
            />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="h-40 object-contain rounded mt-2"
              />
            )}
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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

export default AddGallary;
