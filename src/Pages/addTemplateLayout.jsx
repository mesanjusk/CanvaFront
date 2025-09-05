import React from "react";
import axios from "axios";
import toast from "react-hot-toast";

const TemplateLayout = ({
  canvas,
  activeTemplateId,
  tplSize,
  setSavedPlaceholders,
  frameCorner,
  onSaved,
  children, 
}) => {
  const handleSave = async () => {
    if (!canvas || !activeTemplateId) return;

    const placeholders = canvas
      .getObjects()
      .filter((o) => o.customId !== "templateBg" && !o.isFrameSlot)
      .map((obj) => {
        const rawW = obj.width || 0;
        const rawH = obj.height || 0;
        const scaleX = obj.scaleX || 1;
        const scaleY = obj.scaleY || 1;
        return {
          field: obj.field || obj.customId || "unknown",
          type: obj.type,
          left: obj.left,
          top: obj.top,
          scaleX,
          scaleY,
          angle: obj.angle || 0,
          renderedWidth: rawW * scaleX,
          renderedHeight: rawH * scaleY,
          text: obj.text || null,
          fontSize: obj.fontSize || null,
          fill: obj.fill || null,
          fontFamily: obj.fontFamily || null,
          fontWeight: obj.fontWeight || null,
          textAlign: obj.textAlign || null,
          src: obj.type === "image" && obj._element ? obj._element.src : null,
          shape: obj.type === "image" ? obj.shape || null : null,
          frame:
            obj.type === "image" && obj.frameOverlay
              ? {
                  stroke: obj.frameOverlay.stroke,
                  strokeWidth: obj.frameOverlay.strokeWidth,
                  rx: frameCorner,
                  fixed: !obj.frameOverlay.followImage,
                }
              : null,
        };
      });

    try {
      await axios.put(
        `https://canvaback.onrender.com/api/template/update-canvas/${activeTemplateId}`,
        { placeholders, width: tplSize.w, height: tplSize.h }
      );
      setSavedPlaceholders(placeholders);
      toast.success("Template layout saved!");
      onSaved?.();
    } catch (err) {
      console.error("Save template failed:", err);
      toast.error("Save failed!");
    }
  };

  return (
    <>
      
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
