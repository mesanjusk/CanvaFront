import React from 'react';

const ZoomControls = ({ zoom, setZoom }) => {
  const dec = () => setZoom(z => Math.max(0.1, +(z - 0.1).toFixed(2)));
  const inc = () => setZoom(z => Math.min(3, +(z + 0.1).toFixed(2)));
  return (
    <div className="flex items-center gap-2 p-2">
      <button onClick={dec} className="px-2 py-1 bg-gray-200 rounded">-</button>
      <span className="text-sm">{Math.round(zoom * 100)}%</span>
      <button onClick={inc} className="px-2 py-1 bg-gray-200 rounded">+</button>
    </div>
  );
};

export default ZoomControls;
