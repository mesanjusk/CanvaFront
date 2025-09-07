import React, { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react"; 
/**
 * Panel for editing basic shape styles such as fill, opacity and border.
 * Only shown when a shape object (e.g. rect or circle) is selected.
 */
const ShapeStylePanel = ({ activeObj, canvas }) => {
  const [fill, setFill] = useState(activeObj.fill || "#000000");
  const [opacity, setOpacity] = useState(activeObj.opacity ?? 1);
  const [stroke, setStroke] = useState(activeObj.stroke || "#000000");
  const [strokeWidth, setStrokeWidth] = useState(activeObj.strokeWidth || 0);
  const [cornerRadius, setCornerRadius] = useState(
    activeObj.rx || activeObj.ry || 0
  );

  // Sync local state when selection changes
  useEffect(() => {
    setFill(activeObj.fill || "#000000");
    setOpacity(activeObj.opacity ?? 1);
    setStroke(activeObj.stroke || "#000000");
    setStrokeWidth(activeObj.strokeWidth || 0);
    setCornerRadius(activeObj.rx || activeObj.ry || 0);
  }, [activeObj]);

  const update = useCallback(
    (props) => {
      if (!activeObj) return;
      activeObj.set(props);
      activeObj.setCoords();
      canvas.requestRenderAll();
    },
    [activeObj, canvas]
  );

   // Handle close
  const handleClose = () => {
    if (canvas) {
      canvas.discardActiveObject(); // deselect
      canvas.requestRenderAll();
    }
  };

  return (
    <div  className="
        bg-white shadow-lg z-50 space-y-3 text-sm
        md:absolute md:top-4 md:right-4 md:w-60 md:rounded md:p-4
        fixed bottom-0 left-0 right-0 w-full p-3 rounded-t-2xl
      ">
           {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        title="Close"
      >
        <X size={18} />
      </button>
      <div>
        <label className="block text-gray-600 mb-1">Fill</label>
        <input
          type="color"
          value={fill}
          onChange={(e) => {
            setFill(e.target.value);
            update({ fill: e.target.value });
          }}
          className="w-full h-8 border rounded"
        />
      </div>
      <div>
        <label className="block text-gray-600 mb-1">
          Opacity ({Math.round(opacity * 100)}%)
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setOpacity(v);
            update({ opacity: v });
          }}
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-gray-600 mb-1">Border</label>
        <input
          type="color"
          value={stroke}
          onChange={(e) => {
            setStroke(e.target.value);
            update({ stroke: e.target.value });
          }}
          className="w-full h-8 border rounded"
        />
      </div>
      <div>
        <label className="block text-gray-600 mb-1">
          Border Width ({strokeWidth})
        </label>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={strokeWidth}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            setStrokeWidth(v);
            update({ strokeWidth: v });
          }}
          className="w-full"
        />
      </div>
      {activeObj.type === "rect" && (
        <div>
          <label className="block text-gray-600 mb-1">
            Corner Radius ({cornerRadius})
          </label>
          <input
            type="range"
            min="0"
            max={Math.min(activeObj.width, activeObj.height) / 2 || 100}
            step="1"
            value={cornerRadius}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setCornerRadius(v);
              update({ rx: v, ry: v });
            }}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};

export default ShapeStylePanel;

