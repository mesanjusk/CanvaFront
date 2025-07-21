import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import toast, { Toaster } from 'react-hot-toast';

const AddTemplate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [existingImageURLs, setExistingImageURLs] = useState([]);
  const [form, setForm] = useState({ title: '', category: '', subcategory: '', price: '' });
  const [image, setImage] = useState();
  const [previewImage, setPreviewImage] = useState();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dropdownData, setDropdownData] = useState({ categories: [], subcategories: [] });
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState(null);

  const fileInputRef = useRef(null);

  const safeExtract = (res) => Array.isArray(res) ? res : res?.result || [];

   useEffect(() => {
  if (fabricCanvasRef.current) {
    fabricCanvasRef.current.dispose();
  }

  const newCanvas = new fabric.Canvas(canvasRef.current, {
    height: 500,
    width: 800,
    backgroundColor: '#fff',
  });

  const rect = new fabric.Rect({
    left: 100,
    top: 100,
    fill: 'red',
    width: 100,
    height: 100,
  });

  newCanvas.add(rect); 

  fabricCanvasRef.current = newCanvas;
}, []);


  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [categoryRes, subcategoryRes, templateRes] = await Promise.all([
          axios.get('https://canvaback.onrender.com/api/category/with-usage'),
          axios.get('https://canvaback.onrender.com/api/subcategory'),
          axios.get('https://canvaback.onrender.com/api/template/')
        ]);
        setDropdownData({
          categories: safeExtract(categoryRes.data),
          subcategories: safeExtract(subcategoryRes.data),
        });
        setTemplates(Array.isArray(templateRes.data) ? templateRes.data : templateRes.data?.result || []);
      } catch (error) {
        toast.error('Failed to fetch dropdown or templates.');
      }
    };
    fetchDropdowns();
  }, []);

 const getCanvasJson = () => {
  try {
    const storedJson = localStorage.getItem("canvasJson");
    return storedJson ? JSON.parse(storedJson) : {};
    
  } catch (err) {
    console.error("Error parsing canvas JSON:", err);
    return {};
  }
};


  const handleInputChange = (field) => (e) => {
    const value = e?.target?.value ?? e;
    if (field === 'price' && value && !/^\d*\.?\d*$/.test(value)) return;
    setForm({ ...form, [field]: value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, or WEBP allowed.');
      return;
    }

    setLoading(true);

    try {
      const compressedBlob = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const compressedFile = new File([compressedBlob], `${Date.now()}-${file.name}`, {
        type: compressedBlob.type,
      });

      setImage(compressedFile);
      setPreviewImage([{ url: URL.createObjectURL(compressedFile) }]);
    } catch (error) {
      toast.error('Image compression failed.');
    }

    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.category || !form.subcategory || !form.price) {
      return toast.error('Fill all fields');
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (image) formData.append("image", image);
   const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const json = canvas.toJSON();
formData.append("canvasJson", JSON.stringify(json));


    if (editingId && existingImageURLs.length > 0) {
      formData.append("existingImages", JSON.stringify(existingImageURLs));
    }

    try {
      if (editingId) {
        await axios.put(`https://canvaback.onrender.com/api/template/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Template updated");
      } else {
        await axios.post("https://canvaback.onrender.com/api/template/save", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total))
        });
        toast.success("Template created");
        localStorage.removeItem("canvasJson");
      }

      setForm({ title: '', category: '', subcategory: '', price: '' });
      setImage();
      setExistingImageURLs([]);
      setPreviewImage([]);
      setUploadProgress(0);
      setEditingId(null);
      setShowModal(false);

      const updated = await axios.get("https://canvaback.onrender.com/api/template/");
      setTemplates(updated.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Submit failed.");
    }
  };

  const getName = (uuid, type) => {
    const list = dropdownData[type];
    const keyMap = { categories: 'category_uuid', subcategories: 'subcategory_uuid' };
    const key = keyMap[type];
    const found = Array.isArray(list) ? list.find(item => item[key] === uuid) : null;
    return found?.name || '';
  };

  const openImageModal = (src) => {
    setModalImageSrc(src);
    setIsImageModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    await axios.delete(`https://canvaback.onrender.com/api/template/${id}`);
    setTemplates(templates.filter(item => item._id !== id));
    toast.success('Template deleted');
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || '',
      category: item.category_uuid || '',
      subcategory: item.subcategory_uuid || '',
      price: item.price || '',
    });
    setImage();
    setExistingImageURLs(item.images || []);
    setPreviewImage((item.images || []).map((url) => ({ url })));
    setShowModal(true);
  };

  const filteredTemplates = templates.filter(item => (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Toaster position="top-right" />
      

    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-gray-800">Upload Template</h1>
      <button onClick={() => setShowModal(true)} className="bg-green-600 text-white px-4 py-2 rounded">+ New Template</button>
    </div>

    {showModal && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow max-w-xl w-full">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Listing' : 'Create New Listing'}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <input type="text" value={form.title} onChange={handleInputChange('title')} className="p-2 border rounded" placeholder="Enter title" required />
            <select value={form.category} onChange={handleInputChange('category')} className="p-2 border rounded" required>
              <option value="">Select Category</option>
              {dropdownData.categories.map(c => <option key={c.category_uuid} value={c.category_uuid}>{c.name}</option>)}
            </select>
            <select value={form.subcategory} onChange={handleInputChange('subcategory')} className="p-2 border rounded" required>
              <option value="">Select Subcategory</option>
              {dropdownData.subcategories.map(s => <option key={s.subcategory_uuid} value={s.subcategory_uuid}>{s.name}</option>)}
            </select>
            <input type="text" value={form.price} onChange={handleInputChange('price')} className="p-2 border rounded" placeholder="Enter price (numeric only)" required />
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="mb-2" />
            {previewImage && previewImage[0] && (
              <div className="relative">
                <img src={previewImage[0].url} className="w-20 h-20 object-cover rounded" alt="preview" />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setPreviewImage([]);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  &times;
                </button>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => setShowModal(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                {loading ? `Uploading... ${uploadProgress}%` : editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    <input type="text" placeholder="Search title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mb-4 p-2 border rounded w-full max-w-md" />

    <table className="w-full border border-gray-300 rounded-md">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 border">Image</th>
          <th className="p-2 border">Title</th>
          <th className="p-2 border">Category</th>
          <th className="p-2 border">Subcategory</th>
          <th className="p-2 border">Price</th>
          <th className="p-2 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredTemplates.map((item, i) => (
          <tr key={i} className="text-center">
            <td className="p-2 border">

              <div className="flex gap-2 justify-center">
                <img
                  src={item.image}
                  alt="Thumb"
                  className="h-12 mx-auto cursor-pointer"
                  onClick={() => openImageModal(image)}
                />


              </div>

            </td>
            <td className="p-2 border">{item.title}</td>
            <td className="p-2 border">{getName(item.category, 'categories')}</td>
            <td className="p-2 border">{getName(item.subCategory, 'subcategories')}</td>
            <td className="p-2 border">{item.price}</td>
            <td className="p-2 border space-x-2">
              <button onClick={() => handleEdit(item)} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">Edit</button>
              <button onClick={() => handleDelete(item._id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
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
          alt="Banner Full View"
          className="max-h-[90vh] max-w-[90vw] rounded shadow-lg"
          onClick={(e) => e.stopPropagation()}
        />
        <button className="absolute top-4 right-4 text-white text-3xl font-bold">&times;</button>
      </div>
    )}
  
    </div>
  );
};

export default AddTemplate;
