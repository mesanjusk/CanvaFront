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
} from "lucide-react";

import TextEditToolbar from "./TextEditToolbar";
import ShapeEditToolbar from "./ShapeEditToolbar";

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
    bringToFront,
    sendToBack,
    download,
    cropImage,
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
  } = useCanvasTools({ width: 500, height: 500 });

  const [showSettings, setShowSettings] = useState(false);
  const [activeObj, setActiveObj] = useState(null);
  const [canvas, setCanvas] = useState(null);
  const [lockedObjects, setLockedObjects] = useState(new Set());

  useEffect(() => {
    if (canvasRef.current) {
      setCanvas(canvasRef.current);
      const handler = () => setActiveObj(canvasRef.current.getActiveObject());
      canvasRef.current.on("selection:created", handler);
      canvasRef.current.on("selection:updated", handler);
      canvasRef.current.on("selection:cleared", () => setActiveObj(null));
      return () => {
        canvasRef.current.off("selection:created", handler);
        canvasRef.current.off("selection:updated", handler);
        canvasRef.current.off("selection:cleared");
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

  const isLocked = activeObj && lockedObjects.has(activeObj);

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      {/* Top Toolbar */}
      <div className="w-full flex justify-between items-center px-4 py-2 bg-white border-b shadow z-20">
        <div className="flex gap-2 items-center overflow-x-auto">
          <button title="Add Text" onClick={addText} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Type size={28} /></button>
          <button title="Add Rectangle" onClick={addRect} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Square size={28} /></button>
          <button title="Add Circle" onClick={addCircle} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Circle size={28} /></button>
          <input
            type="file"
            accept="image/*"
            id="upload-image"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  addImage(reader.result);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          <label htmlFor="upload-image" className="p-2 rounded bg-white shadow hover:bg-blue-100 cursor-pointer" title="Upload Image">
            <ImageIcon size={28} />
          </label>
        </div>

        <div className="flex gap-2 items-center">
          <button title="Reset Canvas" onClick={handleReset} className="p-2 rounded-full bg-yellow-500 text-white shadow hover:bg-yellow-600"><RefreshCw size={22} /></button>
          <button title="Download" onClick={download} className="p-2 rounded-full bg-green-600 text-white shadow hover:bg-green-700"><Download size={22} /></button>
        </div>
      </div>

      {/* Canvas Area (Mobile Fit + Padding + Scroll) */}
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="mx-auto w-max max-w-full">
          <CanvasArea ref={canvasRef} width={canvasWidth} height={canvasHeight} />
        </div>
      </div>

      {/* Bottom Toolbar - Scrollable */}
      <div className="fixed bottom-0 w-full bg-white border-t shadow z-30 px-2 py-2 overflow-x-auto scrollbar-thin flex justify-start items-center gap-3">
        <button onClick={alignLeft} title="Align Left"><AlignLeft size={22} /></button>
        <button onClick={alignCenter} title="Align Center"><AlignCenter size={22} /></button>
        <button onClick={alignRight} title="Align Right"><AlignRight size={22} /></button>
        <button onClick={alignTop} title="Align Top"><AlignStartVertical size={22} /></button>
        <button onClick={alignMiddle} title="Align Middle"><AlignVerticalSpaceAround size={22} /></button>
        <button onClick={alignBottom} title="Align Bottom"><AlignEndVertical size={22} /></button>
        <button onClick={bringToFront} title="Bring to Front"><ArrowUpFromLine size={22} /></button>
        <button onClick={sendToBack} title="Send to Back"><ArrowDownToLine size={22} /></button>
        {activeObj && (
          <>
            <button onClick={cropImage} title="Crop Image"><Crop size={22} /></button>
            <button onClick={handleDelete} title="Delete"><Trash2 size={22} /></button>
            <button onClick={() => toggleLock(activeObj)} title={isLocked ? "Unlock" : "Lock"}>
              {isLocked ? <Unlock size={22} /> : <Lock size={22} />}
            </button>
            <button onClick={() => setShowSettings(true)} title="Settings"><Settings size={22} /></button>
            <button onClick={fitCanvasToObject} title="Fit Canvas to Object"><Maximize2 size={22} /></button>
          </>
        )}
      </div>

      {/* Text/Shape Toolbar */}
      {activeObj?.type === "i-text" && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-5xl z-50">
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

      {/* Crop Modal */}
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

      {/* Settings Panel */}
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
    </div>
  );
};

export default CanvasEditor;
