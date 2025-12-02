import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { Typography, Button } from "@mui/material";
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
  const [showHelp, setShowHelp] = useState(false);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [templateTitle, setTemplateTitle] = useState("Template 1");
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadError, setLoadError] = useState("");

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
    duplicateObject,
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
    if (!fabricCanvas || !templateId) return;
    let cancelled = false;

    const loadFromJson = (json, title) => {
      fabricCanvas.loadFromJSON(json, () => {
        fabricCanvas.renderAll();
        resetHistory?.();
        saveHistory?.();
      });
      if (title) setTemplateTitle(title);
    };

    const loadTemplate = async () => {
      setLoadingTemplate(true);
      setLoadError("");

      try {
        const res = await axios.get(`https://canvaback.onrender.com/api/template/${templateId}`);
        const tpl = res.data?.result || res.data;
        if (tpl?.canvasJson && !cancelled) {
          loadFromJson(tpl.canvasJson, tpl.title);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch template, falling back to cache", err);
      }

      try {
        const localTemplates = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
        const cached = localTemplates.find((t) => t._id === templateId || t.id === templateId);
        if (cached?.canvasJson && !cancelled) {
          loadFromJson(cached.canvasJson, cached.title);
          return;
        }
      } catch (err) {
        console.error("Failed to load template from cache", err);
      }

      if (!cancelled) setLoadError("Unable to load the selected template.");
    };

    loadTemplate().finally(() => {
      if (!cancelled) setLoadingTemplate(false);
    });

    return () => {
      cancelled = true;
    };
  }, [fabricCanvas, templateId]);

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
          onToggleHelp={() => setShowHelp(true)}
          showGrid={showGrid}
          onToggleGrid={(v) => setShowGrid(v)}
          snapObjects={snapObjects}
          onToggleSnap={(v) => setSnapObjects(v)}
        />
      }

      leftToolbar={<LeftToolbar addText={addText} addRect={addRect} addCircle={addCircle} addImage={handleAddImageByUrl} onImportImage={handleImportImage} />}

      viewport={
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
        </Viewport>
      }

      rightPanel={<RightInspectorPanel activeObj={activeObj} onUpdate={(patch) => console.log("update", patch)} onClose={() => setActiveObj(null)} />}

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
    />
  );
}

CanvasEditor.propTypes = {
  useCanvasToolsHook: PropTypes.any,
  useCanvasEditorHook: PropTypes.any,
  templateId: PropTypes.string,
};

export default CanvasEditor;
