import React, { useState, useEffect } from "react";
import { useCanvasTools } from "../hooks/useCanvasTools";
import Toolbar from "./Toolbar";
import CanvasArea from "./CanvasArea";
import RightPanel from "./RightPanel";
import ImageCropModal from "./ImageCropModal";
import Drawer from "./Drawer";
import { Trash2, RefreshCw } from "lucide-react";
import TextEditToolbar from "./TextEditToolbar";

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

  // Get the fabric canvas instance
  useEffect(() => {
    if (canvasRef.current) {
      setCanvas(canvasRef.current);

      // Listen for object selection changes
      const handler = () => {
        setActiveObj(canvasRef.current.getActiveObject());
      };
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

  // Delete selected object
  const handleDelete = () => {
    if (canvas && activeObj) {
      canvas.remove(activeObj);
      canvas.discardActiveObject();
      setActiveObj(null);
      canvas.requestRenderAll();
    }
  };

  // Reset/canvas clear
  const handleReset = () => {
    if (canvas) {
      canvas.getObjects().forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      setActiveObj(null);
      canvas.requestRenderAll();
    }
  };

  return (
    <div className="flex flex-col h-full pb-20 md:pb-0">
      {/* --- Toolbar at top --- */}
      <div className="w-full flex items-center justify-between px-3 py-2 border-b bg-white z-20">
        <Toolbar
          onAddText={addText}
          onAddRect={addRect}
          onAddCircle={addCircle}
          onAddImage={addImage}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onDownload={download}
          onCropImage={cropImage}
          onAlignLeft={alignLeft}
          onAlignCenter={alignCenter}
          onAlignRight={alignRight}
          onAlignTop={alignTop}
          onAlignMiddle={alignMiddle}
          onAlignBottom={alignBottom}
          onOpenSettings={() => setShowSettings(true)}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            title="Delete selected"
            disabled={!activeObj}
            className={`p-2 rounded-full ${activeObj ? "hover:bg-gray-100" : "opacity-50 cursor-not-allowed"}`}
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={handleReset}
            title="Reset Canvas"
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* --- Canvas area --- */}
      <div className="flex flex-1 bg-gray-50 overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center min-h-0 min-w-0">
          <CanvasArea ref={canvasRef} width={canvasWidth} height={canvasHeight} />
        </div>
        <div className="hidden md:block">
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
        </div>
      </div>

      {/* --- Text edit toolbar below canvas if IText selected --- */}
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

      {/* --- Image Crop Modal --- */}
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

      {/* --- Drawer for mobile settings --- */}
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
