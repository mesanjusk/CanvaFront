import React from 'react';

const RightPanel = ({
  fillColor,
  setFillColor,
  fontSize,
  setFontSize,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
}) => (
  <div className="w-40 bg-gray-100 p-2 flex flex-col gap-2">
    <label className="text-xs">Fill</label>
    <input
      type="color"
      value={fillColor}
      onChange={(e) => setFillColor(e.target.value)}
      className="h-8 w-full"
    />
    <label className="text-xs">Stroke</label>
    <input
      type="color"
      value={strokeColor}
      onChange={(e) => setStrokeColor(e.target.value)}
      className="h-8 w-full"
    />
    <label className="text-xs">Stroke Width</label>
    <input
      type="number"
      min="0"
      value={strokeWidth}
      onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
      className="p-1 border rounded"
    />
    <label className="text-xs">Font Size</label>
    <input
      type="number"
      value={fontSize}
      onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
      className="p-1 border rounded"
    />
  </div>
);

export default RightPanel;
