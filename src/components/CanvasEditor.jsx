import React, { useState, useEffect } from "react";
import { useCanvasTools } from "../hooks/useCanvasTools";
import CanvasArea from "./CanvasArea";
import RightPanel from "./RightPanel";
import ImageCropModal from "./ImageCropModal";
import Drawer from "./Drawer";

import {
  Trash2,
  RefreshCw,
  Download,
  Crop,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignEndVertical,
  AlignVerticalSpaceAround,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  Settings,
  Lock,
  Unlock,
  Maximize2,
  Group,
} from "lucide-react";

import TextEditToolbar from "./TextEditToolbar";
import ShapeEditToolbar from "./ShapeEditToolbar";
import { fabric } from "fabric";

const CanvasEditor = () => {
  const {
    canvasRef,
    fillColor, setFillColor,
    fontSize, setFontSize,
    strokeColor, setStrokeColor,
    strokeWidth, setStrokeWidth,
    canvasWidth, setCanvasWidth,
    canvasHeight, setCanvasHeight,
    cropSrc, setCropSrc,
    cropCallbackRef,
    addText,
    addRect,
    addCircle,
    addImage,
    cropImage,
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
    bringToFront,
    sendToBack,
  } = useCanvasTools({ width: 400, height: 550 });

  const [showSettings, setShowSettings] = useState(false);
  const [activeObj, setActiveObj] = useState(null);
  const [canvas, setCanvas] = useState(null);
  const [lockedObjects, setLockedObjects] = useState(new Set());

  useEffect(() => {
    if (canvasRef.current) {
      const canvasInstance = canvasRef.current;
      setCanvas(canvasInstance);

      const handleSelection = () => setActiveObj(canvasInstance.getActiveObject());
      canvasInstance.on("selection:created", handleSelection);
      canvasInstance.on("selection:updated", handleSelection);
      canvasInstance.on("selection:cleared", () => setActiveObj(null));

      // Load mockup data (simulate DB fetch)
      const mockData = {
        version: "5.2.4",
        objects: [
          {
            type: "i-text",
            left: 100,
            top: 100,
            text: "Hello from DB!",
            fill: "#FF5733",
            fontSize: 30
          },
          {
            type: "rect",
            left: 200,
            top: 200,
            width: 100,
            height: 80,
            fill: "#007bff",
            stroke: "#333",
            strokeWidth: 2
          },
          {
            type: "circle",
            left: 400,
            top: 100,
            radius: 50,
            fill: "#00cc66",
            stroke: "#000",
            strokeWidth: 3
          },
          {
            type: "image",
            version: "5.2.4",
            left: 50,
            top: 300,
            scaleX: 0.2,
            scaleY: 0.2,
            crossOrigin: "Anonymous",
            src: "https://via.placeholder.com/300.png"
          }
        ]
      };

      canvasInstance.loadFromJSON(mockData, () => {
        canvasInstance.renderAll();
      });

      return () => {
        canvasInstance.off("selection:created", handleSelection);
        canvasInstance.off("selection:updated", handleSelection);
        canvasInstance.off("selection:cleared");
      };
    }
  }, [canvasRef]);

  const handleDelete = () => {
    if (canvas && activeObj) {
      canvas.remove(activeObj);
      setLockedObjects((prev) => {
        const updated = new Set(prev);
        updated.delete(activeObj);
        return updated;
      });
      canvas.discardActiveObject();
      setActiveObj(null);
      canvas.requestRenderAll();
    }
  };

  const handleReset = () => {
    if (canvas) {
      canvas.getObjects().forEach((obj) => canvas.remove(obj));
      setLockedObjects(new Set());
      canvas.discardActiveObject();
      setActiveObj(null);
      canvas.requestRenderAll();
    }
  };

  const toggleLock = (obj) => {
    if (!obj || !canvas) return;
    const isLocked = lockedObjects.has(obj);

    obj.set({
      selectable: !isLocked,
      evented: !isLocked,
      hasControls: !isLocked,
      lockMovementX: isLocked ? false : true,
      lockMovementY: isLocked ? false : true,
      editable: obj.type === "i-text" ? !isLocked : undefined,
    });

    const updatedSet = new Set(lockedObjects);
    isLocked ? updatedSet.delete(obj) : updatedSet.add(obj);
    setLockedObjects(updatedSet);

    canvas.discardActiveObject();
    canvas.requestRenderAll();
  };

  const fitCanvasToObject = () => {
    if (canvas && activeObj) {
      const bounds = activeObj.getBoundingRect();
      setCanvasWidth(bounds.width + 100);
      setCanvasHeight(bounds.height + 100);
      canvas.setWidth(bounds.width + 100);
      canvas.setHeight(bounds.height + 100);
      canvas.centerObject(activeObj);
      canvas.requestRenderAll();
    }
  };

  const groupObjects = () => {
    if (!canvas) return;
    const objs = canvas.getActiveObjects();
    if (objs.length < 2) return;
    const group = new fabric.Group(objs);
    objs.forEach((obj) => canvas.remove(obj));
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
  };

  const ungroupObjects = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active && active.type === "group") {
      const items = active._objects;
      active._restoreObjectsState();
      canvas.remove(active);
      items.forEach((obj) => canvas.add(obj));
      canvas.setActiveObject(new fabric.ActiveSelection(items, { canvas }));
      canvas.requestRenderAll();
    }
  };

  const downloadHighRes = () => {
    if (!canvas) return;
    const scale = 3;
    const tempCanvas = canvas.toCanvasElement(scale);
    const link = document.createElement("a");
    link.download = "canvas-image.png";
    link.href = tempCanvas.toDataURL({ format: "image/png" });
    link.click();
  };

  const isLocked = activeObj && lockedObjects.has(activeObj);
  const multipleSelected = canvas?.getActiveObjects().length > 1;

  return (
  <div className="min-h-screen w-full bg-gray-100 flex flex-col">
    {/* Top Toolbar */}
    <div className="w-full flex justify-between items-center px-4 py-2 bg-white border-b shadow z-20">
      <div className="flex gap-2 items-center overflow-x-auto">
        <button title="Add Text" onClick={addText} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Type size={28} /></button>
        <button title="Add Rectangle" onClick={addRect} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Square size={28} /></button>
        <button title="Add Circle" onClick={addCircle} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Circle size={28} /></button>
        <input type="file" accept="image/*" id="upload-image" style={{ display: "none" }} onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              setCropSrc(reader.result);
              cropCallbackRef.current = (croppedUrl) => {
                addImage(croppedUrl);
              };
            };
            reader.readAsDataURL(file);
          }
        }} />
        <label htmlFor="upload-image" className="p-2 rounded bg-white shadow hover:bg-blue-100 cursor-pointer" title="Upload Image">
          <ImageIcon size={28} />
        </label>
      </div>
      <div className="flex gap-2 items-center">
        <button title="Reset Canvas" onClick={handleReset} className="p-2 rounded-full bg-yellow-500 text-white shadow hover:bg-yellow-600"><RefreshCw size={22} /></button>
        <button title="Download" onClick={downloadHighRes} className="p-2 rounded-full bg-green-600 text-white shadow hover:bg-green-700"><Download size={22} /></button>
      </div>
    </div>

    {/* Selected Object Info Bar */}
    

    {/* Canvas Area */}
    <div className="flex-1 overflow-auto bg-gray-50 p-4">
      <div className="mx-auto w-max max-w-full">
        <CanvasArea ref={canvasRef} width={canvasWidth} height={canvasHeight} />
      </div>
    </div>

    {/* Floating Object Toolbar */}
    {activeObj && (
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-white shadow-lg rounded px-3 py-2 flex flex-wrap justify-center gap-3 items-center max-w-full">
        <button className="p-2" onClick={cropImage} title="Crop"><Crop size={24} /></button>
        <button className="p-2" onClick={handleDelete} title="Delete"><Trash2 size={24} /></button>
        <button className="p-2" onClick={() => toggleLock(activeObj)} title={isLocked ? "Unlock" : "Lock"}>
          {isLocked ? <Unlock size={24} /> : <Lock size={24} />}
        </button>
        <button className="p-2" onClick={() => setShowSettings(true)} title="Settings"><Settings size={24} /></button>
        <button className="p-2" onClick={fitCanvasToObject} title="Fit Canvas"><Maximize2 size={24} /></button>
        {multipleSelected && <button className="p-2" onClick={groupObjects} title="Group"><Group size={24} /></button>}
        {activeObj?.type === "group" && <button className="p-2" onClick={ungroupObjects} title="Ungroup"><RefreshCw size={24} /></button>}
      </div>
    )}

    {/* Text Toolbar */}
    {activeObj?.type === "i-text" && (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-5xl z-50">
        <TextEditToolbar
          obj={activeObj}
          canvas={canvas}
          fillColor={fillColor}
          setFillColor={setFillColor}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />
      </div>
    )}

    {/* Shape Toolbar */}
    {activeObj && ["rect", "circle", "image"].includes(activeObj.type) && (
      <ShapeEditToolbar
        obj={activeObj}
        canvas={canvas}
        fillColor={fillColor}
        setFillColor={setFillColor}
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
      />
    )}

    {/* Image Crop Modal */}
    {cropSrc && (
      <ImageCropModal
        src={cropSrc}
        onCancel={() => {
          setCropSrc(null);
          cropCallbackRef.current = null;
        }}
        onConfirm={(url) => {
          cropCallbackRef.current?.(url);
          setCropSrc(null);
          cropCallbackRef.current = null;
        }}
      />
    )}

    {/* Side Drawer */}
    <Drawer isOpen={showSettings} onClose={() => setShowSettings(false)}>
      <RightPanel
        fillColor={fillColor}
        setFillColor={setFillColor}
        fontSize={fontSize}
        setFontSize={setFontSize}
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        canvasWidth={canvasWidth}
        setCanvasWidth={setCanvasWidth}
        canvasHeight={canvasHeight}
        setCanvasHeight={setCanvasHeight}
      />
    </Drawer>

    {/* Bottom Alignment Toolbar */}
    <div className="fixed bottom-0 w-full bg-white border-t shadow z-30 px-2 py-2 overflow-x-auto scrollbar-thin flex justify-start items-center gap-4">
      <button onClick={alignLeft} title="Align Left"><AlignLeft size={28} /></button>
      <button onClick={alignCenter} title="Align Center"><AlignCenter size={28} /></button>
      <button onClick={alignRight} title="Align Right"><AlignRight size={28} /></button>
      <button onClick={alignTop} title="Align Top"><AlignStartVertical size={28} /></button>
      <button onClick={alignMiddle} title="Align Middle"><AlignVerticalSpaceAround size={28} /></button>
      <button onClick={alignBottom} title="Align Bottom"><AlignEndVertical size={28} /></button>
      <button onClick={bringToFront} title="Bring to Front"><ArrowUpFromLine size={28} /></button>
      <button onClick={sendToBack} title="Send to Back"><ArrowDownToLine size={28} /></button>
    </div>
  </div>
);
}
export default CanvasEditor;

