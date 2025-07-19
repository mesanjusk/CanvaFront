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
  Settings
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
      canvas.discardActiveObject();
      setActiveObj(null);
      canvas.requestRenderAll();
    }
  };

  const handleReset = () => {
    if (canvas) {
      canvas.getObjects().forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      setActiveObj(null);
      canvas.requestRenderAll();
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      {/* Top Toolbar Row */}
      <div className="w-full flex justify-between items-center px-4 py-2 bg-white border-b shadow z-20">
        <div className="flex gap-2 items-center">
          <button title="Add Text" onClick={addText} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Type size={20} /></button>
          <button title="Add Rectangle" onClick={addRect} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Square size={20} /></button>
          <button title="Add Circle" onClick={addCircle} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Circle size={20} /></button>

          {/* Upload Image: hidden input + trigger label */}
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
                  addImage(reader.result); // ✅ now works with updated hook
                };
                reader.readAsDataURL(file);
              }
            }}
          />

          <label htmlFor="upload-image" className="p-2 rounded bg-white shadow hover:bg-blue-100 cursor-pointer" title="Upload Image">
            <ImageIcon size={20} />
          </label>
        </div>

        <div>
          <button title="Download" onClick={download} className="p-3 rounded-full bg-green-600 text-white shadow hover:bg-green-700">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 relative">
        <CanvasArea ref={canvasRef} width={canvasWidth} height={canvasHeight} />
      </div>

      {/* Bottom Toolbar */}
      <div className="fixed bottom-0 w-full bg-white border-t shadow z-30 px-4 py-2 flex justify-center gap-4 flex-wrap">
        <button onClick={alignLeft} title="Align Left"><AlignLeft /></button>
        <button onClick={alignCenter} title="Align Center"><AlignCenter /></button>
        <button onClick={alignRight} title="Align Right"><AlignRight /></button>
        <button onClick={alignTop} title="Align Top"><AlignStartVertical /></button>
        <button onClick={alignMiddle} title="Align Middle"><AlignVerticalSpaceAround /></button>
        <button onClick={alignBottom} title="Align Bottom"><AlignEndVertical /></button>
        <button onClick={bringToFront} title="Bring to Front"><ArrowUpFromLine /></button>
        <button onClick={sendToBack} title="Send to Back"><ArrowDownToLine /></button>
        <button onClick={cropImage} title="Crop Image"><Crop /></button>
        <button onClick={handleDelete} title="Delete" disabled={!activeObj}><Trash2 /></button>
        <button onClick={handleReset} title="Reset"><RefreshCw /></button>
        <button onClick={() => setShowSettings(true)} title="Settings"><Settings /></button>
      </div>

      {/* Edit Toolbars */}
      {activeObj && activeObj.type === "i-text" && (
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

      {/* Mobile Settings Drawer */}
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
