import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { Typography, Button, useMediaQuery, useTheme } from "@mui/material";
import { useParams } from "react-router-dom";
import { fabric } from "fabric";

import EditorShell from "../components/canvas/EditorShell";
import EditorTopBar from "../components/canvas/EditorTopbar";
import LeftToolbar from "../components/canvas/LeftToolbar";
import Viewport from "../components/canvas/Viewport";
import RightInspectorPanel from "../components/canvas/RightInspectorPanel";
import BottomBar from "../components/canvas/Bottombar";
import { useCanvasTools } from "../hooks/useCanvasTools";
import { useCanvasEditor } from "../hooks/useCanvasEditor";
import LayersPanel from "./canvas/LayersPanel";

const LOCAL_KEY = "localTemplates";
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1120;

export function CanvasEditor({
  useCanvasToolsHook = null, // pass in your existing hooks
  useCanvasEditorHook = null,
  templateId: templateIdProp,
}) {
  const params = useParams();
  const templateId = templateIdProp || params.templateId;

  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [snapObjects, setSnapObjects] = useState(true);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [templateTitle, setTemplateTitle] = useState("Template 1");
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  const canvasElementRef = useRef(null);
  const canvasTools = (useCanvasToolsHook || useCanvasTools)({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  });
  const {
    canvasRef,
    addText,
    addRect,
    addCircle,
    addImage: addImageToCanvas,
    download,
  } = canvasTools;

  const canvasEditor = (useCanvasEditorHook || useCanvasEditor)(
    canvasRef,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );
  const {
    activeObj,
    setActiveObj,
    undo,
    redo,
    downloadPDF,
    downloadHighRes,
    saveHistory,
    resetHistory,
  } = canvasEditor;

  const handleImportImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        addImageToCanvas(reader.result);
      }
    };
    reader.readAsDataURL(file);
    // Allow re-uploading the same file
    e.target.value = "";
  };

  const handleAddImageByUrl = () => {
    const url = window.prompt("Enter image URL");
    if (url) addImageToCanvas(url);
  };

  const handleInspectorUpdate = (patch) => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;

    if (patch.action === "replace" || patch.action === "removeBg") {
      // Placeholder for future actions
      return;
    }

    Object.entries(patch).forEach(([key, value]) => {
      obj.set(key, value);
    });
    fabricCanvas.requestRenderAll();
    saveHistory?.();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        addImageToCanvas(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const onSave = () => {
    downloadHighRes?.(CANVAS_WIDTH, CANVAS_HEIGHT, templateTitle || "canvas");
  };
  const onDownload = () => download?.();
  const onUndo = () => undo?.();
  const onRedo = () => redo?.();
  const onExport = (opts) => {
    if (opts?.pdf) {
      downloadPDF?.();
    }
  };

  // Initialize the Fabric canvas once
  useEffect(() => {
    if (!canvasElementRef.current) return undefined;

    const canvas = new fabric.Canvas(canvasElementRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: "#fff",
      preserveObjectStacking: true,
    });

    canvasRef.current = canvas;
    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
  }, [canvasRef]);

  // Load a template when navigating from the gallery or template list
  useEffect(() => {
    if (!fabricCanvas || !templateId) return undefined;
    let cancelled = false;

    const loadFromJson = (json, title) =>
      new Promise((resolve, reject) => {
        try {
          fabricCanvas.clear();
          fabricCanvas.loadFromJSON(json, () => {
            fabricCanvas.renderAll();
            resetHistory?.();
            saveHistory?.();
            resolve();
          });

          if (title) setTemplateTitle(title);
        } catch (err) {
          reject(err);
        }
      });

    const loadTemplate = async () => {
      setLoadingTemplate(true);
      setLoadError("");

      try {
        const res = await axios.get(`https://canvaback.onrender.com/api/template/${templateId}`, {
          timeout: 8000,
        });
        const tpl = res.data?.result || res.data;
        if (tpl?.canvasJson && !cancelled) {
          await loadFromJson(tpl.canvasJson, tpl.title);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch template, falling back to cache", err);
      }

      try {
        const localTemplates = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
        const cached = localTemplates.find((t) => t._id === templateId || t.id === templateId);
        if (cached?.canvasJson && !cancelled) {
          await loadFromJson(cached.canvasJson, cached.title);
          return;
        }
      } catch (err) {
        console.error("Failed to load template from cache", err);
      }

      if (!cancelled) {
        setLoadError("Unable to load the selected template.");
        fabricCanvas.renderAll();
      }
    };

    loadTemplate()
      .catch((err) => {
        console.error("Failed to hydrate template", err);
        if (!cancelled) setLoadError("Unable to load the selected template.");
      })
      .finally(() => {
        if (!cancelled) setLoadingTemplate(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fabricCanvas, resetHistory, saveHistory, templateId]);

  return (
    <EditorShell
      topBar={
        <EditorTopBar
          fileName={templateTitle}
          zoom={zoom}
          onZoomChange={setZoom}
          onSave={onSave}
          onDownload={onDownload}
          onUndo={onUndo}
          onRedo={onRedo}
          onToggleHelp={() => {}}
          showGrid={showGrid}
          onToggleGrid={(v) => setShowGrid(v)}
          snapObjects={snapObjects}
          onToggleSnap={(v) => setSnapObjects(v)}
          onToggleLeftPanel={() => setShowLeftPanel((v) => !v)}
          onToggleRightPanel={() => setShowRightPanel((v) => !v)}
          isMobile={isMobile}
        />
      }

      leftToolbar={
        <LeftToolbar
          addText={addText}
          addRect={addRect}
          addCircle={addCircle}
          addImage={handleAddImageByUrl}
          onImportImage={handleImportImage}
        />
      }

      viewport={
        <div className="w-full h-full" onDrop={handleDrop} onDragOver={handleDragOver}>
          <Viewport stageStyle={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
            <canvas ref={canvasElementRef} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} />
            {loadingTemplate && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded shadow text-sm text-gray-600">
                Loading template...
              </div>
            )}
            {loadError && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 px-3 py-2 rounded text-sm">
                {loadError}
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none border border-dashed border-gray-300" />
          </Viewport>
        </div>
      }

      rightPanel={
        <div className="flex flex-col h-full divide-y">
          <LayersPanel canvas={fabricCanvas} onSelect={setActiveObj} saveHistory={saveHistory} />
          <RightInspectorPanel activeObj={activeObj} onUpdate={handleInspectorUpdate} onClose={() => setActiveObj(null)} />
        </div>
      }

      bottomBar={
        <BottomBar>
          <div className="flex items-center gap-2 w-full">
            <Typography variant="body2" className="ml-2">
              Status: {loadingTemplate ? "Loading..." : "Ready"}
            </Typography>
            <div className="flex-1" />
            <Button size="small" onClick={() => onExport({ pdf: true })}>
              Quick Export PDF
            </Button>
          </div>
        </BottomBar>
      }
      mobileLeftOpen={showLeftPanel}
      mobileRightOpen={showRightPanel}
      onToggleLeft={() => setShowLeftPanel((v) => !v)}
      onToggleRight={() => setShowRightPanel((v) => !v)}
    />
  );
}

CanvasEditor.propTypes = {
  useCanvasToolsHook: PropTypes.any,
  useCanvasEditorHook: PropTypes.any,
  templateId: PropTypes.string,
};

export default CanvasEditor;
