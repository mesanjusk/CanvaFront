import React, { useEffect, useState } from "react";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

const SelectionToolbar = ({ activeObj, canvas }) => {
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!activeObj || !canvas) return;

    const updatePosition = () => {
      const rect = activeObj.getBoundingRect();
      const canvasRect = canvas.upperCanvasEl.getBoundingClientRect();
      setPos({
        left: canvasRect.left + rect.left + rect.width / 2,
        top: canvasRect.top + rect.top,
      });
    };

    updatePosition();
    canvas.on("object:moving", updatePosition);
    canvas.on("object:scaling", updatePosition);
    canvas.on("object:modified", updatePosition);
    return () => {
      canvas.off("object:moving", updatePosition);
      canvas.off("object:scaling", updatePosition);
      canvas.off("object:modified", updatePosition);
    };
  }, [activeObj, canvas]);

  if (!activeObj) return null;

  const isText = activeObj.type === "i-text" || activeObj.type === "text";
  const isRect = activeObj.type === "rect";

  const apply = (props) => {
    activeObj.set(props);
    activeObj.setCoords();
    canvas.requestRenderAll();
  };

  return (
    <div
      className="fixed z-50 bg-white shadow-md rounded-md p-2 flex flex-wrap gap-2 items-center"
      style={{ left: pos.left, top: pos.top, transform: "translate(-50%, -110%)" }}
    >
      <input
        type="color"
        value={typeof activeObj.fill === "string" ? activeObj.fill : "#000000"}
        onChange={(e) => apply({ fill: e.target.value })}
        className="w-8 h-8 p-0 border rounded"
        title="Color"
      />

      {isText && (
        <>
          <input
            type="number"
            value={activeObj.fontSize || 20}
            min={8}
            max={200}
            onChange={(e) => apply({ fontSize: parseInt(e.target.value) || 12 })}
            className="w-14 p-1 border rounded text-xs"
            title="Font size"
          />
          <button
            onClick={() => apply({ fontWeight: activeObj.fontWeight === "bold" ? "normal" : "bold" })}
            className={`p-1 rounded ${activeObj.fontWeight === "bold" ? "bg-gray-200" : ""}`}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => apply({ fontStyle: activeObj.fontStyle === "italic" ? "normal" : "italic" })}
            className={`p-1 rounded ${activeObj.fontStyle === "italic" ? "bg-gray-200" : ""}`}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button onClick={() => apply({ textAlign: "left" })} className="p-1 rounded" title="Align left">
            <AlignLeft size={16} />
          </button>
          <button onClick={() => apply({ textAlign: "center" })} className="p-1 rounded" title="Align center">
            <AlignCenter size={16} />
          </button>
          <button onClick={() => apply({ textAlign: "right" })} className="p-1 rounded" title="Align right">
            <AlignRight size={16} />
          </button>
          <input
            type="range"
            min={-100}
            max={400}
            value={activeObj.charSpacing || 0}
            onChange={(e) => apply({ charSpacing: parseInt(e.target.value) })}
            className="w-20"
            title="Spacing"
          />
        </>
      )}

      {isRect && (
        <input
          type="range"
          min={0}
          max={100}
          value={activeObj.rx || 0}
          onChange={(e) => apply({ rx: parseInt(e.target.value), ry: parseInt(e.target.value) })}
          className="w-20"
          title="Corner radius"
        />
      )}

      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={activeObj.opacity ?? 1}
        onChange={(e) => apply({ opacity: parseFloat(e.target.value) })}
        className="w-20"
        title="Opacity"
      />
    </div>
  );
};

export default SelectionToolbar;
