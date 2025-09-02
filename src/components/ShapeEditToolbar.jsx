import React from "react";

const ShapeEditToolbar = ({
  obj,
  canvas,
  fillColor,
  setFillColor,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
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
    </div>
  );
};

export default ShapeEditToolbar;
