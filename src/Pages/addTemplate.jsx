import React, { useState, useRef, useEffect } from "react";
import { fabric } from "fabric";
import toast, { Toaster } from "react-hot-toast";

const AddTemplate = () => {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    title: "",
    category: "",
    subCategory: "",
    price: "",
  });
  
  const [open, setOpen] = useState(false);

  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  // ================== INIT FABRIC ==================
  useEffect(() => {
    const newCanvas = new fabric.Canvas(canvasRef.current, {
      height: 500,
      width: 800,
      backgroundColor: "#fff",
      selection: true,
      preserveObjectStacking: true,
    });

    newCanvas.on("selection:created", (e) => {
      console.log("Selected:", e.selected[0]);
    });

    newCanvas.on("selection:updated", (e) => {
      console.log("Selection updated:", e.selected[0]);
    });

    fabricCanvasRef.current = newCanvas;

    return () => {
      newCanvas.dispose();
    };
  }, []);

  // ================== LOAD TEMPLATES (FAKE FETCH) ==================
  useEffect(() => {
    // TODO: replace with API fetch
    setTemplates([
      {
        _id: "1",
        title: "Birthday Template",
        category: "Birth",
        subCategory: "Party",
        price: 10,
        canvasJson: null, // stored JSON from DB
      },
    ]);
  }, []);

  // ================== EDIT HANDLER ==================
  const handleEdit = (item) => {
    setSelected(item);
    setForm({
      title: item.title,
      category: item.category,
      subCategory: item.subCategory,
      price: item.price,
    });

    // ✅ Load saved canvas JSON
    if (fabricCanvasRef.current && item.canvasJson) {
      try {
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.loadFromJSON(item.canvasJson, () => {
          fabricCanvasRef.current.renderAll();
        });
      } catch (err) {
        console.error("Failed to load template JSON", err);
      }
    } else {
      fabricCanvasRef.current.clear();
    }

    setOpen(true);
  };

  // ================== UPDATE HANDLER ==================
  const handleUpdate = async () => {
    if (!fabricCanvasRef.current) return;

    const updatedJson = fabricCanvasRef.current.toJSON();

    const updated = {
      ...selected,
      ...form,
      canvasJson: updatedJson,
    };

    // TODO: API PUT request here
    console.log("Saving updated template:", updated);

    toast.success("Template updated!");
    setOpen(false);
  };

  // ================== TOOLBAR ACTIONS ==================
  const applyTextStyle = (style, value) => {
    const obj = fabricCanvasRef.current?.getActiveObject();
    if (obj && obj.type === "i-text") {
      obj.set(style, value);
      fabricCanvasRef.current.renderAll();
    }
  };

  return (
    <div className="p-4">
      <Toaster />

      <h2 className="text-xl font-bold mb-3">Templates</h2>

      <div className="grid grid-cols-3 gap-4">
        {templates.map((tpl) => (
          <div
            key={tpl._id}
            className="p-3 border rounded shadow cursor-pointer"
          >
            <h3 className="font-semibold">{tpl.title}</h3>
            <p className="text-sm text-gray-500">
              {tpl.category} / {tpl.subCategory}
            </p>
            <p className="text-sm">₹{tpl.price}</p>
            <button
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
              onClick={() => handleEdit(tpl)}
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {/* ========== MODAL ========== */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg w-[900px]">
            <h2 className="text-lg font-bold mb-3">Edit Template</h2>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                className="border p-2 rounded"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <input
                type="text"
                className="border p-2 rounded"
                placeholder="Category"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              />
              <input
                type="text"
                className="border p-2 rounded"
                placeholder="Subcategory"
                value={form.subCategory}
                onChange={(e) =>
                  setForm({ ...form, subCategory: e.target.value })
                }
              />
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>

            {/* Toolbar */}
            <div className="flex gap-2 mb-3 items-center">
              <input
                type="color"
                onChange={(e) => applyTextStyle("fill", e.target.value)}
              />

              <select
                className="border rounded px-2 py-1"
                onChange={(e) => applyTextStyle("fontFamily", e.target.value)}
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier</option>
                <option value="Verdana">Verdana</option>
                <option value="Georgia">Georgia</option>
              </select>

              <input
                type="number"
                className="border rounded px-2 py-1 w-20"
                placeholder="Size"
                onChange={(e) =>
                  applyTextStyle("fontSize", parseInt(e.target.value, 10))
                }
              />

              <button
                className="px-2 py-1 border rounded"
                onClick={() => {
                  const obj = fabricCanvasRef.current?.getActiveObject();
                  if (obj && obj.type === "i-text") {
                    obj.set(
                      "fontWeight",
                      obj.fontWeight === "bold" ? "normal" : "bold"
                    );
                    fabricCanvasRef.current.renderAll();
                  }
                }}
              >
                B
              </button>

              <button
                className="px-2 py-1 border rounded italic"
                onClick={() => {
                  const obj = fabricCanvasRef.current?.getActiveObject();
                  if (obj && obj.type === "i-text") {
                    obj.set(
                      "fontStyle",
                      obj.fontStyle === "italic" ? "normal" : "italic"
                    );
                    fabricCanvasRef.current.renderAll();
                  }
                }}
              >
                I
              </button>
            </div>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              className="border rounded w-full h-[500px]"
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-3">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleUpdate}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddTemplate;
