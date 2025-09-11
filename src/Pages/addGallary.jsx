import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = "https://canvaback.onrender.com/api/gallary";
const acceptTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const AddGallary = ({ onImageSelect }) => {
  const [gallaries, setGallaries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // File input
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const institute_uuid = useMemo(() => localStorage.getItem("institute_uuid"), []);

  const resetFileState = useCallback(() => {
    if (preview && preview.startsWith("blob:")) {
      try { URL.revokeObjectURL(preview); } catch {}
    }
    setImageFile(null);
    setPreview(null);
  }, [preview]);

  const closeCreate = () => { setIsCreateModalOpen(false); resetFileState(); };
  const closeEdit = () => { setIsEditModalOpen(false); setEditId(null); resetFileState(); };

  const validateFile = (file) => {
    if (!file) return false;
    if (!acceptTypes.includes(file.type)) { toast.error("Unsupported file type"); return false; }
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10 MB)"); return false; }
    return true;
  };

  const handleFileChange = (file) => {
    if (!validateFile(file)) return;
    setImageFile(file);
    if (preview && preview.startsWith("blob:")) {
      try { URL.revokeObjectURL(preview); } catch {}
    }
    setPreview(URL.createObjectURL(file));
  };

  // Drag-drop
  const onDrop = (e) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) handleFileChange(f); };
  const onDragOver = (e) => e.preventDefault();

  // Fetch list
  const fetchGallaries = useCallback(async (signal) => {
    if (!institute_uuid) { toast.error("Missing institute id"); return; }
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/GetGallaryList/${institute_uuid}`, { signal });
      setGallaries(Array.isArray(res.data?.result) ? res.data.result : []);
    } catch (err) {
      if (!axios.isCancel(err)) toast.error("Failed to fetch gallery");
      setGallaries([]);
    } finally { setLoading(false); }
  }, [institute_uuid]);

  useEffect(() => {
    const controller = new AbortController();
    fetchGallaries(controller.signal);
    return () => controller.abort();
  }, [fetchGallaries]);

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!imageFile) return toast.error("Select an image first");
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("institute_uuid", institute_uuid);
    try {
      await axios.post(API_URL, formData);
      toast.success("Image uploaded");
      closeCreate();
      fetchGallaries();
    } catch { toast.error("Upload failed"); }
  };

  // Edit
  const openEdit = (g) => { setEditId(g._id || g.Gallary_uuid); resetFileState(); setPreview(g.image); setIsEditModalOpen(true); };
  const handleEdit = async () => {
    if (!editId) return;
    if (!imageFile) return toast.error("Choose a new image");
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("institute_uuid", institute_uuid);
    try {
      await axios.put(`${API_URL}/${editId}`, formData);
      toast.success("Image updated");
      closeEdit();
      fetchGallaries();
    } catch { toast.error("Update failed"); }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this image?")) return;
    try { await axios.delete(`${API_URL}/${id}`); toast.success("Deleted"); fetchGallaries(); }
    catch { toast.error("Delete failed"); }
  };

  // Use
  const useImage = (src) => { if (onImageSelect) onImageSelect(src); toast.success("Image selected for template"); };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Gallery</h2>
        <button onClick={() => setIsCreateModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">+ New Image</button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading images…</div>
      ) : gallaries.length === 0 ? (
        <div className="border rounded p-6 text-center text-sm text-gray-600">No images yet. Click <strong>New Image</strong> to upload.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallaries.map((g) => {
            const id = g._id || g.Gallary_uuid;
            return (
              <div key={id} className="border rounded overflow-hidden group relative bg-white">
                <button type="button" onClick={() => useImage(g.image)} className="block w-full h-48">
                  <img src={g.image} alt="Gallery" className="w-full h-48 object-cover group-hover:scale-105 transition-transform" crossOrigin="anonymous" loading="lazy" />
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity p-2 flex justify-between">
                  <button className="text-xs bg-white text-black px-2 py-1 rounded hover:bg-gray-100" onClick={() => useImage(g.image)}>Use</button>
                  <div className="flex gap-2">
                    <button className="text-xs bg-white text-black px-2 py-1 rounded hover:bg-gray-100" onClick={() => openEdit(g)}>Edit</button>
                    <button className="text-xs bg-rose-600 text-white px-2 py-1 rounded hover:bg-rose-700" onClick={() => handleDelete(id)}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Image</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="w-full border-2 border-dashed rounded p-4 text-center text-sm text-gray-600 hover:bg-gray-50" onDrop={onDrop} onDragOver={onDragOver}>Drag & drop or choose a file</div>
              <input type="file" accept={acceptTypes.join(",")} onChange={(e) => handleFileChange(e.target.files?.[0])} className="w-full border p-2 rounded" />
              {preview && <img src={preview} alt="Preview" className="h-40 object-contain rounded border bg-gray-50 w-full" />}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeCreate} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Upload</button>
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
            <input type="file" accept={acceptTypes.join(",")} onChange={(e) => handleFileChange(e.target.files?.[0])} className="w-full border p-2 rounded" />
            {preview && <img src={preview} alt="Preview" className="h-40 object-contain rounded border bg-gray-50 w-full mt-2" />}
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={closeEdit} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
              <button onClick={handleEdit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddGallary;
