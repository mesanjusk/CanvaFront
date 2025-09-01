import React from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

const ShapeEditToolbar = ({
  obj,
  canvas,
  fillColor,
  setFillColor,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  nudgeImage,
}) => {
  const update = () => {
    canvas.requestRenderAll();
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white shadow-md rounded px-4 py-2 flex gap-4 items-center z-30">
      <div>
        <label className="text-xs">Fill</label>
        <input
          type="color"
          value={fillColor}
          onChange={(e) => {
            setFillColor(e.target.value);
            if (obj.set) obj.set("fill", e.target.value);
            update();
          }}
        />
      </div>
      <div>
        <label className="text-xs">Border</label>
        <input
          type="color"
          value={strokeColor}
          onChange={(e) => {
            setStrokeColor(e.target.value);
            if (obj.set) obj.set("stroke", e.target.value);
            update();
          }}
        />
      </div>
      <div>
        <label className="text-xs">Width</label>
        <input
          type="number"
          value={strokeWidth}
          min={0}
          onChange={(e) => {
            setStrokeWidth(Number(e.target.value));
            if (obj.set) obj.set("strokeWidth", Number(e.target.value));
            update();
          }}
          className="w-16 px-1 border rounded text-sm"
        />
      </div>
      {obj.fill && obj.fill.source && (
        <div className="flex flex-col items-center gap-1">
          <label className="text-xs">Image Pos</label>
          <div className="flex flex-col items-center">
            <button
              onClick={() => nudgeImage(0, -5)}
              className="p-1 border rounded"
            >
              <ArrowUp size={16} />
            </button>
            <div className="flex">
              <button
                onClick={() => nudgeImage(-5, 0)}
                className="p-1 border rounded"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={() => nudgeImage(5, 0)}
                className="p-1 border rounded"
              >
                <ArrowRight size={16} />
              </button>
            </div>
            <button
              onClick={() => nudgeImage(0, 5)}
              className="p-1 border rounded"
            >
              <ArrowDown size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShapeEditToolbar;
