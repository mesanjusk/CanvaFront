import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Layers as LayersIcon, Lock, Unlock } from "lucide-react";

const LayersPanel = ({ canvas, onSelect }) => {
  const [, force] = useState(0);
  const refresh = useCallback(() => force((x) => x + 1), []);

  useEffect(() => {
    if (!canvas) return;
    const rerender = () => refresh();
    canvas.on("object:added", rerender);
    canvas.on("object:removed", rerender);
    canvas.on("object:modified", rerender);
    canvas.on("selection:created", rerender);
    canvas.on("selection:updated", rerender);
    canvas.on("selection:cleared", rerender);
    return () => {
      canvas.off("object:added", rerender);
      canvas.off("object:removed", rerender);
      canvas.off("object:modified", rerender);
      canvas.off("selection:created", rerender);
      canvas.off("selection:updated", rerender);
      canvas.off("selection:cleared", rerender);
    };
  }, [canvas, refresh]);

  const objects = useMemo(() => (canvas ? canvas.getObjects() : []), [canvas, refresh]);
  const setVisible = (obj, v) => { obj.visible = v; obj.dirty = true; canvas.requestRenderAll(); };
  const setLocked = (obj, v) => {
    obj.set({ lockMovementX: v, lockMovementY: v, lockScalingX: v, lockScalingY: v, lockRotation: v, hasControls: !v });
    canvas.requestRenderAll();
  };
  const bringFwd = (obj) => { obj.bringForward(); canvas.requestRenderAll(); };
  const sendBack = (obj) => { obj.sendBackwards(); canvas.requestRenderAll(); };

  const renameLayer = (obj) => {
    const name = prompt("Layer name:", obj.customId || obj.field || obj.type);
    if (name !== null) { obj.customId = name; canvas.requestRenderAll(); }
  };

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <LayersIcon size={16} /> <div className="text-sm font-semibold">Layers</div>
      </div>
      <div className="space-y-2">
        {[...objects].map((o, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 border rounded px-2 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <button className="p-1 rounded hover:bg-gray-100" onClick={() => setVisible(o, !o.visible)} title={o.visible ? "Hide" : "Show"}>
                {o.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button className="p-1 rounded hover:bg-gray-100" onClick={() => setLocked(o, !o.lockMovementX)} title={o.lockMovementX ? "Unlock" : "Lock"}>
                {o.lockMovementX ? <Unlock size={16} /> : <Lock size={16} />}
              </button>
              <div
                className="truncate cursor-pointer text-xs"
                title={o.customId || o.field || o.type}
                onDoubleClick={() => renameLayer(o)}
                onClick={() => { canvas.setActiveObject(o); canvas.requestRenderAll(); onSelect?.(o); }}
              >
                {o.customId || o.field || o.type}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-gray-100" title="Bring forward" onClick={() => bringFwd(o)}>▲</button>
              <button className="p-1 rounded hover:bg-gray-100" title="Send backward" onClick={() => sendBack(o)}>▼</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayersPanel;
