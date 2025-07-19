import React from "react";

const ColorInput = ({ label, value, onChange }) => (
  <div className="flex items-center gap-2 mb-3">
    <label className="w-20">{label}</label>
    <input
      type="color"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-8 h-8 p-0 border-none"
    />
  </div>
);

const NumberInput = ({ label, value, onChange, min = 1, max = 100 }) => (
  <div className="flex items-center gap-2 mb-3">
    <label className="w-20">{label}</label>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={e => onChange(Number(e.target.value))}
      className="w-20 border rounded px-2 py-1"
    />
  </div>
);

const RightPanel = ({
  fillColor, setFillColor,
  fontSize, setFontSize,
  strokeColor, setStrokeColor,
  strokeWidth, setStrokeWidth,
  canvasWidth, setCanvasWidth,
  canvasHeight, setCanvasHeight
}) => (
  <aside className="w-56 bg-white shadow-lg p-4 border-l flex flex-col gap-2">
    <h2 className="font-semibold mb-4">Properties</h2>
    <ColorInput label="Fill" value={fillColor} onChange={setFillColor} />
    <ColorInput label="Stroke" value={strokeColor} onChange={setStrokeColor} />
    <NumberInput label="StrokeW" value={strokeWidth} onChange={setStrokeWidth} min={1} max={10} />
    <NumberInput label="FontSize" value={fontSize} onChange={setFontSize} min={8} max={100} />
    <hr className="my-2"/>
    <NumberInput label="Width" value={canvasWidth} onChange={setCanvasWidth} min={100} max={2000} />
    <NumberInput label="Height" value={canvasHeight} onChange={setCanvasHeight} min={100} max={2000} />
  </aside>
);

export default RightPanel;
