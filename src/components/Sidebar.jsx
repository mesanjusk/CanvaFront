import React from 'react';

const Sidebar = ({ onAddText, onAddRect, onAddCircle, onAddImage }) => (
  <div className="w-24 bg-gray-100 p-2 flex flex-col gap-2">
    <button onClick={onAddText} className="p-2 bg-blue-500 text-white rounded text-xs">Text</button>
    <button onClick={onAddRect} className="p-2 bg-blue-500 text-white rounded text-xs">Rect</button>
    <button onClick={onAddCircle} className="p-2 bg-blue-500 text-white rounded text-xs">Circle</button>
    <label className="p-2 bg-blue-500 text-white rounded text-xs text-center cursor-pointer">
      Image
      <input type="file" className="hidden" onChange={onAddImage} />
    </label>
  </div>
);

export default Sidebar;
