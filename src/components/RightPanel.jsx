import React from 'react';

const RightPanel = ({ fillColor, setFillColor, fontSize, setFontSize }) => (
  <div className="w-40 bg-gray-100 p-2 flex flex-col gap-2">
    <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="h-8 w-full" />
    <input type="number" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value, 10))} className="p-1 border rounded" />
  </div>
);

export default RightPanel;
