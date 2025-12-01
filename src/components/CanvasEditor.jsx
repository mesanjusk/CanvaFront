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

const LOCAL_KEY = "localTemplates";

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
  const [activeObj, setActiveObj] = useState(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [templateTitle, setTemplateTitle] = useState("Template 1");
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadError, setLoadError] = useState("");

  const canvasRef = useRef(null);

  // stubbed operations: these should be replaced by your existing hooks
  const addText = () => setActiveObj({ type: "text", text: "New text", fontSize: 20 });
  const addRect = () => setActiveObj({ type: "rect", fill: "#ddd" });
  const addCircle = () => setActiveObj({ type: "circle", fill: "#f00" });
  const addImage = () => setActiveObj({ type: "image" });
  const onImportImage = (e) => {
    const f = e.target.files?.[0];
    if (f) console.log("import", f.name);
  };

  const onSave = () => {
    console.log("save");
  };
  const onDownload = () => {
    console.log("download");
  };
  const onUndo = () => {
    console.log("undo");
  };
  const onRedo = () => {
    console.log("redo");
  };
  const onExport = (opts) => {
    console.log("export", opts);
  };

  // Initialize the Fabric canvas once
  useEffect(() => {
    if (!canvasRef.current) return undefined;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 1120,
      backgroundColor: "#fff",
      preserveObjectStacking: true,
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Load a template when navigating from the gallery or template list
  useEffect(() => {
    if (!fabricCanvas || !templateId) return;
    let cancelled = false;

    const loadFromJson = (json, title) => {
      fabricCanvas.loadFromJSON(json, () => {
        fabricCanvas.renderAll();
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

      leftToolbar={<LeftToolbar addText={addText} addRect={addRect} addCircle={addCircle} addImage={addImage} onImportImage={onImportImage} />}

      viewport={
        <Viewport stageStyle={{ width: 800, height: 1120 }}>
          <canvas ref={canvasRef} style={{ width: 800, height: 1120 }} />
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
