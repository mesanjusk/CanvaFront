import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { useCanvasTools } from "../hooks/useCanvasTools";
import CanvasArea from "./CanvasArea";
import RightPanel from "./RightPanel";
import ImageCropModal from "./ImageCropModal";
import Drawer from "./Drawer";
import TemplatePanel from "./TemplatePanel";
import UndoRedoControls from "./UndoRedoControls";
import LayerPanel from "./LayerPanel";
import BottomToolbar from "./BottomToolbar";
import FloatingObjectToolbar from "./FloatingObjectToolbar";

import {
  RefreshCw,
  Download,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
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
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const isLocked = activeObj && lockedObjects.has(activeObj);
  const multipleSelected = canvas?.getActiveObjects().length > 1;

  useEffect(() => {
    if (canvasRef.current) {
      const canvasInstance = canvasRef.current;
      setCanvas(canvasInstance);

      const handleSelection = () => setActiveObj(canvasInstance.getActiveObject());
      canvasInstance.on("selection:created", handleSelection);
      canvasInstance.on("selection:updated", handleSelection);
      canvasInstance.on("selection:cleared", () => setActiveObj(null));

      const gridSize = 10;
      canvasInstance.on("object:moving", (e) => {
        e.target.set({
          left: Math.round(e.target.left / gridSize) * gridSize,
          top: Math.round(e.target.top / gridSize) * gridSize,
        });
      });

      canvasInstance.on("object:modified", saveHistory);
      canvasInstance.on("object:added", saveHistory);

      const mockData = {
        version: "5.2.4",
        objects: []
      };

      canvasInstance.loadFromJSON(mockData, () => {
        canvasInstance.renderAll();
        saveHistory();
      });

      return () => {
        canvasInstance.off("selection:created", handleSelection);
        canvasInstance.off("selection:updated", handleSelection);
        canvasInstance.off("selection:cleared");
        canvasInstance.off("object:moving");
        canvasInstance.off("object:modified", saveHistory);
        canvasInstance.off("object:added", saveHistory);
      };
    }
  }, [canvasRef]);

  const saveHistory = () => {
    if (!canvas) return;
    setHistory((prev) => [...prev, canvas.toJSON()]);
    setRedoStack([]);
  };

  const undo = () => {
    if (!history.length || !canvas) return;
    const prevState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setRedoStack((r) => [...r, canvas.toJSON()]);
    canvas.loadFromJSON(prevState, () => canvas.renderAll());
  };

  const redo = () => {
    if (!redoStack.length || !canvas) return;
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setHistory((h) => [...h, canvas.toJSON()]);
    canvas.loadFromJSON(nextState, () => canvas.renderAll());
  };

  const handleDelete = () => {
    if (!canvas || !activeObj) return;
    canvas.remove(activeObj);
    setLockedObjects((prev) => {
      const updated = new Set(prev);
      updated.delete(activeObj);
      return updated;
    });
    canvas.discardActiveObject();
    setActiveObj(null);
    canvas.requestRenderAll();
  };

  const handleReset = () => {
    if (!canvas) return;
    canvas.getObjects().forEach((obj) => canvas.remove(obj));
    setLockedObjects(new Set());
    canvas.discardActiveObject();
    setActiveObj(null);
    canvas.requestRenderAll();
    saveHistory();
  };

  const duplicateObject = () => {
    if (!canvas || !activeObj) return;
    activeObj.clone((cloned) => {
      cloned.set({ left: cloned.left + 20, top: cloned.top + 20 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      saveHistory();
    });
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

  const downloadPDF = () => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: "png" });
    const pdf = new jsPDF("l", "px", [canvasWidth, canvasHeight]);
    pdf.addImage(dataUrl, "PNG", 0, 0, canvasWidth, canvasHeight);
    pdf.save("canvas.pdf");
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

  const loadTemplate = async (templateJson) => {
    if (!canvas) return;
    canvas.loadFromJSON(templateJson, () => {
      canvas.renderAll();
      saveHistory();
    });
  };

  const setBackgroundImage = (url) => {
    if (!canvas) return;
    fabric.Image.fromURL(url, (img) => {
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        scaleX: canvas.width / img.width,
        scaleY: canvas.height / img.height,
      });
      saveHistory();
    });
  };

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
          <TemplatePanel loadTemplate={loadTemplate} />
          <UndoRedoControls undo={undo} redo={redo} duplicateObject={duplicateObject} downloadPDF={downloadPDF} />
        </div>
        <div className="flex gap-2 items-center">
          <button title="Reset Canvas" onClick={handleReset} className="p-2 rounded-full bg-yellow-500 text-white shadow hover:bg-yellow-600"><RefreshCw size={22} /></button>
          <button title="Download PNG" onClick={downloadHighRes} className="p-2 rounded-full bg-green-600 text-white shadow hover:bg-green-700"><Download size={22} /></button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="mx-auto w-max max-w-full">
          <CanvasArea ref={canvasRef} width={canvasWidth} height={canvasHeight} />
        </div>
      </div>

      {/* Floating Object Toolbar */}
      {activeObj && (
        <FloatingObjectToolbar
          activeObj={activeObj}
          cropImage={cropImage}
          handleDelete={handleDelete}
          toggleLock={toggleLock}
          setShowSettings={setShowSettings}
          fitCanvasToObject={fitCanvasToObject}
          isLocked={isLocked}
          multipleSelected={multipleSelected}
          groupObjects={groupObjects}
          ungroupObjects={ungroupObjects}
          canvas={canvas}
        />
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

      {/* Right Settings Drawer */}
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
          setBackgroundImage={setBackgroundImage}
        />
        <LayerPanel canvas={canvas} />
      </Drawer>

      {/* Bottom Toolbar */}
      <BottomToolbar
        alignLeft={alignLeft}
        alignCenter={alignCenter}
        alignRight={alignRight}
        alignTop={alignTop}
        alignMiddle={alignMiddle}
        alignBottom={alignBottom}
        bringToFront={bringToFront}
        sendToBack={sendToBack}
      />
    </div>
  );
};

export default CanvasEditor;
