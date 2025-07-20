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

  const sanitizeTextStyles = () => {
    if (!canvas) return;
    canvas.getObjects().forEach(obj => {
      if (obj.type === 'i-text') {
        if (!obj.styles) {
          obj.styles = {};
        }
        const lineCount = obj.text?.split('\n').length || 1;
        for (let i = 0; i < lineCount; i++) {
          if (!obj.styles[i]) {
            obj.styles[i] = {};
          }
        }
      }
    });
  };

  const saveHistory = () => {
    if (!canvas) return;
    sanitizeTextStyles();
    try {
      setHistory((prev) => [...prev, canvas.toJSON()]);
      setRedoStack([]);
    } catch (err) {
      console.error("Error saving history:", err);
    }
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

  const duplicateObject = () => {
    if (!canvas || !activeObj) return;
    sanitizeTextStyles();
    activeObj.clone((cloned) => {
      cloned.set({ left: cloned.left + 20, top: cloned.top + 20 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      saveHistory();
    });
  };

  const downloadPDF = () => {
    if (!canvas) return;
    sanitizeTextStyles();
    const dataUrl = canvas.toDataURL({ format: "png" });
    const pdf = new jsPDF("l", "px", [canvasWidth, canvasHeight]);
    pdf.addImage(dataUrl, "PNG", 0, 0, canvasWidth, canvasHeight);
    pdf.save("design.pdf");
  };

  const downloadHighRes = () => {
    if (!canvas) return;
    sanitizeTextStyles();
    const scale = 3;
    const tempCanvas = canvas.toCanvasElement(scale);
    const link = document.createElement("a");
    link.download = "canvas-image.png";
    link.href = tempCanvas.toDataURL({ format: "image/png" });
    link.click();
  };

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

      const mockData = { version: "5.2.4", objects: [] };

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

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
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
          <TemplatePanel loadTemplate={(templateJson) => {
            if (canvas) {
              canvas.loadFromJSON(templateJson, () => {
                canvas.renderAll();
                saveHistory();
              });
            }
          }} />
          <UndoRedoControls undo={undo} redo={redo} duplicateObject={duplicateObject} downloadPDF={downloadPDF} />
        </div>
        <div className="flex gap-2 items-center">
          <button title="Reset Canvas" onClick={() => {
            canvas?.clear();
            setHistory([]);
            setRedoStack([]);
            saveHistory();
          }} className="p-2 rounded-full bg-yellow-500 text-white shadow hover:bg-yellow-600"><RefreshCw size={22} /></button>
          <button title="Download PNG" onClick={downloadHighRes} className="p-2 rounded-full bg-green-600 text-white shadow hover:bg-green-700"><Download size={22} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="mx-auto w-max max-w-full">
          <CanvasArea ref={canvasRef} width={canvasWidth} height={canvasHeight} />
        </div>
      </div>

      {activeObj && (
        <FloatingObjectToolbar
          activeObj={activeObj}
          cropImage={cropImage}
          handleDelete={() => {
            canvas?.remove(activeObj);
            setActiveObj(null);
            saveHistory();
          }}
          toggleLock={(obj) => {
            const isLocked = lockedObjects.has(obj);
            obj.set({
              selectable: !isLocked,
              evented: !isLocked,
              hasControls: !isLocked,
              lockMovementX: isLocked ? false : true,
              lockMovementY: isLocked ? false : true,
              editable: obj.type === "i-text" ? !isLocked : undefined,
            });
            const updated = new Set(lockedObjects);
            isLocked ? updated.delete(obj) : updated.add(obj);
            setLockedObjects(updated);
            canvas?.discardActiveObject();
            canvas?.requestRenderAll();
          }}
          setShowSettings={setShowSettings}
          fitCanvasToObject={() => {
            const bounds = activeObj.getBoundingRect();
            canvas.setWidth(bounds.width + 100);
            canvas.setHeight(bounds.height + 100);
            canvas.centerObject(activeObj);
            canvas.requestRenderAll();
          }}
          isLocked={isLocked}
          multipleSelected={multipleSelected}
          groupObjects={() => {
            const objs = canvas.getActiveObjects();
            if (objs.length > 1) {
              const group = new fabric.Group(objs);
              objs.forEach(o => canvas.remove(o));
              canvas.add(group);
              canvas.setActiveObject(group);
              canvas.requestRenderAll();
              saveHistory();
            }
          }}
          ungroupObjects={() => {
            const active = canvas.getActiveObject();
            if (active && active.type === "group") {
              const items = active._objects;
              active._restoreObjectsState();
              canvas.remove(active);
              items.forEach(obj => canvas.add(obj));
              canvas.setActiveObject(new fabric.ActiveSelection(items, { canvas }));
              canvas.requestRenderAll();
              saveHistory();
            }
          }}
          canvas={canvas}
        />
      )}

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
          setBackgroundImage={(url) => {
            fabric.Image.fromURL(url, (img) => {
              canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                scaleX: canvas.width / img.width,
                scaleY: canvas.height / img.height,
              });
              saveHistory();
            });
          }}
        />
        <LayerPanel canvas={canvas} />
      </Drawer>

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
