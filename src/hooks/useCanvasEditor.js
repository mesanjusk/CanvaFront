
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { fabric } from "fabric";

export function useCanvasEditor(canvasRef, canvasWidth, canvasHeight) {
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
  canvas.getObjects().forEach((obj) => {
    if (obj.type === "i-text") {
      if (!obj.styles) obj.styles = {};
      const lineCount = obj.text?.split("\n").length || 1;
      for (let i = 0; i < lineCount; i++) {
        if (!obj.styles[i]) obj.styles[i] = {};
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

  const resetHistory = () => {
    setHistory([]);
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

  const duplicateObject = () => {
    if (!canvas || !activeObj) return;
    sanitizeTextStyles();
    activeObj.clone((cloned) => {
      cloned.set({ left: cloned.left  +20, top: cloned.top  +20 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      saveHistory();
    });
  };

  const downloadPDF = () => {
    if (!canvas) return;
    sanitizeTextStyles();
    const prevVpt = canvas.viewportTransform.slice();
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas.toDataURL({ format: "png" });
    const pdf = new jsPDF("l", "px", [canvasWidth, canvasHeight]);
    pdf.addImage(dataUrl, "PNG", 0, 0, canvasWidth, canvasHeight);
    pdf.save("design.pdf");
    canvas.setViewportTransform(prevVpt);
  };

 const downloadHighRes = () => {
  if (!canvas) return;
  sanitizeTextStyles();
  canvas.discardActiveObject();
  canvas.renderAll();
  const prevVpt = canvas.viewportTransform.slice();
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

  requestAnimationFrame(() => {
    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier: 2,
      enableRetinaScaling: false,
    });
    const link = document.createElement("a");
    link.download = "canvas-image.png";
    link.href = dataUrl;
    link.click();
    canvas.setViewportTransform(prevVpt);
    canvas.requestRenderAll();
  });
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
       
      };
    }
  }, [canvasRef]);

  return {
    showSettings,
    setShowSettings,
    activeObj,
    setActiveObj,
    canvas,
    lockedObjects,
    setLockedObjects,
    undo,
    redo,
    duplicateObject,
    downloadPDF,
    downloadHighRes,
    isLocked,
    multipleSelected,
    saveHistory,
    resetHistory,
  };
}
