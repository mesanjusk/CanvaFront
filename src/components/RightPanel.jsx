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
  canvasWidth,
  setCanvasWidth,
  canvasHeight,
  setCanvasHeight,
}) => (
  <div className="w-full md:w-40 bg-gray-100 p-2 flex flex-wrap md:flex-col gap-2">
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
    <label className="text-xs">Width</label>
    <input
      type="number"
      value={canvasWidth}
      onChange={(e) => setCanvasWidth(parseInt(e.target.value, 10))}
      className="p-1 border rounded"
    />
    <label className="text-xs">Height</label>
    <input
      type="number"
      value={canvasHeight}
      onChange={(e) => setCanvasHeight(parseInt(e.target.value, 10))}
      className="p-1 border rounded"
    />
  </div>
);

export default RightPanel;
