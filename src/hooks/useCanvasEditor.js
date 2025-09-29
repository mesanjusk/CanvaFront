import { useState, useEffect, useRef } from "react";
import { downloadPDF as pdfExporter, downloadHighRes as highResExporter } from "../utils/downloadUtils";

export function useCanvasEditor(canvasRef, canvasWidth, canvasHeight) {
  const [showSettings, setShowSettings] = useState(false);
  const [activeObj, setActiveObj] = useState(null);
  const [canvas, setCanvas] = useState(null);
  const [lockedObjects, setLockedObjects] = useState(new Set());
  const [history, setHistory] = useState([]);
 const [historyIndex, setHistoryIndex] = useState(-1);

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


  
const historyRaf = useRef(null);

const saveHistory = () => {
  if (!canvas) return;
  if (historyRaf.current) cancelAnimationFrame(historyRaf.current);
  historyRaf.current = requestAnimationFrame(() => {
    historyRaf.current = null;
    sanitizeTextStyles();

    const json = canvas.toJSON();

    setHistory((prev) => {
      // Trim forward history if we undo then add new changes
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, json];
    });

    setHistoryIndex((i) => i + 1);
  });
};

  const resetHistory = () => {
    setHistory([]);
  };

const undo = () => {
  if (historyIndex <= 0 || !canvas) return;

  const prevState = history[historyIndex - 1];
  setHistoryIndex((i) => i - 1);

  canvas.loadFromJSON(prevState, () => {
    canvas.renderAll();
  });
};

const redo = () => {
  if (historyIndex >= history.length - 1 || !canvas) return;

  const nextState = history[historyIndex + 1];
  setHistoryIndex((i) => i + 1);

  canvas.loadFromJSON(nextState, () => {
    canvas.renderAll();
  });
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
    pdfExporter(canvas, canvasWidth, canvasHeight);
  };

  const downloadHighRes = (width, height, filename) => {
    if (!canvas) return;
    sanitizeTextStyles();
    highResExporter(canvas,width, height, filename);
  };


  useEffect(() => {
  if (canvasRef.current) {
    const canvasInstance = canvasRef.current;
    setCanvas(canvasInstance);

    const handleSelection = () =>
      setActiveObj(canvasInstance.getActiveObject());
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

    // 🔹 Track changes for undo/redo
    canvasInstance.on("object:added", saveHistory);
    canvasInstance.on("object:modified", saveHistory);
    canvasInstance.on("object:removed", saveHistory);

    // Initialize with empty state
    const mockData = { version: "5.2.4", objects: [] };
    canvasInstance.loadFromJSON(mockData, () => {
      canvasInstance.renderAll();
      saveHistory(); // 🔹 First state
    });

    return () => {
      canvasInstance.off("selection:created", handleSelection);
      canvasInstance.off("selection:updated", handleSelection);
      canvasInstance.off("selection:cleared");
      canvasInstance.off("object:moving");
      canvasInstance.off("object:added", saveHistory);
      canvasInstance.off("object:modified", saveHistory);
      canvasInstance.off("object:removed", saveHistory);
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
