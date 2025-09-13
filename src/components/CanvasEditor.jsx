// CanvasEditor.jsx — updated with Canva-like behaviors, mobile FAB, grid, snapping, filters
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  Fragment,
} from "react";
import toast, { Toaster } from "react-hot-toast";
import { useCanvasEditor } from "../hooks/useCanvasEditor";
import { useCanvasTools } from "../hooks/useCanvasTools";
import { getStoredUser, getStoredInstituteUUID } from "../utils/storageUtils";
import { Button, Stack, Slider, Switch, FormControlLabel } from "@mui/material";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { fabric } from "fabric";
import {
  Menu as MenuIcon,
  RefreshCw,
  Download,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  Crop,
  Trash2,
  Lock,
  Unlock,
  Triangle,
  Hexagon,
  Star,
  Heart,
  Check,
  Move,
  ChevronLeft,
  ChevronRight,
  Images,
  FileDown,
  Layers as LayersIcon,
  Eye,
  EyeOff,
  Group as GroupIcon,
  Ungroup,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  PaintBucket,
  Sparkles,
  Contrast as ContrastIcon,
  Bold,
  Italic,
  Underline,
  CaseUpper,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Ruler
} from "lucide-react";
import { Layout as LayoutIcon, BookOpen, Scissors } from "lucide-react";
import IconButton from "./IconButton";
import CanvasArea from "./CanvasArea";
import ImageCropModal from "./ImageCropModal";
import UndoRedoControls from "./UndoRedoControls";
import { jsPDF } from "jspdf";
import TemplateLayout from "../Pages/addTemplateLayout";
import PrintSettings from "./PrintSettings";
import FrameSection from "./FrameSection";
import ShapeStylePanel from "./ShapeStylePanel";
import { buildClipShape, buildOverlayShape, moveOverlayAboveImage, applyMaskAndFrame, removeMaskAndFrame } from "../utils/shapeUtils";
import { PRESET_SIZES, mmToPx, pxToMm, drawCropMarks, drawRegistrationMark } from "../utils/printUtils";
import { removeBackground } from "../utils/backgroundUtils";
import SelectionToolbar from "./SelectionToolbar";
import BottomNavBar from "./BottomNavBar";

let __CLIPBOARD = null;
/* ===================== Helpers ===================== */
const isText = (o) => o && (o.type === "text" || o.type === "i-text");
const isShape = (o) => o && (o.type === "rect" || o.type === "circle" || o.type === "triangle" || o.type === "polygon" || o.type === "path");

const setGradientFill = (obj, colors = ["#ff6b6b", "#845ef7"]) => {
  if (!obj) return;
  const w = (obj.width || 100) * (obj.scaleX || 1);
  const grad = new fabric.Gradient({
    type: "linear",
    gradientUnits: "pixels",
    coords: { x1: -w / 2, y1: 0, x2: w / 2, y2: 0 },
    colorStops: [{ offset: 0, color: colors[0] }, { offset: 1, color: colors[1] }],
  });
  obj.set("fill", grad);
};

/* ====== Center guides (existing) ====== */
const useSmartGuides = (canvasRef, enable = true, tolerance = 8) => {
  const showV = useRef(false);
  const showH = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enable) return;

    const prevOverlay = canvas._renderOverlay;
    canvas._renderOverlay = function (ctx) {
      if (typeof prevOverlay === "function") prevOverlay.call(this, ctx);
      const w = canvas.getWidth();
      const h = canvas.getHeight();
      ctx.save();
      ctx.strokeStyle = "rgba(99,102,241,0.85)";
      ctx.lineWidth = 1;
      if (showV.current) { ctx.beginPath(); ctx.moveTo(w / 2 + 0.5, 0); ctx.lineTo(w / 2 + 0.5, h); ctx.stroke(); }
      if (showH.current) { ctx.beginPath(); ctx.moveTo(0, h / 2 + 0.5); ctx.lineTo(w, h / 2 + 0.5); ctx.stroke(); }
      ctx.restore();
    };

    const onMove = (e) => {
      const obj = e.target; if (!obj) return;
      const w = canvas.getWidth(), h = canvas.getHeight();
      const nearV = Math.abs(obj.left - w / 2) <= tolerance;
      const nearH = Math.abs(obj.top - h / 2) <= tolerance;
      showV.current = nearV; showH.current = nearH;
      if (nearV) obj.set({ left: Math.round(w / 2) });
      if (nearH) obj.set({ top: Math.round(h / 2) });
    };
    const clear = () => { showV.current = false; showH.current = false; canvas.requestRenderAll(); };

    canvas.on("object:moving", onMove);
    canvas.on("mouse:up", clear);
    return () => {
      canvas.off("object:moving", onMove);
      canvas.off("mouse:up", clear);
      canvas._renderOverlay = prevOverlay;
      canvas.requestRenderAll();
    };
  }, [canvasRef, enable, tolerance]);
};

/* ====== Object-to-object snapping (edges/centers) ====== */
const useObjectSnapping = (canvas, enable = true, tolerance = 6) => {
  const vGuide = useRef(null);
  const hGuide = useRef(null);

  useEffect(() => {
    if (!canvas || !enable) return;

    const prevOverlay = canvas._renderOverlay;
    canvas._renderOverlay = function (ctx) {
      if (typeof prevOverlay === "function") prevOverlay.call(this, ctx);
      ctx.save();
      ctx.strokeStyle = "rgba(99,102,241,0.85)";
      ctx.lineWidth = 1;
      if (vGuide.current !== null) {
        ctx.beginPath();
        ctx.moveTo(vGuide.current + 0.5, 0);
        ctx.lineTo(vGuide.current + 0.5, canvas.getHeight());
        ctx.stroke();
      }
      if (hGuide.current !== null) {
        ctx.beginPath();
        ctx.moveTo(0, hGuide.current + 0.5);
        ctx.lineTo(canvas.getWidth(), hGuide.current + 0.5);
        ctx.stroke();
      }
      ctx.restore();
    };

    const onMove = (e) => {
      const t = e.target;
      if (!t) return;
      const objs = canvas.getObjects().filter((o) => o !== t && !o.isEditing);
      const tRect = t.getBoundingRect(true, true);
      const tCx = tRect.left + tRect.width / 2;
      const tCy = tRect.top + tRect.height / 2;

      let snappedX = null,
        snappedY = null,
        guideX = null,
        guideY = null;
      objs.forEach((o) => {
        const r = o.getBoundingRect(true, true);
        const oCx = r.left + r.width / 2;
        const oCy = r.top + r.height / 2;
        // centers
        if (Math.abs(tCx - oCx) <= tolerance) {
          snappedX = oCx - tRect.width / 2;
          guideX = oCx;
        }
        if (Math.abs(tCy - oCy) <= tolerance) {
          snappedY = oCy - tRect.height / 2;
          guideY = oCy;
        }
        // left/right edges
        if (Math.abs(tRect.left - r.left) <= tolerance) {
          snappedX = r.left;
          guideX = r.left;
        }
        if (Math.abs(tRect.left + tRect.width - (r.left + r.width)) <= tolerance) {
          snappedX = r.left + r.width - tRect.width;
          guideX = r.left + r.width;
        }
        // top/bottom edges
        if (Math.abs(tRect.top - r.top) <= tolerance) {
          snappedY = r.top;
          guideY = r.top;
        }
        if (Math.abs(tRect.top + tRect.height - (r.top + r.height)) <= tolerance) {
          snappedY = r.top + r.height - tRect.height;
          guideY = r.top + r.height;
        }
      });
      if (snappedX !== null) t.set({ left: snappedX });
      if (snappedY !== null) t.set({ top: snappedY });
      vGuide.current = guideX;
      hGuide.current = guideY;
      canvas.requestRenderAll();
    };

    const clearGuides = () => {
      vGuide.current = null;
      hGuide.current = null;
      canvas.requestRenderAll();
    };

    canvas.on("object:moving", onMove);
    canvas.on("mouse:up", clearGuides);
    return () => {
      canvas.off("object:moving", onMove);
      canvas.off("mouse:up", clearGuides);
      canvas._renderOverlay = prevOverlay;
    };
  }, [canvas, enable, tolerance]);
};

