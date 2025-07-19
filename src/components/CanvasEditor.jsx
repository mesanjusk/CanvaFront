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
import ShapeEditToolbar from "./ShapeEditToolbar"; // Optional for shape editing

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
    <div className="relative h-full w-full bg-gray-100">
      {/* Left Toolbar */}
      <div className="absolute top-20 left-4 z-20 flex flex-col gap-4">
        <button title="Add Text" onClick={addText} className="p-2 rounded-full bg-white shadow hover:bg-blue-100">
          <Type size={20} />
        </button>
        <button title="Add Rectangle" onClick={addRect} className="p-2 rounded-full bg-white shadow hover:bg-blue-100">
          <Square size={20} />
        </button>
        <button title="Add Circle" onClick={addCircle} className="p-2 rounded-full bg-white shadow hover:bg-blue-100">
          <Circle size={20} />
        </button>
        <button title="Add Image" onClick={addImage} className="p-2 rounded-full bg-white shadow hover:bg-blue-100">
          <ImageIcon size={20} />
        </button>
      </div>

      {/* Right Toolbar (Download) */}
      <div className="absolute top-20 right-4 z-20">
        <button title="Download" onClick={download} className="p-3 rounded-full bg-green-600 text-white shadow hover:bg-green-700">
          <Download size={24} />
        </button>
      </div>

      {/* Main Canvas */}
      <div className="flex items-center justify-center h-full">
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
        <TextEditToolbar
          obj={activeObj}
          canvas={canvas}
          fillColor={fillColor}
          setFillColor={setFillColor}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />
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
