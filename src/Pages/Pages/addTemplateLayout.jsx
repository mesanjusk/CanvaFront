import React, { useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { fabric } from "fabric";
import { Box, Button } from "@mui/material";

const TemplateLayout = ({
  canvas,
  activeTemplateId,
  onSaved,
  children,
}) => {
  // ✅ Patch Fabric once to include custom properties in serialization
  useEffect(() => {
    if (!fabric.Object.prototype._customPatched) {
      fabric.Object.prototype.toObject = (function (toObject) {
        return function (propertiesToInclude) {
          return toObject.call(this, (propertiesToInclude || []).concat([
            "customId",
            "field",
            "shape",
            "frameOverlay",
            "frameSlot",   // 👈 persist frameSlot flag
          ]));
        };
      })(fabric.Object.prototype.toObject);

      fabric.Object.prototype._customPatched = true; // prevent double patch
      console.log("[fabric-debug] Custom props patch applied ✅");
    }
  }, []);

  const handleSave = async () => {
    if (!canvas || !activeTemplateId) return;

    try {
      canvas.renderAll();

      // ✅ Ensure custom props included in JSON
      const canvasJson = canvas.toJSON([
        "customId",
        "clipPath",
        "frameOverlay",
        "field",
        "shape",
        "frameSlot",  // 👈 make sure this is saved
      ]);

      console.log("[save-debug] Saving canvas JSON:", canvasJson);

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
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save
        </Button>
      </Box>
    </>
  );
};

export default TemplateLayout;
