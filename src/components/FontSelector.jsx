import React from "react";

const fonts = ["Arial", "Roboto", "Lobster"];

const FontSelector = ({ activeObj, canvas }) => (
  <select
    className="border rounded px-2 py-1"
    onChange={(e) => {
      activeObj?.set("fontFamily", e.target.value);
      canvas?.renderAll();
    }}
    defaultValue={activeObj?.fontFamily || "Arial"}
  >
    {fonts.map((f) => (
      <option key={f} value={f} style={{ fontFamily: f }}>
        {f}
      </option>
    ))}
  </select>
);

export default FontSelector;
