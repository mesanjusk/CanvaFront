import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { fabric } from "fabric";

const TemplateManager = () => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize Fabric.js canvas
  useEffect(() => {
    const newCanvas = new fabric.Canvas("template-canvas", {
      width: 600,
      height: 400,
      backgroundColor: "#fff",
    });
    canvasRef.current = newCanvas;
    setCanvas(newCanvas);

    return () => {
      newCanvas.dispose();
    };
  }, []);

  // Fetch templates, categories, subcategories
  useEffect(() => {
    fetchTemplates();
    fetchCategories();
    fetchSubcategories();
  }, []);

  // Filter subcategories based on selected category
  useEffect(() => {
    const filtered = subcategories.filter(
      (sc) =>
        sc.categoryId === category || sc.categoryId?.category_uuid === category
    );
    setFilteredSubcategories(filtered);
    setSubcategory("");
  }, [category, subcategories]);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get("/api/template");
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.templates)
        ? res.data.templates
        : [];

      setTemplates(data);
    } catch (err) {
      console.error("Error fetching templates:", err);
      setTemplates([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        "https://canvaback.onrender.com/api/category/with-usage"
      );
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.result)
        ? res.data.result
        : [];

      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const res = await axios.get(
        "https://canvaback.onrender.com/api/subcategory"
      );
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.subcategories)
        ? res.data.subcategories
        : [];

      setSubcategories(data);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      setSubcategories([]);
    }
  };

  const handleSaveTemplate = async () => {
    if (!title || !category || !subcategory || !price || !imageFile) {
      alert("Please fill all fields and select an image.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("subcategory", subcategory);
      formData.append("price", price);
      formData.append("image", imageFile);
      formData.append(
        "canvasJson",
        JSON.stringify(canvasRef.current.toJSON())
      );

      await axios.post("/api/template/save", formData);
      alert("Template saved!");
      setTitle("");
      setCategory("");
      setSubcategory("");
      setPrice("");
      setImageFile(null);
      fetchTemplates();
    } catch (err) {
      console.error("Error saving template:", err);
      alert("Failed to save template");
    }
    setLoading(false);
  };

  const loadTemplate = async (id) => {
    try {
      const res = await axios.get(`/api/template/${id}`);
      const json = res.data.canvasJson;
      canvas.loadFromJSON(json, () => {
        canvas.renderAll();
      });
    } catch (err) {
      console.error("Error loading template:", err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Template Manager</h2>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 shadow rounded border">
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Template Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select Category</option>
            {Array.isArray(categories) &&
              categories.map((cat) => (
                <option key={cat._id} value={cat.category_uuid}>
                  {cat.name}
                </option>
              ))}
          </select>

          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            disabled={!category}
          >
            <option value="">Select Subcategory</option>
            {Array.isArray(filteredSubcategories) &&
              filteredSubcategories.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
          </select>

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            className="w-full"
          />

          <button
            onClick={handleSaveTemplate}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save Template"}
          </button>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">Canvas Preview:</p>
          <div className="border w-max shadow">
            <canvas id="template-canvas" className="border" />
          </div>
        </div>
      </div>

      {/* Template list */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Saved Templates</h3>
        {Array.isArray(templates) && templates.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl._id}
                className="bg-gray-100 p-3 rounded shadow hover:bg-gray-200 cursor-pointer"
                onClick={() => loadTemplate(tpl._id)}
              >
                <div className="font-medium">{tpl.title}</div>
                <div className="text-xs text-gray-500">
                  {new Date(tpl.createdAt).toLocaleString()}
                </div>
                {tpl.image && (
                  <img
                    src={tpl.image}
                    alt={tpl.title}
                    className="mt-2 w-full h-24 object-cover rounded"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No templates found.</p>
        )}
      </div>
    </div>
  );
};

export default TemplateManager;
