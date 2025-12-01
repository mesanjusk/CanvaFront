import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Eye, EyeOff, Group, Layers as LayersIcon, Lock, Unlock } from "lucide-react";
import { fabric } from "fabric";

const getLabel = (obj) => obj.customId || obj.field || obj.type;
let layerIdCounter = 0;
const getObjectKey = (obj) => {
  if (!obj.__layerId) {
    layerIdCounter += 1;
    obj.__layerId = `layer-${layerIdCounter}`;
  }
  return obj.__layerId;
};

const LayersPanel = ({ canvas, onSelect, saveHistory }) => {
  const [, force] = useState(0);
  const refresh = useCallback(() => force((x) => x + 1), []);

  useEffect(() => {
    if (!canvas) return undefined;
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

  const objects = canvas ? [...canvas.getObjects()].reverse() : [];
  const active = canvas?.getActiveObject();
  const activeObjects = canvas?.getActiveObjects?.() || [];

  const setVisible = (obj, v) => {
    obj.visible = v;
    obj.dirty = true;
    canvas.requestRenderAll();
    saveHistory?.();
  };

  const setLocked = (obj, v) => {
    obj.set({
      lockMovementX: v,
      lockMovementY: v,
      lockScalingX: v,
      lockScalingY: v,
      lockRotation: v,
      hasControls: !v,
    });
    canvas.requestRenderAll();
    saveHistory?.();
  };

  const bringFwd = (obj) => {
    obj.bringForward();
    canvas.requestRenderAll();
    saveHistory?.();
  };

  const sendBack = (obj) => {
    obj.sendBackwards();
    canvas.requestRenderAll();
    saveHistory?.();
  };

  const groupSelection = () => {
    if (!canvas || activeObjects.length <= 1) return;
    const group = new fabric.Group(activeObjects);
    canvas.discardActiveObject();
    activeObjects.forEach((obj) => canvas.remove(obj));
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
    saveHistory?.();
  };

  const ungroupSelection = () => {
    if (!canvas || !active || active.type !== "group") return;
    active.toActiveSelection();
    canvas.requestRenderAll();
    saveHistory?.();
  };

  const renameLayer = (obj) => {
    const name = prompt("Layer name:", getLabel(obj));
    if (name !== null) {
      obj.customId = name;
      canvas.requestRenderAll();
      saveHistory?.();
    }
  };

  return (
    <div className="p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LayersIcon size={16} /> <div className="text-sm font-semibold">Layers</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="px-2 py-1 rounded border text-xs disabled:opacity-50"
            onClick={groupSelection}
            disabled={activeObjects.length <= 1}
            title="Group selected"
          >
            <div className="flex items-center gap-1">
              <Group size={14} /> Group
            </div>
          </button>
          <button
            className="px-2 py-1 rounded border text-xs disabled:opacity-50"
            onClick={ungroupSelection}
            disabled={!active || active.type !== "group"}
            title="Ungroup"
          >
            Ungroup
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {objects.map((o) => (
          <div
            key={getObjectKey(o)}
            className="flex items-center justify-between gap-2 border rounded px-2 py-1 bg-white"
          >
            <div className="flex items-center gap-2 min-w-0">
              <button
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => setVisible(o, !o.visible)}
                title={o.visible ? "Hide" : "Show"}
              >
                {o.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => setLocked(o, !o.lockMovementX)}
                title={o.lockMovementX ? "Unlock" : "Lock"}
              >
                {o.lockMovementX ? <Unlock size={16} /> : <Lock size={16} />}
              </button>
              <div
                className="truncate cursor-pointer text-xs"
                title={getLabel(o)}
                onDoubleClick={() => renameLayer(o)}
                onClick={() => {
                  canvas.setActiveObject(o);
                  canvas.requestRenderAll();
                  onSelect?.(o);
                }}
              >
                {getLabel(o)}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="p-1 rounded hover:bg-gray-100"
                title="Bring forward"
                onClick={() => bringFwd(o)}
              >
                ▲
              </button>
              <button
                className="p-1 rounded hover:bg-gray-100"
                title="Send backward"
                onClick={() => sendBack(o)}
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

LayersPanel.propTypes = {
  canvas: PropTypes.object,
  onSelect: PropTypes.func,
  saveHistory: PropTypes.func,
};

export default LayersPanel;