/** Layers panel */
const LayersPanel = ({ canvas, onSelect }) => {
  const [, force] = useState(0);
  const refresh = useCallback(() => force(x => x + 1), []);
  useEffect(() => {
    if (!canvas) return;
    const rerender = () => refresh();
    canvas.on("object:added", rerender);
    canvas.on("object:removed", rerender);
    canvas.on("object:modified", rerender);
    canvas.on("selection:created", rerender);
    canvas.on("selection:updated", rerender);
    canvas.on("selection:cleared", rerender);
    return () => {
      canvas.off("object:added", rerender);
      canvas.off("object:removed", rerender);
      canvas.off("object:modified", rerender);
      canvas.off("selection:created", rerender);
      canvas.off("selection:updated", rerender);
      canvas.off("selection:cleared", rerender);
    };
  }, [canvas, refresh]);

  const objects = useMemo(() => canvas ? canvas.getObjects() : [], [canvas, refresh]);
  const setVisible = (obj, v) => { obj.visible = v; obj.dirty = true; canvas.requestRenderAll(); };
  const setLocked = (obj, v) => {
    obj.set({ lockMovementX: v, lockMovementY: v, lockScalingX: v, lockScalingY: v, lockRotation: v, hasControls: !v });
    canvas.requestRenderAll();
  };
  const bringFwd = (obj) => { obj.bringForward(); canvas.requestRenderAll(); };
  const sendBack = (obj) => { obj.sendBackwards(); canvas.requestRenderAll(); };

  const renameLayer = (obj) => {
    const name = prompt("Layer name:", obj.customId || obj.field || obj.type);
    if (name !== null) { obj.customId = name; canvas.requestRenderAll(); }
  };

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <LayersIcon size={16} /> <div className="text-sm font-semibold">Layers</div>
      </div>
      <div className="space-y-2">
        {[...objects].map((o, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 border rounded px-2 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <button className="p-1 rounded hover:bg-gray-100" onClick={() => setVisible(o, !o.visible)} title={o.visible ? "Hide" : "Show"}>
                {o.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button className="p-1 rounded hover:bg-gray-100" onClick={() => setLocked(o, !o.lockMovementX)} title={o.lockMovementX ? "Unlock" : "Lock"}>
                {o.lockMovementX ? <Unlock size={16} /> : <Lock size={16} />}
              </button>
              <div className="truncate cursor-pointer text-xs" title={o.customId || o.field || o.type}
                onDoubleClick={() => renameLayer(o)}
                onClick={() => { canvas.setActiveObject(o); canvas.requestRenderAll(); onSelect?.(o); }}>
                {o.customId || o.field || o.type}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-gray-100" title="Bring forward" onClick={() => bringFwd(o)}>▲</button>
              <button className="p-1 rounded hover:bg-gray-100" title="Send backward" onClick={() => sendBack(o)}>▼</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =============================================================================
   Main Editor
============================================================================= */
const CanvasEditor = ({ templateId: propTemplateId, hideHeader = false }) => {
  const { templateId: routeId } = useParams();
  const templateId = propTemplateId || routeId;
  const [showLogo, setShowLogo] = useState(false);
  const [showSignature, setShowSignature] = useState(false);

  const navigate = useNavigate();


  // template-driven size + responsive fit
  const [tplSize, setTplSize] = useState(() => {
    const h = Math.round(window.innerHeight * 0.75);
    return { w: Math.round(h * 0.75), h };
  });
  const [templateImage, setTemplateImage] = useState(null);
  const viewportRef = useRef(null);
  const stageRef = useRef(null);
  const [zoom, setZoom] = useState(1);

  // Grid state
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);

  // replace image input
  const replaceInputRef = useRef(null);

  // hooks
  const {
    canvasRef,
    cropSrc,
    setCropSrc,
    cropCallbackRef,
    addText,
    addRect,
    addCircle,
    addImage,
    cropImage,
    setCanvasSize,
  } = useCanvasTools({ width: tplSize.w, height: tplSize.h });

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropSrc(reader.result);
        cropCallbackRef.current = (croppedUrl) => addImage(croppedUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const {
    activeObj,
    setActiveObj,
    canvas,
    undo,
    redo,
    duplicateObject,
    downloadPDF,       // existing single-page exporter
    downloadHighRes,
    saveHistory,
    resetHistory,
  } = useCanvasEditor(canvasRef, tplSize.w, tplSize.h);
  // Debounced history saver to avoid perf spikes
  const saveHistoryDebounced = React.useMemo(() => {
    let t;
    return () => { clearTimeout(t); t = setTimeout(() => saveHistory(), 150); };
  }, [saveHistory]);

  // enable guides & snapping
  useSmartGuides(canvasRef, true, 8);
  useObjectSnapping(canvas, true, 6);

  // grid background rendering
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const prevBg = c._renderBackground;
    c._renderBackground = function (ctx) {
      if (typeof prevBg === "function") prevBg.call(this, ctx);
      if (!showGrid) return;
      const w = this.getWidth(), h = this.getHeight();
      ctx.save();
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      for (let x = 0.5; x < w; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0.5; y < h; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.restore();
    };
    c.requestRenderAll();
    return () => { if (!c) return; c._renderBackground = prevBg; c.requestRenderAll(); };
  }, [canvasRef, showGrid, gridSize]);

  const handleZoomChange = (val) => {
    const z = val / 100;
    setZoom(z);
    const c = canvasRef.current;
    if (c) {
      c.setZoom(z);
      const el = c.getElement();
      el.style.width = `${tplSize.w * z}px`;
      el.style.height = `${tplSize.h * z}px`;
      c.renderAll();
    }
  };

  const fitToViewport = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const s = Math.min(vp.clientWidth / tplSize.w, vp.clientHeight / tplSize.h, 1);
    handleZoomChange(s * 100);
  }, [tplSize]);

  useEffect(() => {
    fitToViewport();
  }, [tplSize, fitToViewport]);

  useEffect(() => {
    const onResize = () => fitToViewport();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fitToViewport]);

  useEffect(() => {
    if (canvasRef.current) fitToViewport();
  }, [fitToViewport]);

  const handleSizeChange = (dim, value) => {
    const num = parseInt(value, 10) || 0;
    setTplSize((prev) => {
      const newSize = { ...prev, [dim]: num };
      setCanvasSize?.(newSize.w, newSize.h);
      return newSize;
    });
  };

  // data
  const [allStudents, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [savedPlaceholders, setSavedPlaceholders] = useState([]);
  const [activeStudentPhoto, setActiveStudentPhoto] = useState(null);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showMobileTools, setShowMobileTools] = useState(false);

  // Helper to close the mobile FAB after performing an action
  const withFabClose = (fn) => (...args) => {
    fn(...args);
    if (isMobile) setShowMobileTools(false);
  };

  // gallaries (right sidebar)
  const [gallaries, setGallaries] = useState([]);
  const [activeGallaryId, setActiveGallaryId] = useState(null);
  const [loadingGallary, setLoadingGallary] = useState(false);

  // templates (right sidebar)
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(templateId || null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // bulk mode
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkList, setBulkList] = useState([]); // array of student uuids
  const [bulkIndex, setBulkIndex] = useState(0);
  const studentLayoutsRef = useRef({});

  // UI
  const [isRightbarOpen, setIsRightbarOpen] = useState(false); // right
  const [rightPanel, setRightPanel] = useState(null);

  const [frameShape] = useState("rounded");
  const [frameBorder] = useState("#ffffff");
  const [frameWidth] = useState(6);
  const [frameCorner] = useState(24);
  const [adjustMode, setAdjustMode] = useState(false);

  // Collapsible sections
  const [showFilters, setShowFilters] = useState(true);

  /* ========================= PRINT & IMPOSITION ========================= */
  const [usePrintSizing, setUsePrintSizing] = useState(false);
  const [pagePreset, setPagePreset] = useState("A4");
  const [pageOrientation, setPageOrientation] = useState("portrait"); // portrait|landscape
  const [dpi, setDpi] = useState(300); // 150–600
  const [customPage, setCustomPage] = useState({ w_mm: 210, h_mm: 297 });

  const [bleed, setBleed] = useState({ top: 3, right: 3, bottom: 3, left: 3 });   // mm
  const [safe, setSafe] = useState({ top: 3, right: 3, bottom: 3, left: 3 });     // mm
  const [showMarks, setShowMarks] = useState(true);
  const [showReg, setShowReg] = useState(false);

  // Imposition (sheet)
  const [imposeOn, setImposeOn] = useState(false);
  const [sheetPreset, setSheetPreset] = useState("A4");
  const [sheetCustom, setSheetCustom] = useState({ w_mm: 210, h_mm: 297 });
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [gap, setGap] = useState({ x_mm: 5, y_mm: 5 });
  const [outer, setOuter] = useState({ top: 10, right: 10, bottom: 10, left: 10 });

  // Derived page size (mm) and pixel size per DPI
  const pageMM = useMemo(() => {
    const base = pagePreset === "Custom" ? customPage : PRESET_SIZES[pagePreset] || PRESET_SIZES.A4;
    const { w_mm, h_mm } = base;
    return pageOrientation === "portrait" ? { w_mm, h_mm } : { w_mm: h_mm, h_mm: w_mm };
  }, [pagePreset, pageOrientation, customPage]);

  const contentPx = useMemo(() => ({
    W: mmToPx(pageMM.w_mm, dpi),
    H: mmToPx(pageMM.h_mm, dpi),
  }), [pageMM, dpi]);

  const bleedPx = useMemo(() => ({
    top: mmToPx(bleed.top, dpi),
    right: mmToPx(bleed.right, dpi),
    bottom: mmToPx(bleed.bottom, dpi),
    left: mmToPx(bleed.left, dpi),
  }), [bleed, dpi]);

  const safePx = useMemo(() => ({
    top: mmToPx(safe.top, dpi),
    right: mmToPx(safe.right, dpi),
    bottom: mmToPx(safe.bottom, dpi),
    left: mmToPx(safe.left, dpi),
  }), [safe, dpi]);

  const studentObjectsRef = useRef([]);
  const bgRef = useRef(null);
  const logoRef = useRef(null);
  const signatureRef = useRef(null);

  const getSavedProps = useCallback(
    (field) => savedPlaceholders.find((p) => p.field === field) || null,
    [savedPlaceholders]
  );

  /* ============================ Adjust helpers ============================ */
  const getOverlayBox = (img) => {
    const ov = img?.frameOverlay;
    if (!img || !ov) return null;
    return { w: ov.getScaledWidth(), h: ov.getScaledHeight(), cx: ov.left, cy: ov.top };
  };
  const setImageZoom = (img, zoom) => {
    if (!img) return;
    img.set({ scaleX: zoom, scaleY: zoom });
    img.setCoords();
    canvas.requestRenderAll();
  };
  const fitImageToFrame = (img, mode = "contain") => {
    if (!img) return;
    const box = getOverlayBox(img);
    if (!box) return;
    const iw = img.width;
    const ih = img.height;
    const sx = box.w / iw;
    const sy = box.h / ih;
    const scale = mode === "cover" ? Math.max(sx, sy) : Math.min(sx, sy);
    img.set({
      scaleX: scale,
      scaleY: scale,
      left: box.cx,
      top: box.cy,
      originX: "center",
      originY: "center",
    });
    img.setCoords();
    canvas.requestRenderAll();
  };

  const removeSelectedImageBackground = async () => {
    if (!activeObj || activeObj.type !== "image") {
      toast.error("Select an image first");
      return;
    }
    try {
      const res = await fetch(activeObj.getSrc());
      const blob = await res.blob();
      const bgRemoved = await removeBackground(blob);
      const url = URL.createObjectURL(bgRemoved);
      fabric.Image.fromURL(
        url,
        (img) => {
          img.set({
            left: activeObj.left,
            top: activeObj.top,
            scaleX: activeObj.scaleX,
            scaleY: activeObj.scaleY,
            angle: activeObj.angle,
            originX: "center",
            originY: "center",
          });
          // keep frame if any
          if (activeObj.frameOverlay) {
            img.shape = activeObj.shape;
            img.clipPath = activeObj.clipPath;
            img.frameOverlay = activeObj.frameOverlay;
            if (img.frameOverlay) {
              img.frameOverlay.ownerImage = img;
              moveOverlayAboveImage(canvas, img, img.frameOverlay);
            }
          }
          canvas.remove(activeObj);
          canvas.add(img);
          canvas.setActiveObject(img);
          URL.revokeObjectURL(url);
          saveHistoryDebounced();
        },
        { crossOrigin: "anonymous" }
      );
    } catch (err) {
      console.error(err);
      toast.error("Background removal failed");
    }
  };

  // Replace image while keeping frame/position
  const replaceActiveImage = (file) => {
    if (!activeObj || activeObj.type !== "image") return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      fabric.Image.fromURL(dataUrl, (img) => {
        img.set({
          left: activeObj.left,
          top: activeObj.top,
          scaleX: activeObj.scaleX,
          scaleY: activeObj.scaleY,
          angle: activeObj.angle,
          originX: activeObj.originX,
          originY: activeObj.originY,
        });
        if (activeObj.frameOverlay) {
          img.shape = activeObj.shape;
          img.clipPath = activeObj.clipPath;
          img.frameOverlay = activeObj.frameOverlay;
          img.frameOverlay.ownerImage = img;
          moveOverlayAboveImage(canvas, img, img.frameOverlay);
        }
        canvas.remove(activeObj);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        saveHistoryDebounced();
      }, { crossOrigin: "anonymous" });
    };
    reader.readAsDataURL(file);
  };

  // Image filters for active image
  const [imgFilters, setImgFilters] = useState({ brightness: 0, contrast: 0, saturation: 0 });
  const applyImageFilters = (img) => {
    if (!img || img.type !== "image") return;
    const { Brightness, Contrast, Saturation } = fabric.Image.filters;
    const f = [];
    if (imgFilters.brightness !== 0) f.push(new Brightness({ brightness: imgFilters.brightness }));
    if (imgFilters.contrast !== 0) f.push(new Contrast({ contrast: imgFilters.contrast }));
    if (imgFilters.saturation !== 0) f.push(new Saturation({ saturation: imgFilters.saturation }));
    img.filters = f;
    img.applyFilters();
    canvas.requestRenderAll();
  };
  useEffect(() => { if (activeObj && activeObj.type === "image") applyImageFilters(activeObj); }, [imgFilters]); // eslint-disable-line

  // Canva-like: Adjust mode freezes frame; image draggable/scalable inside
  const enterAdjustMode = (img) => {
    if (!img) return;
    const stroke = img.frameOverlay?.stroke ?? frameBorder;
    const strokeWidth = img.frameOverlay?.strokeWidth ?? frameWidth;
    const rx = frameCorner;

    const w = img.frameOverlay ? img.frameOverlay.getScaledWidth() : img.getScaledWidth();
    const h = img.frameOverlay ? img.frameOverlay.getScaledHeight() : img.getScaledHeight();
    const clip = buildClipShape(img.shape || frameShape, w, h, { rx });
    clip.set({
      absolutePositioned: true,
      originX: "center",
      originY: "center",
      left: img.frameOverlay ? img.frameOverlay.left : img.left,
      top: img.frameOverlay ? img.frameOverlay.top : img.top,
      angle: img.frameOverlay ? img.frameOverlay.angle : img.angle,
    });
    img.clipPath = clip;

    if (!img.frameOverlay) {
      applyMaskAndFrame(canvas, img, img.shape || frameShape, {
        stroke,
        strokeWidth,
        rx,
        absolute: true,
        followImage: false,
      });
    } else {
      img.frameOverlay.isFrameOverlay = true;
      img.frameOverlay.ownerImage = img;
      img.frameOverlay.followImage = false; // freeze while adjusting
      img.frameOverlay.set({ selectable: false, evented: false, hoverCursor: "default" });
    }

    // Now image moves freely under mask
    img.set({
      lockMovementX: false,
      lockMovementY: false,
      lockScalingX: false,
      lockScalingY: false,
      lockRotation: false,
      hasControls: true,
      selectable: true,
      evented: true,
    });

    setAdjustMode(true);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
  };

  const exitAdjustMode = (img) => {
    if (!img) return;
    const stroke = img.frameOverlay?.stroke ?? frameBorder;
    const strokeWidth = img.frameOverlay?.strokeWidth ?? frameWidth;
    const rx = frameCorner;

    // Back to normal: overlay follows image (move whole unit)
    applyMaskAndFrame(canvas, img, img.shape || frameShape, {
      stroke,
      strokeWidth,
      rx,
      absolute: false,
      followImage: true,
    });

    // allow moving/scaling whole unit
    img.set({
      lockMovementX: false,
      lockMovementY: false,
      lockScalingX: false,
      lockScalingY: false,
      lockRotation: false,
      hasControls: true,
    });

    setAdjustMode(false);
    canvas.requestRenderAll();
  };

  /* ====================== Frame slot creation & snapping =================== */
  const addFrameSlot = (shapeType) => {
    if (!canvas) return;
    const w = 240,
      h = 240;
    const overlay = buildOverlayShape(shapeType, w, h, {
      rx: frameCorner,
      stroke: "#7c3aed",
      strokeWidth: 2,
      dashed: true,
    });
    overlay.set({
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      originX: "center",
      originY: "center",
      selectable: true,
      evented: true,
      hoverCursor: "move",
    });
    overlay.shapeType = shapeType;
    overlay.isFrameSlot = true;
    canvas.add(overlay);
    canvas.setActiveObject(overlay);
    canvas.requestRenderAll();
    saveHistoryDebounced();
  };

  const intersects = (a, b) => {
    const r1 = a.getBoundingRect(true, true);
    const r2 = b.getBoundingRect(true, true);
    return !(
      r2.left > r1.left + r1.width ||
      r2.left + r2.width < r1.left ||
      r2.top > r1.top + r1.height ||
      r2.top + r2.height < r1.top
    );
  };

  const snapImageToNearestSlot = (img) => {
    if (!canvas) return;
    const slots = canvas.getObjects().filter((o) => o.isFrameSlot);
    if (!slots.length) return;

    const hit = slots.find((slot) => intersects(img, slot));
    if (!hit) return;

    hit.isFrameSlot = false;
    hit.isFrameOverlay = true;
    hit.ownerImage = img;
    hit.followImage = true;
    hit.set({ strokeDashArray: null, selectable: false, evented: false, hoverCursor: "default" });

    const w = hit.getScaledWidth();
    const h = hit.getScaledHeight();
    const clip = buildClipShape(hit.shapeType || frameShape, w, h, { rx: frameCorner });
    clip.set({
      absolutePositioned: true,
      originX: hit.originX,
      originY: hit.originY,
      left: hit.left,
      top: hit.top,
      angle: hit.angle || 0,
    });
    img.clipPath = clip;
    img.shape = hit.shapeType || frameShape;

    img.set({ left: hit.left, top: hit.top, originX: "center", originY: "center" });
    canvas.requestRenderAll();
    const box = { w, h, cx: hit.left, cy: hit.top };
    const sx = box.w / img.width;
    const sy = box.h / img.height;
    const scale = Math.max(sx, sy);
    img.set({ scaleX: scale, scaleY: scale, left: box.cx, top: box.cy });
    img.setCoords();

    img.frameOverlay = hit;
    moveOverlayAboveImage(canvas, img, hit);

    exitAdjustMode(img);
    setAdjustMode(false);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
    saveHistoryDebounced();
  };

  useEffect(() => {
    if (!canvas) return;

    const handleSelect = () => setShowToolbar(true);
    const handleClear = () => setShowToolbar(false);

    canvas.on("selection:created", handleSelect);
    canvas.on("selection:updated", handleSelect);
    canvas.on("selection:cleared", handleClear);

    return () => {
      canvas.off("selection:created", handleSelect);
      canvas.off("selection:updated", handleSelect);
      canvas.off("selection:cleared", handleClear);
    };
  }, [canvas]);

  /* ============================== Data loading ============================ */
  useEffect(() => {
    const fetchCoursesAndBatches = async () => {
      try {
        const [courseRes, batchRes] = await Promise.all([
          axios.get("https://socialbackend-iucy.onrender.com/api/courses"),
          axios.get("https://socialbackend-iucy.onrender.com/api/batches"),
        ]);
        setCourses(courseRes.data || []);
        setBatches(batchRes.data || []);
      } catch {
        toast.error("Error loading courses/batches");
      }
    };
    fetchCoursesAndBatches();
  }, []);

  useEffect(() => {
    axios
      .get("https://canvaback.onrender.com/api/students")
      .then((res) => setStudents(res.data.data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!selectedCourse || !selectedBatch) {
      setFilteredStudents([]);
      return;
    }
    const fetchAdmissions = async () => {
      try {
        const res = await axios.get(
          `https://canvaback.onrender.com/api/admissions?course=${selectedCourse}&batchTime=${selectedBatch}`
        );
        const admissionData = res.data.data || [];
        const studentList = admissionData.map((a) => a.student).filter(Boolean);
        setFilteredStudents(studentList);
      } catch {
        toast.error("Error loading admissions");
      }
    };
    fetchAdmissions();
  }, [selectedCourse, selectedBatch]);

  const handleStudentSelect = (uuid) => {
    const student = filteredStudents.find((s) => s.uuid === uuid);
    setSelectedStudent(student || null);
  };

  useEffect(() => {
    const fetchInstitute = async () => {
      try {
        const user = getStoredUser();
        const institute_uuid = user?.institute_uuid || getStoredInstituteUUID();
        if (institute_uuid) {
          const res = await axios.get(
            `https://canvaback.onrender.com/api/institute/${institute_uuid}`
          );
          const institute = res.data.result || res.data.data || res.data;
          setSelectedInstitute({
            ...institute,
            logo: institute.logo || null,
            signature: institute.signature || null,
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchInstitute();
  }, []);

  // Gallary list (for right sidebar)
useEffect(() => {
  const loadGallaries = async () => {
    try {
      const user = getStoredUser();
      const institute_uuid =
        user?.institute_uuid || getStoredInstituteUUID();

      const { data } = await axios.get(
        `https://canvaback.onrender.com/api/gallary/GetGallaryList/${institute_uuid}`
      );

      // Ensure we always pass an array to state
      const list = Array.isArray(data?.result)
        ? data.result
        : Array.isArray(data)
        ? data
        : [];

      setGallaries(list);
    } catch (err) {
      console.error("Error fetching gallaries:", err);
      setGallaries([]); // fallback to empty array on error
    }
  };

  loadGallaries();
}, []);


/// helper to load/apply a gallary
const applyGallaryResponse = useCallback(
  async (data) => {
    if (!canvas || !data?.image) return;

    // Remove any previously added gallery image
    canvas.getObjects().forEach((obj) => {
      if (obj.customId === "gallaryImage") {
        canvas.remove(obj);
      }
    });

    // Add the new gallery image
    fabric.Image.fromURL(
      data.image,
      (img) => {
        img.set({
          left: 20,
          top: 20,
          scaleX: 0.5,
          scaleY: 0.5,
        });
        img.customId = "gallaryImage";
        canvas.add(img);
        canvas.requestRenderAll();
      },
      { crossOrigin: "anonymous" }
    );
  },
  [canvas]
);

const loadGallaryById = useCallback(
  async (id) => {
    if (!id) return;
    setLoadingGallary(true);
    try {
      const res = await axios.get(
        `https://canvaback.onrender.com/api/gallary/${id}`
      );
      const gallary = res.data?.result || res.data;

      await applyGallaryResponse(gallary);
      setActiveGallaryId(id);
      resetHistory();
      saveHistoryDebounced();
    } catch (err) {
      console.error("Failed to load gallary:", err);
      toast.error("Failed to load gallary");
    } finally {
      setLoadingGallary(false);
    }
  },
  [applyGallaryResponse, resetHistory, saveHistory]
);

  // Templates list (for right sidebar)
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await axios.get("https://canvaback.onrender.com/api/template");
        setTemplates(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    loadTemplates();
  }, []);

  // helper to load/apply a template by ID
  const applyTemplateResponse = useCallback(
    async (data) => {
      setSavedPlaceholders(data?.placeholders || []);
      const w = Number(data?.width);
      const h = Number(data?.height);
      let newW = w;
      let newH = h;
      if (!w || !h) {
        const defH = Math.round(window.innerHeight * 0.75);
        const aspect = w && h ? w / h : 0.75;
        newH = defH;
        newW = Math.round(defH * aspect);
      }
      setTplSize({ w: newW, h: newH });
      setCanvasSize?.(newW, newH);

      if (data?.image) {
        return new Promise((resolve) => {
          fabric.Image.fromURL(
            data.image,
            (img) => {
              img.set({
                selectable: false,
                evented: false,
                hasControls: false,
                left: 0,
                top: 0,
              });
              img.customId = "templateBg";
              setTemplateImage(img);
              resolve();
            },
            { crossOrigin: "anonymous" }
          );
        });
      } else {
        setTemplateImage(null);
      }
      // after applying template response (inside applyTemplateResponse or after loadTemplateById finishes)
      setShowLogo(false);
      setShowSignature(false);

    },
    [setCanvasSize]
  );

  const loadTemplateById = useCallback(
    async (id) => {
      if (!id) return;
      setLoadingTemplate(true);
      try {
        const res = await axios.get(`https://canvaback.onrender.com/api/template/${id}`);
        await applyTemplateResponse(res.data || {});
        setActiveTemplateId(id);
        resetHistory();
        saveHistoryDebounced();
      } catch {
        toast.error("Failed to load template");
      } finally {
        setLoadingTemplate(false);
      }
    },
    [applyTemplateResponse, resetHistory, saveHistory]
  );

  // Initial template load (from route or prop)
  useEffect(() => {
    if (!templateId) return;
    loadTemplateById(templateId);
  }, [templateId]);

  /* ==================== Render template + student objects ================== */
  useEffect(() => {
    if (!canvas) return;

    // Clear previous scene
    if (bgRef.current) { canvas.remove(bgRef.current); bgRef.current = null; }
    if (logoRef.current) { canvas.remove(logoRef.current); logoRef.current = null; }
    if (signatureRef.current) { canvas.remove(signatureRef.current); signatureRef.current = null; }
    studentObjectsRef.current.forEach((o) => canvas.remove(o));
    studentObjectsRef.current = [];

    const addTemplateBg = () => {
      if (!templateImage) return;
      try {
        if (typeof templateImage.clone === "function") {
          templateImage.clone((bg) => {
            if (!bg) return;
            bg.scaleX = canvas.width / bg.width;
            bg.scaleY = canvas.height / bg.height;
            bg.set({ selectable: false, evented: false });
            canvas.add(bg);
            bg.sendToBack();
            bgRef.current = bg;
            canvas.requestRenderAll();
          });
        } else {
          // Fallback: draw directly (may mutate original)
          const bg = templateImage;
          bg.scaleX = canvas.width / bg.width;
          bg.scaleY = canvas.height / bg.height;
          bg.set({ selectable: false, evented: false });
          canvas.add(bg);
          bg.sendToBack();
          bgRef.current = bg;
        }
      } catch (e) {
        console.warn("Template BG add failed:", e);
      }
    };

    // Helper for loading external images safely with CORS
    const safeLoadImage = (url, cb) => {
      if (!url) return;
      fabric.Image.fromURL(
        url,
        (img) => { try { cb && cb(img); } catch (e) { console.error(e); } },
        { crossOrigin: "anonymous" }
      );
    };

    // 1) Background
    addTemplateBg();

    // 2) Current student (bulk-aware)
    const currentStudent = bulkMode
      ? filteredStudents.find((s) => s?.uuid === bulkList[bulkIndex]) || null
      : selectedStudent;

    if (currentStudent) {
      const savedName = getSavedProps("studentName");
      const nameText = new fabric.IText(
        `${currentStudent.firstName || ""} ${currentStudent.lastName || ""}`.trim(),
        {
          left: savedName?.left ?? Math.round(canvas.width * 0.33),
          top: savedName?.top ?? Math.round(canvas.height * 0.55),
          fontSize: savedName?.fontSize ?? 22,
          fill: "#000",
        }
      );
      nameText.customId = "studentName";
      nameText.field = "studentName";
      canvas.add(nameText);
      studentObjectsRef.current.push(nameText);
    }

   // 3) Student photo
const current = currentStudent;
const photoUrl = Array.isArray(current?.photo) ? current?.photo[0] : current?.photo;
const savedPhoto = getSavedProps("studentPhoto");
const photoLeft = savedPhoto?.left ?? Math.round(canvas.width * 0.5);
const photoTop = savedPhoto?.top ?? Math.round(canvas.height * 0.33);
const savedShape = savedPhoto?.shape || "circle";

if (photoUrl) {
  // Check if photo already exists
  const existingPhoto = canvas.getObjects().find(obj => obj.customId === "studentPhoto");

  if (existingPhoto) {
    // Just update the existing photo
    existingPhoto.set({
      left: photoLeft,
      top: photoTop,
      scaleX: savedPhoto?.scaleX ?? existingPhoto.scaleX,
      scaleY: savedPhoto?.scaleY ?? existingPhoto.scaleY,
    });
    canvas.requestRenderAll();
  } else {
    // Load new photo only if not already present
    safeLoadImage(photoUrl, (img) => {
      const phWidth = Math.min(400, canvas.width * 0.6);
      const phHeight = Math.min(400, canvas.height * 0.6);
      const autoScale = Math.min(phWidth / img.width, phHeight / img.height, 1);

      img.set({
        originX: "center",
        originY: "center",
        left: photoLeft,
        top: photoTop,
        scaleX: savedPhoto?.scaleX ?? autoScale,
        scaleY: savedPhoto?.scaleY ?? autoScale,
      });
      img.customId = "studentPhoto";
      img.field = "studentPhoto";

      applyMaskAndFrame(canvas, img, savedShape, {
        stroke: frameBorder,
        strokeWidth: frameWidth,
        rx: frameCorner,
        absolute: false,
        followImage: true,
      });

      img.set({
        lockMovementX: false,
        lockMovementY: false,
        lockScalingX: false,
        lockScalingY: false,
        lockRotation: false,
        hasControls: true,
        selectable: true,
        evented: true,
      });

      img.on("selected", () => setActiveStudentPhoto(img));
      img.on("deselected", () => setActiveStudentPhoto(null));
      img.on("mousedblclick", () => {
        enterAdjustMode(img);
        fitImageToFrame(img, "cover");
      });

      canvas.add(img);
      studentObjectsRef.current.push(img);
      canvas.requestRenderAll();
    });
  }
}


    // 4) Institute logo & signature
    if (showLogo && selectedInstitute?.logo) {
      // check if logo already exists
      let existingLogo = canvas.getObjects().find(obj => obj.customId === "logo");
      if (!existingLogo) {
        const savedLogo = getSavedProps("logo");
        safeLoadImage(selectedInstitute.logo, (img) => {
          if (savedLogo) {
            const scaleX = savedLogo.width && img.width ? savedLogo.width / img.width : savedLogo.scaleX ?? 1;
            const scaleY = savedLogo.height && img.height ? savedLogo.height / img.height : savedLogo.scaleY ?? 1;
            img.set({
              left: savedLogo.left ?? 20,
              top: savedLogo.top ?? 20,
              scaleX,
              scaleY,
              angle: savedLogo.angle ?? 0
            });
          } else {
            img.scaleToWidth(Math.round(canvas.width * 0.2));
            img.set({ left: 20, top: 20 });
          }
          img.customId = "logo";
          img.field = "logo";
          logoRef.current = img;
          canvas.add(img);
          img.setCoords();
          canvas.requestRenderAll();
        });
      }
    } else {
      // if user unchecks showLogo, remove from canvas
      const existingLogo = canvas.getObjects().find(obj => obj.customId === "logo");
      if (existingLogo) {
        canvas.remove(existingLogo);
        logoRef.current = null;
        canvas.requestRenderAll();
      }
    }

    if (showSignature && selectedInstitute?.signature) {
      // check if signature already exists
      let existingSignature = canvas.getObjects().find(obj => obj.customId === "signature");
      if (!existingSignature) {
        const savedSign = getSavedProps("signature");
        safeLoadImage(selectedInstitute.signature, (img) => {
          if (savedSign) {
            const scaleX = savedSign.width && img.width ? savedSign.width / img.width : savedSign.scaleX ?? 1;
            const scaleY = savedSign.height && img.height ? savedSign.height / img.height : savedSign.scaleY ?? 1;
            img.set({
              left: savedSign.left ?? canvas.width - 150,
              top: savedSign.top ?? canvas.height - 80,
              scaleX,
              scaleY,
              angle: savedSign.angle ?? 0
            });
          } else {
            img.scaleToWidth(Math.round(canvas.width * 0.3));
            img.set({ left: canvas.width - 150, top: canvas.height - 80 });
          }
          img.customId = "signature";
          img.field = "signature";
          signatureRef.current = img;
          canvas.add(img);
          img.setCoords();
          canvas.requestRenderAll();
        });
      }
    } else {
      // if user unchecks showSignature, remove from canvas
      const existingSignature = canvas.getObjects().find(obj => obj.customId === "signature");
      if (existingSignature) {
        canvas.remove(existingSignature);
        signatureRef.current = null;
        canvas.requestRenderAll();
      }
    }


    canvas.requestRenderAll();
  }, [
    canvas,
    selectedInstitute,
    templateImage,
    selectedStudent,
    getSavedProps,
    frameBorder,
    frameWidth,
    frameCorner,
    bulkMode,
    bulkList,
    bulkIndex,
    filteredStudents,
    showLogo,
    showSignature
  ]);

  /* ============================= Canvas events ============================ */
  useEffect(() => {
    if (!canvas) return;
    const onDbl = (e) => {
      const t = e.target;
      if (!t) return;
      if (t.type === "image") {
        enterAdjustMode(t);
        fitImageToFrame(t, "cover");
      } else if (t.isFrameOverlay && t.ownerImage) {
        enterAdjustMode(t.ownerImage);
        canvas.setActiveObject(t.ownerImage);
      }
    };
    canvas.on("mouse:dblclick", onDbl);
    return () => canvas.off("mouse:dblclick", onDbl);
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;
    const onUp = () => {
      const obj = canvas.getActiveObject();
      if (obj && obj.type === "image") snapImageToNearestSlot(obj);
    };
    canvas.on("mouse:up", onUp);
    return () => canvas.off("mouse:up", onUp);
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;
    const onModified = () => saveHistoryDebounced();
    const onAdded = () => saveHistoryDebounced();
    const onRemoved = () => saveHistoryDebounced();
    canvas.on("object:modified", onModified);
    canvas.on("object:added", onAdded);
    canvas.on("object:removed", onRemoved);
    return () => {
      canvas.off("object:modified", onModified);
      canvas.off("object:added", onAdded);
      canvas.off("object:removed", onRemoved);
    };
  }, [canvas, saveHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const cmd = e.metaKey || e.ctrlKey;
      const sel = canvas?.getActiveObject();

      // Undo / Redo
      if (cmd && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      // Duplicate
      if (cmd && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        duplicateObject?.();
        return;
      }

      // Copy / Paste
      if (cmd && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        if (!sel) return;
        canvas?.clone && canvas.clone((cloned) => {
          __CLIPBOARD = cloned;
        }, sel);
        return;
      }
      if (cmd && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        const clip = __CLIPBOARD;
        if (!clip) return;
        clip.clone((clonedObj) => {
          canvas?.discardActiveObject();
          clonedObj.set({ left: (clonedObj.left || 0) + 20, top: (clonedObj.top || 0) + 20, evented: true });
          if (clonedObj.type === "activeSelection") {
            clonedObj.canvas = canvas;
            clonedObj.forEachObject((obj) => canvas.add(obj));
            clonedObj.setCoords();
          } else {
            canvas?.add(clonedObj);
          }
          canvas?.setActiveObject(clonedObj);
          canvas?.requestRenderAll();
          saveHistoryDebounced();
        });
        return;
      }

      // Group / Ungroup (also in UI)
      if (cmd && (e.key === "g" || e.key === "G")) {
        e.preventDefault();
        if (!sel) return;
        if (sel.type === "activeSelection") {
          const grp = sel.toGroup();
          canvas.setActiveObject(grp);
          canvas.requestRenderAll();
          saveHistoryDebounced();
        } else if (sel.type === "group") {
          sel.toActiveSelection();
          canvas.requestRenderAll();
          saveHistoryDebounced();
        }
        return;
      }

      // Select all
      if (cmd && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        const objs = canvas?.getObjects() || [];
        const as = new fabric.ActiveSelection(objs, { canvas });
        canvas?.setActiveObject(as);
        canvas?.requestRenderAll();
        return;
      }

      // Lock toggle
      if (!cmd && (e.key === "l" || e.key === "L")) {
        if (!sel) return;
        const locked = !!sel.lockMovementX;
        sel.set({
          lockMovementX: !locked,
          lockMovementY: !locked,
          lockScalingX: !locked,
          lockScalingY: !locked,
          lockRotation: !locked,
          hasControls: locked,
        });
        canvas?.requestRenderAll();
        return;
      }

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        const obj = canvas?.getActiveObject();
        if (!obj) return;

        // For masked images, delete keeps the slot
        if (obj.type === "image" && obj.frameOverlay) {
          removeMaskAndFrame(canvas, obj, true /* keepSlot */);
          canvas.remove(obj);
        } else {
          canvas?.remove(obj);
        }
        setActiveObj(null);
        setActiveStudentPhoto(null);
        saveHistoryDebounced();
        e.preventDefault();
        return;
      }

      // Nudge
      if (sel && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        const d = { ArrowUp: [0, -delta], ArrowDown: [0, delta], ArrowLeft: [-delta, 0], ArrowRight: [delta, 0] }[e.key];
        sel.top += d[1];
        sel.left += d[0];
        sel.setCoords();
        canvas?.requestRenderAll();
        saveHistoryDebounced();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canvas, undo, redo, duplicateObject, saveHistory, setActiveObj]);

  // Update design canvas to match selected page size (only when print sizing is enabled)
  useEffect(() => {
    if (!usePrintSizing) return;
    if (!canvas) return;
    const W = contentPx.W, H = contentPx.H;
    setTplSize({ w: W, h: H });
    setCanvasSize?.(W, H);
  }, [canvas, contentPx.W, contentPx.H, setCanvasSize, usePrintSizing]);

  // Draw bleed/safe/crop marks as Fabric overlay (only when print sizing is enabled)
  useEffect(() => {
    if (!usePrintSizing) return;
    if (!canvas) return;
    const prevOverlay = canvas._renderOverlay;
    canvas._renderOverlay = (ctx) => {
      // existing print overlay
      const W = canvas.getWidth();
      const H = canvas.getHeight();
      const trimX = bleedPx.left;
      const trimY = bleedPx.top;
      const trimW = W - bleedPx.left - bleedPx.right;
      const trimH = H - bleedPx.top - bleedPx.bottom;
      // bleed border
      ctx.save(); ctx.strokeStyle = 'rgba(255,0,0,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, W - 1, H - 1); ctx.restore();
      // trim box
      ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.setLineDash([6, 4]); ctx.strokeRect(trimX + 0.5, trimY + 0.5, trimW - 1, trimH - 1); ctx.restore();
      // safe area
      const safeX = trimX + safePx.left; const safeY = trimY + safePx.top;
      const safeW = trimW - safePx.left - safePx.right; const safeH = trimH - safePx.top - safePx.bottom;
      ctx.save(); ctx.strokeStyle = 'rgba(34,197,94,0.8)'; ctx.setLineDash([2, 2]); ctx.strokeRect(safeX + 0.5, safeY + 0.5, safeW - 1, safeH - 1); ctx.restore();
      if (showMarks) { const markLen = mmToPx(4, dpi); const off = mmToPx(1.5, dpi); drawCropMarks(ctx, W, H, markLen, off, '#000', 1); }
      if (showReg) { drawRegistrationMark(ctx, W / 2, H / 2, 8, 1); }
      if (typeof prevOverlay === "function") prevOverlay(ctx);
    };
    canvas.requestRenderAll();
    return () => { if (!canvas) return; canvas._renderOverlay = prevOverlay; canvas.requestRenderAll(); };
  }, [canvas, bleedPx, safePx, showMarks, showReg, dpi, usePrintSizing]);

  /* ============================ Replace / Extract ========================== */
  const extractActiveImage = () => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== "image") {
      toast.error("Select an image to extract");
      return;
    }
    // remove mask + overlay and keep the image
    removeMaskAndFrame(canvas, obj, false /* no slot */);
    obj.set({
      lockMovementX: false,
      lockMovementY: false,
      lockScalingX: false,
      lockScalingY: false,
      lockRotation: false,
      hasControls: true,
    });
    canvas.requestRenderAll();
    saveHistoryDebounced();
  };

  /* ============================= Align & Distribute ============================ */
  const distributeH = () => {
    const sel = canvas?.getActiveObject();
    if (!sel || sel.type !== "activeSelection") { toast.error("Select multiple objects"); return; }
    const objs = sel._objects.slice().sort((a, b) => a.left - b.left);
    const left = objs[0].left; const right = objs[objs.length - 1].left;
    const step = (right - left) / (objs.length - 1 || 1);
    objs.forEach((o, i) => { o.set({ left: left + i * step }); o.setCoords(); });
    canvas.discardActiveObject(); const as = new fabric.ActiveSelection(objs, { canvas }); canvas.setActiveObject(as); canvas.requestRenderAll(); saveHistoryDebounced();
  };
  const distributeV = () => {
    const sel = canvas?.getActiveObject();
    if (!sel || sel.type !== "activeSelection") { toast.error("Select multiple objects"); return; }
    const objs = sel._objects.slice().sort((a, b) => a.top - b.top);
    const top = objs[0].top; const bottom = objs[objs.length - 1].top;
    const step = (bottom - top) / (objs.length - 1 || 1);
    objs.forEach((o, i) => { o.set({ top: top + i * step }); o.setCoords(); });
    canvas.discardActiveObject(); const as = new fabric.ActiveSelection(objs, { canvas }); canvas.setActiveObject(as); canvas.requestRenderAll(); saveHistoryDebounced();
  };

  /* ============================= Carousel (bulk) =========================== */
  const rebuildBulkFromFiltered = () => {
    const ids = (filteredStudents.length ? filteredStudents : allStudents).map((s) => s.uuid);
    setBulkList(ids);
    setBulkIndex(0);
    if (ids.length) {
      setSelectedStudent(filteredStudents[0]);
    } else {
      setSelectedStudent(null);
    }
  };

  useEffect(() => {
    if (bulkMode) rebuildBulkFromFiltered();
  }, [bulkMode, filteredStudents]); // eslint-disable-line

  const gotoIndex = (idx) => {
    if (!bulkList.length) return;
    if (canvasRef.current && bulkList[bulkIndex]) {
      studentLayoutsRef.current[bulkList[bulkIndex]] = canvasRef.current.toJSON();
    }

  if (canvasRef.current) {
    const existingPhoto = canvasRef.current
      .getObjects()
      .find((o) => o.customId === "studentPhoto");
    if (existingPhoto) canvasRef.current.remove(existingPhoto);
  }
  
    const n = ((idx % bulkList.length) + bulkList.length) % bulkList.length;
    setBulkIndex(n);
    const uuid = bulkList[n];
    const st = (filteredStudents.length ? filteredStudents : allStudents).find((s) => s.uuid === uuid) || null;
    setSelectedStudent(st);
    if (canvasRef.current) {
      const saved = studentLayoutsRef.current[uuid];
      if (saved) {
        canvasRef.current.loadFromJSON(saved, () => {
          canvasRef.current.renderAll();
        });
      }
      else {
     
      canvasRef.current.requestRenderAll();
    }
    }
  };

  const prevStudent = () => gotoIndex(bulkIndex - 1);
  const nextStudent = () => gotoIndex(bulkIndex + 1);

  /* ============================== Downloads =============================== */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const downloadCurrentPNG = () => {
    const current = bulkMode
      ? filteredStudents.find((s) => s?.uuid === bulkList[bulkIndex]) || selectedStudent
      : selectedStudent;
    const name =
      current?.firstName || current?.lastName
        ? `${(current?.firstName || "").trim()}_${(current?.lastName || "").trim()}`
        : "canvas";
    downloadHighRes?.(tplSize.w, tplSize.h, `${name || "canvas"}.png`);
  };

  const downloadBulkPNGs = async () => {
    if (!bulkMode || !bulkList.length) {
      toast.error("Enable Bulk mode with students filtered");
      return;
    }
    toast("Starting bulk export…");
    for (let i = 0; i < bulkList.length; i++) {
      gotoIndex(i);
      await sleep(350);
      const st = filteredStudents.find((s) => s.uuid === bulkList[i]);
      const name =
        st?.firstName || st?.lastName
          ? `${(st?.firstName || "").trim()}_${(st?.lastName || "").trim()}`
          : `canvas_${i + 1}`;
      downloadHighRes?.(tplSize.w, tplSize.h, `${name}.png`);
      await sleep(300);
    }
    toast.success("Bulk export complete.");
  };

  // NEW: Bulk multi-page PDF
  const downloadBulkPDF = async () => {
    if (!bulkMode || !bulkList.length) {
      toast.error("Enable Bulk mode with students filtered");
      return;
    }
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "p",
        unit: "px",
        format: [tplSize.w, tplSize.h],
        compress: true,
      });

      toast("Creating PDF…");
      canvas.discardActiveObject();
      canvas.requestRenderAll();

      for (let i = 0; i < bulkList.length; i++) {
        gotoIndex(i);
        await sleep(350);
        canvas.discardActiveObject();
        canvas.requestRenderAll();

        const dataUrl = canvas.toDataURL({
          format: "png",
          enableRetinaScaling: true,
          multiplier: 1,
        });

        if (i > 0) pdf.addPage([tplSize.w, tplSize.h], "p");
        pdf.addImage(dataUrl, "PNG", 0, 0, tplSize.w, tplSize.h);
      }

      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      pdf.save(`Bulk_${tplSize.w}x${tplSize.h}_${ts}.pdf`);
      toast.success("PDF ready.");
    } catch (err) {
      console.error(err);
      toast.error("PDF export failed.");
    }
  };

  /* ============================ PRINT EXPORTS ============================ */
  const getTrimBoundsPx = useCallback(() => {
    const W = contentPx.W;
    const H = contentPx.H;
    return {
      x: bleedPx.left,
      y: bleedPx.top,
      w: W - bleedPx.left - bleedPx.right,
      h: H - bleedPx.top - bleedPx.bottom,
    };
  }, [contentPx, bleedPx]);

  const exportSinglePDF = () => {
    const { w_mm, h_mm } = pageMM;
    const doc = new jsPDF({ orientation: w_mm > h_mm ? "l" : "p", unit: "mm", format: [w_mm, h_mm] });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    const png = canvas.toDataURL({ format: "png", quality: 1 });
    doc.addImage(png, "PNG", 0, 0, w_mm, h_mm);

    if (showMarks) {
      const trim = getTrimBoundsPx();
      const toMM = (px) => pxToMm(px, dpi);
      const markLen = 4, off = 1.5;
      doc.setLineWidth(0.2);
      const line = (x1, y1, x2, y2) => doc.line(x1, y1, x2, y2);
      const tx = toMM(trim.x), ty = toMM(trim.y), tw = toMM(trim.w), th = toMM(trim.h);
      // TL
      line(tx - off, ty, tx - off, ty + markLen); line(tx, ty - off, tx + markLen, ty - off);
      // TR
      line(tx + tw + off, ty, tx + tw + off, ty + markLen); line(tx + tw - markLen, ty - off, tx + tw, ty - off);
      // BL
      line(tx - off, ty + th - markLen, tx - off, ty + th); line(tx, ty + th + off, tx + markLen, ty + th + off);
      // BR
      line(tx + tw + off, ty + th - markLen, tx + tw + off, ty + th); line(tx + tw - markLen, ty + th + off, tx + tw, ty + th + off);
      if (showReg) {
        const cx = w_mm / 2, cy = h_mm / 2;
        doc.circle(cx, cy, 2);
        doc.line(cx - 3, cy, cx + 3, cy);
        doc.line(cx, cy - 3, cx, cy + 3);
      }
    }

    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    doc.save(`design_${pagePreset}_${pageOrientation}_${dpi}dpi_${ts}.pdf`);
  };

  const exportImposedPDF = async () => {
    if (!imposeOn) {
      toast.error("Enable Imposition in the left sidebar.");
      return;
    }
    const SHEET = sheetPreset === "Custom" ? sheetCustom : PRESET_SIZES[sheetPreset] || PRESET_SIZES.A4;
    const sheetW = SHEET.w_mm, sheetH = SHEET.h_mm;
    const doc = new jsPDF({ orientation: sheetW > sheetH ? "l" : "p", unit: "mm", format: [sheetW, sheetH] });

    // Determine list of records to tile
    const baseList = (bulkMode && bulkList.length) ? bulkList : [null];

    // Trim size in mm
    const trim = getTrimBoundsPx();
    const trimWmm = pxToMm(trim.w, dpi);
    const trimHmm = pxToMm(trim.h, dpi);

    const gapX = gap.x_mm, gapY = gap.y_mm;
    const m = outer;

    let tileIndex = 0;
    for (let i = 0; i < baseList.length; i++) {
      if (bulkMode && baseList[i]) {
        // Jump canvas to that student page
        const idx = bulkList.indexOf(baseList[i]);
        if (idx >= 0) gotoIndex(idx);
        await new Promise(r => setTimeout(r, 250));
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      }
      const img = canvas.toDataURL({ format: "png", quality: 1 });

      const r = Math.floor(tileIndex / cols);
      const c = tileIndex % cols;
      const x = m.left + c * (trimWmm + gapX);
      const y = m.top + r * (trimHmm + gapY);

      doc.addImage(
        img, "PNG",
        x - pxToMm(bleedPx.left, dpi),
        y - pxToMm(bleedPx.top, dpi),
        trimWmm + pxToMm(bleedPx.left + bleedPx.right, dpi),
        trimHmm + pxToMm(bleedPx.top + bleedPx.bottom, dpi)
      );

      tileIndex++;
      if (tileIndex >= rows * cols && (i < baseList.length - 1)) {
        doc.addPage([sheetW, sheetH], sheetW > sheetH ? "l" : "p");
        tileIndex = 0;
      }
    }

    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    doc.save(`imposed_${rows}x${cols}_${sheetPreset}_${ts}.pdf`);
  };

  /* ================================= UI =================================== */
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100">
      <Toaster position="top-right" />

      {/* TOP BAR */}
      {!hideHeader && (
        <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b z-40 flex items-center justify-between px-3 md:px-4 gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded hover:bg-gray-100"
              title="Back"
              aria-label="Back"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          {/* Contextual mini-toolbar (text/shape quick tools) */}
          {activeObj && (isText(activeObj) || isShape(activeObj)) && (
            <div className="flex items-center gap-2 max-w-[60vw] overflow-x-auto rounded-full bg-white px-2 py-1 border">
              <input
                type="color"
                value={typeof activeObj.fill === "string" ? activeObj.fill : "#000000"}
                onChange={(e) => {
                  activeObj.set({ fill: e.target.value });
                  canvasRef.current?.requestRenderAll();
                }}
                className="w-8 h-8 p-0 border rounded cursor-pointer"
                title="Fill Color"
              />
              <button
                className="px-2 py-1 rounded border text-xs hover:bg-gray-100"
                onClick={() => { setGradientFill(activeObj); canvas.requestRenderAll(); }}
                title="Gradient Fill"
              >
                <PaintBucket size={14} />
              </button>

              {isText(activeObj) && (
                <Fragment>
                  <div className="flex items-center gap-1">
                    <IconButton title="Bold" onClick={() => { activeObj.set("fontWeight", activeObj.fontWeight === "bold" ? "normal" : "bold"); canvas.requestRenderAll(); }}><Bold size={16} /></IconButton>
                    <IconButton title="Italic" onClick={() => { activeObj.set("fontStyle", activeObj.fontStyle === "italic" ? "normal" : "italic"); canvas.requestRenderAll(); }}><Italic size={16} /></IconButton>
                    <IconButton title="Underline" onClick={() => { activeObj.set("underline", !activeObj.underline); canvas.requestRenderAll(); }}><Underline size={16} /></IconButton>
                    <IconButton title="Uppercase" onClick={() => { activeObj.set("text", (activeObj.text || "").toUpperCase()); canvas.requestRenderAll(); }}><CaseUpper size={16} /></IconButton>
                  </div>

                  <input
                    type="number"
                    min={8}
                    max={200}
                    value={activeObj.fontSize || 20}
                    onChange={(e) => {
                      const size = parseInt(e.target.value);
                      if (!isNaN(size)) {
                        const obj = canvasRef.current?.getActiveObject();
                        if (obj && isText(obj)) {
                          obj.set({ fontSize: size });
                          obj.setCoords();
                          canvas.fire("object:modified");
                          canvas.requestRenderAll();
                        }
                      }
                    }}
                    className="w-16 p-1 border rounded"
                    title="Font Size"
                  />
                  <select
                    value={activeObj.fontFamily || "Arial"}
                    onChange={(e) => {
                      const obj = canvasRef.current?.getActiveObject();
                      if (obj && isText(obj)) {
                        obj.set({ fontFamily: e.target.value });
                        obj.setCoords();
                        canvas.fire("object:modified");
                        canvas.requestRenderAll();
                      }
                    }}
                    className="p-1 border rounded"
                    title="Font Family"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <IconButton title="Align Left" onClick={() => { activeObj.set("textAlign", "left"); canvas.requestRenderAll(); }}><AlignLeft size={16} /></IconButton>
                    <IconButton title="Align Center" onClick={() => { activeObj.set("textAlign", "center"); canvas.requestRenderAll(); }}><AlignCenter size={16} /></IconButton>
                    <IconButton title="Align Right" onClick={() => { activeObj.set("textAlign", "right"); canvas.requestRenderAll(); }}><AlignRight size={16} /></IconButton>
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <label className="ml-2">Spacing</label>
                    <input
                      type="range" min={-50} max={200}
                      value={Math.round((activeObj.charSpacing || 0) / 10)}
                      onChange={(e) => { activeObj.set("charSpacing", parseInt(e.target.value, 10) * 10); canvas.requestRenderAll(); }}
                    />
                    <label className="ml-2">Line</label>
                    <input
                      type="range" min={0.8} max={3} step={0.05}
                      value={activeObj.lineHeight || 1.16}
                      onChange={(e) => { activeObj.set("lineHeight", parseFloat(e.target.value)); canvas.requestRenderAll(); }}
                    />
                  </div>

                  <button
                    className="px-2 py-1 rounded border text-xs hover:bg-gray-100"
                    title="Text Shadow"
                    onClick={() => {
                      activeObj.set("shadow", { color: "rgba(0,0,0,0.35)", blur: 6, offsetX: 2, offsetY: 2 });
                      canvas.requestRenderAll();
                    }}
                  >
                    <Sparkles size={14} />
                  </button>
                  <button
                    className="px-2 py-1 rounded border text-xs hover:bg-gray-100"
                    title="Text Outline"
                    onClick={() => {
                      activeObj.set({ stroke: "#000000", strokeWidth: 1 });
                      canvas.requestRenderAll();
                    }}
                  >
                    <ContrastIcon size={14} />
                  </button>
                </Fragment>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-xs">W</label>
            <input
              type="number"
              value={tplSize.w}
              onChange={(e) => handleSizeChange("w", e.target.value)}
              className="w-16 p-1 border rounded"
            />
            <label className="text-xs">H</label>
            <input
              type="number"
              value={tplSize.h}
              onChange={(e) => handleSizeChange("h", e.target.value)}
              className="w-16 p-1 border rounded"
            />
            <label className="text-xs">Zoom</label>
            <input
              type="range"
              min={25}
              max={200}
              value={Math.round(zoom * 100)}
              onChange={(e) => handleZoomChange(e.target.value)}
              className="w-24"
            />
            <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              className="px-2 py-1 rounded border text-xs hover:bg-gray-100"
              onClick={fitToViewport}
              title="Fit to Viewport"
            >
              Fit
            </button>

            {/* Grid toggle */}
            <button
              className={`hidden sm:flex items-center gap-1 px-3 py-2 rounded-full ${showGrid ? "bg-indigo-600 text-white" : "bg-white"} border hover:bg-gray-50 text-sm`}
              onClick={() => setShowGrid(v => !v)}
              title="Toggle Grid"
            >
              <Ruler size={16} /> Grid
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                title="Show Grid"
              />
            </button>

            {/* Group / Ungroup */}
            <button
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-white border hover:bg-gray-50 text-sm"
              onClick={() => {
                const sel = canvas?.getActiveObject();
                if (!sel) return;
                if (sel.type === "activeSelection") {
                  const grp = sel.toGroup();
                  canvas.setActiveObject(grp);
                  canvas.requestRenderAll();
                  saveHistoryDebounced();
                } else if (sel.type === "group") {
                  sel.toActiveSelection();
                  canvas.requestRenderAll();
                  saveHistoryDebounced();
                } else {
                  toast("Select multiple objects to group");
                }
              }}
              title="Group / Ungroup (Ctrl/Cmd+G)"
            >
              <GroupIcon size={16} /> / <Ungroup size={16} />
            </button>

            {/* Distribute */}
            <button
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-white border hover:bg-gray-50 text-sm"
              onClick={distributeH}
              title="Distribute Horizontally"
            >
              <AlignHorizontalJustifyCenter size={16} /> H
            </button>
            <button
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-white border hover:bg-gray-50 text-sm"
              onClick={distributeV}
              title="Distribute Vertically"
            >
              <AlignVerticalJustifyCenter size={16} /> V
            </button>

            {adjustMode && (
              <button
                title="Done"
                onClick={() => {
                  const obj = canvas?.getActiveObject();
                  if (obj && obj.type === "image") exitAdjustMode(obj);
                }}
                className="px-3 py-2 rounded-full bg-emerald-600 text-white shadow hover:bg-emerald-700 text-sm flex items-center gap-1"
              >
                <Check size={16} /> Done
              </button>
            )}

            {/* Template selection */}
            <button
              title="Choose Template"
              onClick={() => { setRightPanel('templates'); setIsRightbarOpen(true); }}
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-white border hover:bg-gray-50 text-sm"
            >
              <Images size={16} /> Template
            </button>

            {/* Download current */}
            <button
              title="Download PNG"
              onClick={downloadCurrentPNG}
              className="p-2 rounded-full bg-green-600 text-white shadow hover:bg-green-700"
            >
              <Download size={18} />
            </button>

            {/* Export PDF */}
            <button
              title="Export PDF"
              onClick={exportSinglePDF}
              className="p-2 rounded-full bg-purple-600 text-white shadow hover:bg-purple-700"
            >
              <FileDown size={18} />
            </button>
            <button
              title="Export Imposed Sheet PDF"
              onClick={exportImposedPDF}
              className={`hidden sm:flex items-center gap-1 px-3 py-2 rounded-full ${imposeOn ? "bg-rose-600 hover:bg-rose-700" : "bg-rose-300 cursor-not-allowed"} text-white shadow text-sm`}
              disabled={!imposeOn}
            >
              <BookOpen size={16} /> Imposed PDF
            </button>

            {/* Bulk download PNGs */}
            {bulkMode && (
              <button
                title="Download All (PNGs)"
                onClick={downloadBulkPNGs}
                className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-700 text-sm"
              >
                <Images size={16} /> Download All
              </button>
            )}

            {/* Bulk multi-page PDF */}
            {bulkMode && (
              <button
                title="Download PDF (All)"
                onClick={downloadBulkPDF}
                className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-purple-600 text-white shadow hover:bg-purple-700 text-sm"
              >
                <FileDown size={16} /> Download PDF (All)
              </button>
            )}
          </div>
        </header>
      )}

      {/* Mobile FAB to toggle tools */}
      <button
        onClick={() => setShowMobileTools(v => !v)}
        className="md:hidden fixed bottom-20 left-4 z-50 rounded-full p-3 shadow bg-indigo-600 text-white"
        title="Tools"
        aria-label="Toggle Tools"
      >
        <MenuIcon size={20} />
      </button>

      {/* LEFT VERTICAL TOOLBAR */}
      <div className={`fixed top-16 left-2 z-40 flex-col gap-2 ${showMobileTools ? "flex" : "hidden"} md:flex`}>
        <button
          title="Choose Gallary"
          onClick={() => { setRightPanel('gallaries'); setIsRightbarOpen(true); }}
          className="p-2 rounded bg-white shadow hover:bg-blue-100"
        >
          <Images size={20} />
        </button>
        <button
          title="Bulk Settings"
          onClick={() => { setRightPanel('bulk'); setIsRightbarOpen(true); }}
          className="p-2 rounded bg-white shadow hover:bg-blue-100"
        >
          <LayersIcon size={20} />
        </button>
        <button
          title="Add Frame"
          onClick={() => { setRightPanel('frames'); setIsRightbarOpen(true); }}
          className="p-2 rounded bg-white shadow hover:bg-blue-100"
        >
          <LayoutIcon size={20} />
        </button>
        <button
          title="Add Text"
          onClick={withFabClose(addText)}
          className="p-2 rounded bg-white shadow hover:bg-blue-100"
        >
          <Type size={20} />
        </button>
        <button
          title="Add Rectangle"
          onClick={withFabClose(addRect)}
          className="p-2 rounded bg-white shadow hover:bg-blue-100"
        >
          <Square size={20} />
        </button>
        <button
          title="Add Circle"
          onClick={withFabClose(addCircle)}
          className="p-2 rounded bg-white shadow hover:bg-blue-100"
        >
          <Circle size={20} />
        </button>
        <input
          type="file"
          accept="image/*"
          id="upload-image"
          style={{ display: "none" }}
          onChange={handleUpload}
        />
        <label
          htmlFor="upload-image"
          onClick={withFabClose(() => { })}
          className="p-2 rounded bg-white shadow hover:bg-blue-100 cursor-pointer"
          title="Upload Image"
        >
          <ImageIcon size={20} />
        </label>


        <UndoRedoControls
          undo={undo}
          redo={redo}
          duplicateObject={duplicateObject}
          vertical
        />
      </div>

      {/* CENTER / Canva-like viewport */}
      <main
        ref={viewportRef}
        className={`absolute bg-gray-100 top-14 left-0 right-0 ${isRightbarOpen ? "md:right-80" : "right-0"} bottom-14 md:bottom-16 overflow-auto flex items-center justify-center`}
      >
        <div
          ref={stageRef}
          style={{
            width: `${tplSize.w * zoom}px`,
            height: `${tplSize.h * zoom}px`,
          }}
          className="shadow-lg border bg-white relative"
        >
          <CanvasArea ref={canvasRef} width={tplSize.w} height={tplSize.h} />
          {showToolbar && activeObj && (
            <SelectionToolbar activeObj={activeObj} canvas={canvas} />
          )}
        </div>

        {bulkMode && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              className="p-2 rounded-full bg-white border hover:bg-gray-100"
              title="Previous"
              onClick={prevStudent}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-2 text-xs text-gray-600">
              {bulkList.length ? `${bulkIndex + 1}/${bulkList.length}` : "0/0"}
            </div>
            <button
              className="p-2 rounded-full bg-white border hover:bg-gray-100"
              title="Next"
              onClick={nextStudent}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {cropSrc && (
          <ImageCropModal
            src={cropSrc}
            onCancel={() => setCropSrc(null)}
            onConfirm={(img) => {
              if (cropCallbackRef.current) cropCallbackRef.current(img);
              setCropSrc(null);
            }}
          />
        )}
      </main>

      {/* RIGHT SIDEBAR PANELS */}
      <aside
        className={`fixed top-14 bottom-14 md:bottom-16 right-0 md:w-80 w-72 bg-white border-l z-30 overflow-y-auto transform transition-transform duration-200 ${isRightbarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-3 border-b flex items-center justify-between">
          <div className="text-sm font-semibold">
            {rightPanel === "gallaries"
              ? "Gallary"
              : rightPanel === "templates"
                ? "Templates"
                : rightPanel === "bulk"
                  ? "Bulk Settings"
                  : rightPanel === "frames"
                    ? "Frames"
                    : rightPanel === "object"
                      ? "Object Settings"
                      : ""}
          </div>
          <button
            className="p-2 rounded hover:bg-gray-100"
            onClick={() => {
              setIsRightbarOpen(false);
              setRightPanel(null);
            }}
            title="Close"
          >
            <MenuIcon size={18} />
          </button>
        </div>
        <div className="p-3">
          {rightPanel === "gallaries" && (
            <Fragment>
              {loadingGallary && (
                <div className="text-xs text-gray-500 mb-2">Loading gallary…</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {gallaries.map((g) => (
                  <div
                    key={g._id || g.Gallary_uuid}
                    className="border rounded overflow-hidden hover:shadow cursor-pointer"
                    onClick={() => loadGallaryById(g._id || g.Gallary_uuid)}
                  >
                    <div className="aspect-[4/5] bg-gray-100 flex flex-col items-center justify-center gap-2 p-2">
                      {g.image ? (
                        <img
                          src={g.image}
                          alt="Gallary"
                          className="w-24 h-24 object-contain border rounded bg-white"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No Image</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t pt-3">
                <LayersPanel canvas={canvas} onSelect={(o) => setActiveObj(o)} />
              </div>
            </Fragment>
          )}


          {rightPanel === "templates" && (
            <Fragment>
              {loadingTemplate && (
                <div className="text-xs text-gray-500 mb-2">Loading template…</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {templates.map((t) => (
                  <button
                    key={t._id || t.id}
                    onClick={() => {
                      loadTemplateById(t._id || t.id);
                    }}
                    className={`border rounded overflow-hidden text-left hover:shadow focus:ring-2 focus:ring-indigo-500 ${(t._id || t.id) === activeTemplateId ? "ring-2 ring-indigo-500" : ""}`}
                    title={t.title || "Template"}
                  >
                    <div className="aspect-[4/5] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                      {t.image ? (
                        <img
                          src={t.image}
                          alt={t.title || "template thumbnail"}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <span>Preview</span>
                      )}
                    </div>
                    <div className="px-2 py-1">
                      <div className="text-xs font-medium truncate">
                        {t.title || "Untitled"}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {t.width || t.w || 400}×{t.height || t.h || 550}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <TemplateLayout
                canvas={canvas}
                activeTemplateId={activeTemplateId}
                tplSize={tplSize}
                setSavedPlaceholders={setSavedPlaceholders}
                frameCorner={frameCorner}
              />
              <div className="mt-4 border-t pt-3">
                <LayersPanel canvas={canvas} onSelect={(o) => setActiveObj(o)} />
              </div>
            </Fragment>
          )}
          {rightPanel === "bulk" && (
            <Fragment>
              <FormControlLabel
                sx={{ mr: 1 }}
                control={
                  <Switch
                    checked={bulkMode}
                    onChange={(e) => setBulkMode(e.target.checked)}
                    size="small"
                  />
                }
                label={<span className="text-sm">Bulk</span>}
              />
              {bulkMode && (
                <div className="border-b">
                  <button
                    className="w-full text-left p-3 text-sm font-semibold"
                    onClick={() => setShowFilters((v) => !v)}
                  >
                    Filters
                  </button>
                  {showFilters && (
                    <div className="px-3 pb-3">

                      <div className="mb-2">
                        <div className="text-xs font-medium mb-1">Profile</div>

                        <div className="flex items-center gap-4">
                          <label className="inline-flex items-center gap-2">
                            <input
                              id="logoCheckbox"
                              type="checkbox"
                              checked={showLogo}
                              onChange={(e) => setShowLogo(e.target.checked)}
                              className="accent-[#25D366]"
                            />
                            <span className="text-sm">Logo</span>
                          </label>

                          <label className="inline-flex items-center gap-2">
                            <input
                              id="signatureCheckbox"
                              type="checkbox"
                              checked={showSignature}
                              onChange={(e) => setShowSignature(e.target.checked)}
                              className="accent-[#25D366]"
                            />
                            <span className="text-sm">Signature</span>
                          </label>
                        </div>
                      </div>



                      <label className="block text-xs mb-1">Course</label>
                      <select
                        className="w-full border rounded px-2 py-1 mb-2"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                      >
                        <option value="">Select course</option>
                        {courses.map((c) => (
                          <option key={c._id} value={c.Course_uuid}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      <label className="block text-xs mb-1">Batch</label>
                      <select
                        className="w-full border rounded px-2 py-1 mb-2"
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                      >
                        <option value="">Select batch</option>
                        {batches.map((b) => (
                          <option key={b._id} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>

                      <label className="block text-xs mb-1">Student</label>
                      <select
                        className="w-full border rounded px-2 py-1"
                        onChange={(e) => handleStudentSelect(e.target.value)}
                        value={selectedStudent?.uuid || ""}
                        disabled={bulkMode}
                      >
                        <option value="">Select a student</option>
                        {(filteredStudents.length ? filteredStudents : allStudents).map((s) => (
                          <option key={s.uuid} value={s.uuid}>
                            {s.firstName} {s.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
              <PrintSettings
                usePrintSizing={usePrintSizing}
                setUsePrintSizing={setUsePrintSizing}
                pagePreset={pagePreset}
                setPagePreset={setPagePreset}
                customPage={customPage}
                setCustomPage={setCustomPage}
                pageOrientation={pageOrientation}
                setPageOrientation={setPageOrientation}
                dpi={dpi}
                setDpi={setDpi}
                bleed={bleed}
                setBleed={setBleed}
                safe={safe}
                setSafe={setSafe}
                showMarks={showMarks}
                setShowMarks={setShowMarks}
                showReg={showReg}
                setShowReg={setShowReg}
                imposeOn={imposeOn}
                setImposeOn={setImposeOn}
                sheetPreset={sheetPreset}
                setSheetPreset={setSheetPreset}
                sheetCustom={sheetCustom}
                setSheetCustom={setSheetCustom}
                rows={rows}
                setRows={setRows}
                cols={cols}
                setCols={setCols}
                gap={gap}
                setGap={setGap}
                outer={outer}
                setOuter={setOuter}
              />
            </Fragment>
          )}
          {rightPanel === "frames" && (
            <FrameSection addFrameSlot={addFrameSlot} />
          )}
          {rightPanel === "object" && (
            <Fragment>
              {activeObj ? (
                <Fragment>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <IconButton onClick={cropImage} title="Crop"><Crop size={18} /></IconButton>

                    {activeObj?.type === "image" && (
                      <>
                        <IconButton onClick={removeSelectedImageBackground} title="Remove Background">
                          <Scissors size={18} />
                        </IconButton>
                        <IconButton
                          title="Replace Image"
                          onClick={() => replaceInputRef.current && replaceInputRef.current.click()}
                        >
                          <RefreshCw size={18} />
                        </IconButton>
                      </>
                    )}

                    <IconButton
                      onClick={() => {
                        const obj = activeObj;
                        if (!obj) return;
                        if (obj.type === "image" && obj.frameOverlay) {
                          removeMaskAndFrame(canvas, obj, true);
                          canvas.remove(obj);
                        } else {
                          canvas.remove(obj);
                        }
                        setActiveObj(null);
                        setActiveStudentPhoto(null);
                        saveHistoryDebounced();
                      }}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </IconButton>

                    <IconButton
                      onClick={() => {
                        const locked = !!activeObj.lockMovementX;
                        activeObj.set({
                          lockMovementX: !locked,
                          lockMovementY: !locked,
                          lockScalingX: !locked,
                          lockScalingY: !locked,
                          lockRotation: !locked,
                          hasControls: locked,
                        });
                        canvas.renderAll();
                      }}
                      title="Lock/Unlock"
                    >
                      {activeObj?.lockMovementX ? <Unlock size={18} /> : <Lock size={18} />}
                    </IconButton>

                    {activeObj?.type === "image" && activeObj?.frameOverlay && (
                      <IconButton onClick={extractActiveImage} title="Extract Image (remove frame)">
                        <Move size={18} />
                      </IconButton>
                    )}
                  </div>

                  {/* Image filter sliders */}
                  {activeObj?.type === "image" && (
                    <div className="space-y-2 mb-3">
                      <div className="text-xs font-medium text-gray-600">Image Adjust</div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs w-16">Bright</label>
                        <input type="range" min={-1} max={1} step={0.05} value={imgFilters.brightness}
                          onChange={(e) => setImgFilters(v => ({ ...v, brightness: parseFloat(e.target.value) }))} />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs w-16">Contrast</label>
                        <input type="range" min={-1} max={1} step={0.05} value={imgFilters.contrast}
                          onChange={(e) => setImgFilters(v => ({ ...v, contrast: parseFloat(e.target.value) }))} />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs w-16">Satur.</label>
                        <input type="range" min={-1} max={1} step={0.05} value={imgFilters.saturation}
                          onChange={(e) => setImgFilters(v => ({ ...v, saturation: parseFloat(e.target.value) }))} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="small" variant="outlined" onClick={() => setImgFilters({ brightness: 0, contrast: 0, saturation: 0 })}>
                          Reset
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeStudentPhoto && (
                    <Stack direction="row" spacing={1} justifyContent="start" className="mt-3">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() =>
                          setImageZoom(
                            activeStudentPhoto,
                            (activeStudentPhoto.zoom || 1) * 1.2
                          )
                        }
                      >
                        Zoom +
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() =>
                          setImageZoom(
                            activeStudentPhoto,
                            (activeStudentPhoto.zoom || 1) / 1.2
                          )
                        }
                      >
                        Zoom -
                      </Button>
                    </Stack>
                  )}

                  {activeObj && ["rect", "circle"].includes(activeObj.type) && (
                    <ShapeStylePanel activeObj={activeObj} canvas={canvas} />
                  )}
                </Fragment>
              ) : (
                <div className="text-sm text-gray-600">No object selected.</div>
              )}
            </Fragment>
          )}
        </div>
      </aside>

      {/* hidden input for replace image */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) replaceActiveImage(file);
          e.target.value = "";
        }}
      />

      <BottomNavBar />

    </div>
  );
};

export default CanvasEditor;
