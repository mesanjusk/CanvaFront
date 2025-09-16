import React from "react";
import axios from "axios";
import toast from "react-hot-toast";

const TemplateLayout = ({
  canvas,
  activeTemplateId,
  onSaved,
  children, 
}) => {
  const handleSave = async () => {
    if (!canvas || !activeTemplateId) return;

    try {
       const canvasJson = canvas.toJSON([
        "customId",
        "clipPath",
        "frameOverlay",
        "field",
        "shape",
      ]);

      await axios.put(
        `https://canvaback.onrender.com/api/template/update-canvas/${activeTemplateId}`,
        { canvasJson }
      );
      toast.success("Template layout saved!");
      onSaved?.();
    } catch (err) {
      console.error("Save template failed:", err);
      toast.error("Save failed!");
    }
  };

  return (
    <>
      {children}
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-blue-600 text-white rounded-md shadow"
      >
        Save
      </button>
    </>
  );
};

export default TemplateLayout;
