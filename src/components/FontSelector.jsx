import React, { useEffect } from "react";
import { fabric } from "fabric";

// Basic set of fonts.  Google fonts are loaded dynamically.
const fonts = ["Arial", "Roboto", "Lobster", "Open Sans", "Montserrat"];

const FontSelector = ({ activeObj, canvas }) => {
  useEffect(() => {
    // Inject link tags for Google Fonts so that they are available on the page
    fonts.forEach((font) => {
      const link = document.createElement("link");
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}&display=swap`;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    });
  }, []);

  if (!activeObj || activeObj.type !== "textbox") return null;

  const refresh = () => canvas?.renderAll();

  const toggle = (prop, value) => {
    if (!activeObj) return;
    const current = activeObj.get(prop);
    activeObj.set(prop, current === value || current === true ? (prop === "underline" ? false : "normal") : value);
    refresh();
  };

  const updateShadow = (updates) => {
    const shadow = activeObj.shadow || new fabric.Shadow({ color: "#000000", blur: 0, offsetX: 0, offsetY: 0 });
    Object.assign(shadow, updates);
    activeObj.set("shadow", shadow);
    refresh();
  };

  return (
    <div className="flex flex-wrap gap-2 items-center text-sm">
      <select
        className="border rounded px-2 py-1"
        onChange={(e) => {
          activeObj.set("fontFamily", e.target.value);
          refresh();
        }}
        defaultValue={activeObj.fontFamily || "Arial"}
      >
        {fonts.map((f) => (
          <option key={f} value={f} style={{ fontFamily: f }}>
            {f}
          </option>
        ))}
      </select>

      {/* Bold/Italic/Underline controls */}
      <button
        className="px-2 py-1 border rounded"
        onClick={() => toggle("fontWeight", "bold")}
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        className="px-2 py-1 border rounded italic"
        onClick={() => toggle("fontStyle", "italic")}
        title="Italic"
      >
        I
      </button>
      <button
        className="px-2 py-1 border rounded underline"
        onClick={() => toggle("underline", true)}
        title="Underline"
      >
        U
      </button>

      {/* Letter spacing */}
      <label className="flex items-center gap-1">
        <span>LS</span>
        <input
          type="number"
          className="w-16 border rounded px-1 py-0.5"
          value={activeObj.charSpacing || 0}
          onChange={(e) => {
            activeObj.set("charSpacing", parseInt(e.target.value, 10) || 0);
            refresh();
          }}
        />
      </label>

      {/* Line height */}
      <label className="flex items-center gap-1">
        <span>LH</span>
        <input
          type="number"
          step="0.1"
          className="w-16 border rounded px-1 py-0.5"
          value={activeObj.lineHeight || 1}
          onChange={(e) => {
            activeObj.set("lineHeight", parseFloat(e.target.value) || 1);
            refresh();
          }}
        />
      </label>

      {/* Text shadow */}
      <label className="flex items-center gap-1">
        <span>Shadow</span>
        <input
          type="color"
          className="border rounded"
          value={activeObj.shadow?.color || "#000000"}
          onChange={(e) => updateShadow({ color: e.target.value })}
        />
        <input
          type="number"
          className="w-14 border rounded px-1 py-0.5"
          placeholder="X"
          value={activeObj.shadow?.offsetX || 0}
          onChange={(e) => updateShadow({ offsetX: parseInt(e.target.value, 10) || 0 })}
        />
        <input
          type="number"
          className="w-14 border rounded px-1 py-0.5"
          placeholder="Y"
          value={activeObj.shadow?.offsetY || 0}
          onChange={(e) => updateShadow({ offsetY: parseInt(e.target.value, 10) || 0 })}
        />
        <input
          type="number"
          className="w-14 border rounded px-1 py-0.5"
          placeholder="Blur"
          value={activeObj.shadow?.blur || 0}
          onChange={(e) => updateShadow({ blur: parseInt(e.target.value, 10) || 0 })}
        />
      </label>
    </div>
  );
};

export default FontSelector;
