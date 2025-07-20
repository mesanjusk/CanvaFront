
import React from "react";

const LayerPanel = ({ canvas }) => {
  const objects = canvas ? canvas.getObjects() : [];
  return (
    <div className="space-y-1">
      {objects.map((obj, i) => (
        <div key={i} className="flex items-center gap-1 text-sm">
          <span className="flex-1 capitalize">{obj.type}</span>
          <button onClick={() => canvas.bringToFront(obj)} className="px-1">↑</button>
          <button onClick={() => canvas.sendToBack(obj)} className="px-1">↓</button>
        </div>
      ))}
    </div>
  );
};

export default LayerPanel;
