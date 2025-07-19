import React, { useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  X,
} from "lucide-react";

// Update object in canvas and re-render
const updateObj = (obj, canvas, props) => {
  obj.set(props);
  canvas.requestRenderAll();
};

// Fonts (including Hindi)
const fonts = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Comic Sans MS",
  "Impact",
  "Verdana",
  "Kalam",
  "Baloo 2",
  "Hind",
  "Noto Sans Devanagari",
  "Tiro Devanagari Hindi",
];

const TextEditToolbar = ({ obj, canvas, fillColor, setFillColor, fontSize, setFontSize }) => {
  const [text, setText] = useState(obj.text || "");
  const [font, setFont] = useState(obj.fontFamily || "Arial");

  useEffect(() => {
    setText(obj.text || "");
    setFont(obj.fontFamily || "Arial");
  }, [obj]);

  return (
    <div className="px-4 py-3 bg-white shadow-md rounded-md border flex flex-wrap gap-3 items-center justify-center">
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          updateObj(obj, canvas, { text: e.target.value });
        }}
        className="border rounded px-2 py-1 text-base w-44"
        placeholder="Edit text"
      />
      <select
        value={font}
        onChange={(e) => {
          setFont(e.target.value);
          updateObj(obj, canvas, { fontFamily: e.target.value });
        }}
        className="border rounded px-2 py-1"
      >
        {fonts.map((f) => (
          <option key={f} value={f} style={{ fontFamily: f }}>
            {f}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={8}
        max={100}
        value={obj.fontSize}
        onChange={(e) => {
          const size = Number(e.target.value);
          setFontSize(size);
          updateObj(obj, canvas, { fontSize: size });
        }}
        className="border rounded px-2 py-1 w-16"
        title="Font Size"
      />
      <input
        type="color"
        value={obj.fill}
        onChange={(e) => {
          const color = e.target.value;
          setFillColor(color);
          updateObj(obj, canvas, { fill: color });
        }}
        className="w-8 h-8 border-none"
        title="Text Color"
      />
      <button
        title="Bold"
        className={`icon-btn ${obj.fontWeight === "bold" ? "bg-gray-200" : ""}`}
        onClick={() =>
          updateObj(obj, canvas, {
            fontWeight: obj.fontWeight === "bold" ? "normal" : "bold",
          })
        }
      >
        <Bold size={18} />
      </button>
      <button
        title="Italic"
        className={`icon-btn ${obj.fontStyle === "italic" ? "bg-gray-200" : ""}`}
        onClick={() =>
          updateObj(obj, canvas, {
            fontStyle: obj.fontStyle === "italic" ? "normal" : "italic",
          })
        }
      >
        <Italic size={18} />
      </button>
      <button
        title="Underline"
        className={`icon-btn ${obj.underline ? "bg-gray-200" : ""}`}
        onClick={() =>
          updateObj(obj, canvas, {
            underline: !obj.underline,
          })
        }
      >
        <Underline size={18} />
      </button>
      <button
        title="Remove Text"
        className="icon-btn text-red-600"
        onClick={() => {
          canvas.remove(obj);
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        }}
      >
        <X size={18} />
      </button>

      <style>{`
        .icon-btn {
          background: none;
          border: none;
          color: #1e293b;
          border-radius: 0.4rem;
          padding: 0.3rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .icon-btn:hover {
          background: #f1f5f9;
        }
        .icon-btn:active {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  );
};

export default TextEditToolbar;
