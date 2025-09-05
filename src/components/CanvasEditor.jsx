// CanvasEditor.jsx
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import toast, { Toaster } from "react-hot-toast";
import { useCanvasEditor } from "../hooks/useCanvasEditor";
import { useCanvasTools } from "../hooks/useCanvasTools";
import { getStoredUser, getStoredInstituteUUID } from "../utils/storageUtils";
import { Button, Stack, Slider, Switch, FormControlLabel } from "@mui/material";
import axios from "axios";
import { useParams } from "react-router-dom";
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
} from "lucide-react";
import { Layout as LayoutIcon, Ruler, BookOpen, Scissors } from "lucide-react";
import IconButton from "./IconButton";
import CanvasArea from "./CanvasArea";
import ImageCropModal from "./ImageCropModal";
import BottomToolbar from "./BottomToolbar";
import UndoRedoControls from "./UndoRedoControls";
import { jsPDF } from "jspdf";

/* =============================================================================
   Shapes & helpers
============================================================================= */
const buildRegularPolygon = (sides, radius) => {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    pts.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
  }
  return pts;
};
const buildStar = (points, outerR, innerR) => {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    pts.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
  }
  return pts;
};
const buildHeartPath = (w, h) => {
  const path =
    "M 50 15 C 35 0, 0 0, 0 30 C 0 55, 25 70, 50 90 C 75 70, 100 55, 100 30 C 100 0, 65 0, 50 15 Z";
  const heart = new fabric.Path(path, {
    left: 0,
    top: 0,
    originX: "center",
    originY: "center",
    fill: "transparent",
  });
  heart.set({ scaleX: w / 100, scaleY: h / 90 });
  return heart;
};

const buildClipShape = (shapeType, w, h, options = {}) => {
  const { rx = Math.min(w, h) * 0.12 } = options;
  switch (shapeType) {
    case "rect":
      return new fabric.Rect({
        width: w,
        height: h,
        originX: "center",
        originY: "center",
      });
    case "rounded":
      return new fabric.Rect({
        width: w,
        height: h,
        rx,
        ry: rx,
        originX: "center",
        originY: "center",
      });
    case "circle":
      return new fabric.Circle({
        radius: Math.min(w, h) / 2,
        originX: "center",
        originY: "center",
      });
    case "triangle":
      return new fabric.Polygon(
        [
          { x: 0, y: -h / 2 },
          { x: -w / 2, y: h / 2 },
          { x: w / 2, y: h / 2 },
        ],
        { originX: "center", originY: "center" }
      );
    case "hexagon":
      return new fabric.Polygon(buildRegularPolygon(6, Math.min(w, h) / 2), {
        originX: "center",
        originY: "center",
      });
    case "star":
      return new fabric.Polygon(buildStar(5, Math.min(w, h) / 2, Math.min(w, h) / 4), {
        originX: "center",
        originY: "center",
      });
    case "heart":
      return buildHeartPath(w, h);
    default:
      return new fabric.Rect({ width: w, height: h, originX: "center", originY: "center" });
  }
};

const buildOverlayShape = (
  shapeType,
  w,
  h,
  { rx, stroke, strokeWidth, dashed = false }
) => {
  let overlay;
  const common = {
    originX: "center",
    originY: "center",
    fill: "transparent",
    stroke,
    strokeWidth,
  };
  switch (shapeType) {
    case "rect":
      overlay = new fabric.Rect({ ...common, width: w, height: h });
      break;
    case "rounded":
      overlay = new fabric.Rect({ ...common, width: w, height: h, rx, ry: rx });
      break;
    case "circle":
      overlay = new fabric.Circle({ ...common, radius: Math.min(w, h) / 2 });
      break;
    case "triangle":
      overlay = new fabric.Polygon(
        [
          { x: 0, y: -h / 2 },
          { x: -w / 2, y: h / 2 },
          { x: w / 2, y: h / 2 },
        ],
        common
      );
      break;
    case "hexagon":
      overlay = new fabric.Polygon(buildRegularPolygon(6, Math.min(w, h) / 2), common);
      break;
    case "star":
      overlay = new fabric.Polygon(buildStar(5, Math.min(w, h) / 2, Math.min(w, h) / 4), common);
      break;
    case "heart": {
      const heart = buildHeartPath(w, h);
      heart.set({ ...common });
      overlay = heart;
      break;
    }
    default:
      overlay = new fabric.Rect({ ...common, width: w, height: h });
  }
  overlay.set({
    selectable: false,
    evented: false,
    hoverCursor: "default",
    excludeFromExport: false,
  });
  overlay.isFrameOverlay = false;
  overlay.isFrameSlot = !!dashed;
  if (dashed)
    overlay.set({
      strokeDashArray: [6, 4],
      selectable: true,
      evented: true,
      hoverCursor: "move",
    });
  return overlay;
};

const moveOverlayAboveImage = (canvas, imageObj, overlay) => {
  const idx = canvas.getObjects().indexOf(imageObj);
  if (idx >= 0) canvas.moveTo(overlay, idx + 1);
};

/**
 * Apply or re-apply mask + overlay.
 * absolute=false, followImage=true  -> move whole unit together (default)
 * absolute=true,  followImage=false -> freeze frame, move image under it (Adjust mode)
 */
const applyMaskAndFrame = (canvas, imageObj, shapeType, options) => {
  const { stroke, strokeWidth, rx, absolute = false, followImage = true } =
    options || {};
  if (!imageObj || imageObj.type !== "image") return;

  // remove any previous overlay
  if (imageObj.frameOverlay && canvas) {
    imageObj.frameOverlay.ownerImage = null;
    canvas.remove(imageObj.frameOverlay);
    imageObj.frameOverlay = null;
  }
  if (imageObj._overlayHandlers) {
    const { onMove, onScale, onRotate, onRemoved } = imageObj._overlayHandlers;
    imageObj.off("moving", onMove);
    imageObj.off("scaling", onScale);
    imageObj.off("rotating", onRotate);
    imageObj.off("removed", onRemoved);
    imageObj._overlayHandlers = null;
  }

  const w = imageObj.width;
  const h = imageObj.height;

  // clip
  const clip = buildClipShape(
    shapeType,
    absolute ? imageObj.getScaledWidth() : w,
    absolute ? imageObj.getScaledHeight() : h,
    { rx }
  );
  clip.set({ originX: "center", originY: "center", left: 0, top: 0 });
  clip.absolutePositioned = !!absolute;
  imageObj.clipPath = clip;
  imageObj.shape = shapeType;

  // overlay
  const overlay = buildOverlayShape(shapeType, w, h, {
    rx,
    stroke,
    strokeWidth,
    dashed: false,
  });
  overlay.set({
    selectable: false,
    evented: false,
    hoverCursor: "default",
  });
  overlay.followImage = followImage;
  overlay.isFrameOverlay = true;
  overlay.isFrameSlot = false;
  overlay.ownerImage = imageObj;

  // keep overlay above
  const syncOverlayGeom = () => {
    overlay.set({
      left: imageObj.left,
      top: imageObj.top,
      scaleX: imageObj.scaleX,
      scaleY: imageObj.scaleY,
      angle: imageObj.angle,
      originX: imageObj.originX,
      originY: imageObj.originY,
    });
    overlay.setCoords();
    moveOverlayAboveImage(canvas, imageObj, overlay);
  };

  if (!absolute) syncOverlayGeom();
  else {
    overlay.set({
      left: imageObj.left,
      top: imageObj.top,
      scaleX: imageObj.scaleX,
      scaleY: imageObj.scaleY,
      angle: imageObj.angle,
      originX: imageObj.originX,
      originY: imageObj.originY,
    });
    overlay.setCoords();
  }

  canvas.add(overlay);
  imageObj.frameOverlay = overlay;
  moveOverlayAboveImage(canvas, imageObj, overlay);

  // When followImage=true (normal mode), moving/scaling image moves frame too.
  if (!absolute && followImage) {
    const onMove = () => syncOverlayGeom();
    const onScale = () => syncOverlayGeom();
    const onRotate = () => syncOverlayGeom();
    const onRemoved = () => {
      if (imageObj.frameOverlay) {
        imageObj.frameOverlay.ownerImage = null;
        canvas.remove(imageObj.frameOverlay);
        imageObj.frameOverlay = null;
      }
      imageObj.off("moving", onMove);
      imageObj.off("scaling", onScale);
      imageObj.off("rotating", onRotate);
      imageObj.off("removed", onRemoved);
      imageObj._overlayHandlers = null;
    };
    imageObj.on("moving", onMove);
    imageObj.on("scaling", onScale);
    imageObj.on("rotating", onRotate);
    imageObj.on("removed", onRemoved);
    imageObj._overlayHandlers = { onMove, onScale, onRotate, onRemoved };
  }

  canvas.requestRenderAll();
};

const removeMaskAndFrame = (canvas, imageObj, keepSlot = false) => {
  if (!imageObj) return;
  imageObj.clipPath = undefined;
  if (imageObj.frameOverlay) {
    if (keepSlot && imageObj.frameOverlay) {
      const slot = imageObj.frameOverlay;
      slot.isFrameOverlay = false;
      slot.isFrameSlot = true;
      slot.ownerImage = null;
      slot.set({
        selectable: true,
        evented: true,
        strokeDashArray: [6, 4],
        hoverCursor: "move",
      });
    } else {
      canvas.remove(imageObj.frameOverlay);
    }
    imageObj.frameOverlay = null;
  }
  if (imageObj._overlayHandlers) {
    const { onMove, onScale, onRotate, onRemoved } = imageObj._overlayHandlers;
    imageObj.off("moving", onMove);
    imageObj.off("scaling", onScale);
    imageObj.off("rotating", onRotate);
    imageObj.off("removed", onRemoved);
    imageObj._overlayHandlers = null;
  }
  canvas.requestRenderAll();
};


/* ========================= PRINT/IMPOSE HELPERS (NEW) ========================= */
const IN_PER_MM = 1 / 25.4;
const PRESET_SIZES = {
  "ID-1/CR80": { w_mm: 85.6, h_mm: 54.0 },
  A4: { w_mm: 210, h_mm: 297 },
  Letter: { w_mm: 215.9, h_mm: 279.4 },
  Legal: { w_mm: 215.9, h_mm: 355.6 },
  Tabloid: { w_mm: 279.4, h_mm: 431.8 },
};
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const mmToPx = (mm, dpi) => Math.round((mm * IN_PER_MM) * dpi);
const pxToMm = (px, dpi) => (px / dpi) / IN_PER_MM;

function drawCropMarks(ctx, W, H, markLenPx, offsetPx, stroke = "#000", lw = 1) {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  // TL
  ctx.beginPath(); ctx.moveTo(offsetPx, 0); ctx.lineTo(offsetPx, markLenPx);
  ctx.moveTo(0, offsetPx); ctx.lineTo(markLenPx, offsetPx); ctx.stroke();
  // TR
  ctx.beginPath(); ctx.moveTo(W - offsetPx, 0); ctx.lineTo(W - offsetPx, markLenPx);
  ctx.moveTo(W - markLenPx, offsetPx); ctx.lineTo(W, offsetPx); ctx.stroke();
  // BL
  ctx.beginPath(); ctx.moveTo(offsetPx, H - markLenPx); ctx.lineTo(offsetPx, H);
  ctx.moveTo(0, H - offsetPx); ctx.lineTo(markLenPx, H - offsetPx); ctx.stroke();
  // BR
  ctx.beginPath(); ctx.moveTo(W - offsetPx, H - markLenPx); ctx.lineTo(W - offsetPx, H);
  ctx.moveTo(W - markLenPx, H - offsetPx); ctx.lineTo(W, H - offsetPx); ctx.stroke();
  ctx.restore();
}

function drawRegistrationMark(ctx, cx, cy, size = 10, lw = 1, stroke = "#000") {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(cx, cy, size, 0, Math.PI * 2);
  ctx.moveTo(cx - size * 1.5, cy); ctx.lineTo(cx + size * 1.5, cy);
  ctx.moveTo(cx, cy - size * 1.5); ctx.lineTo(cx, cy + size * 1.5);
  ctx.stroke();
  ctx.restore();
}
/* ============================================================================ */

/* =============================================================================
   Main Editor
============================================================================= */
const CanvasEditor = ({ templateId: propTemplateId, onSaved, hideHeader = false }) => {
  const { templateId: routeId } = useParams();
  const templateId = propTemplateId || routeId;

  // template-driven size + responsive fit
  const [tplSize, setTplSize] = useState({ w: 400, h: 550 });
  const [templateImage, setTemplateImage] = useState(null);
  const viewportRef = useRef(null);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    if (!viewportRef.current) return;
    const ro = new ResizeObserver(() => {
      const vp = viewportRef.current;
      const availableW = vp.clientWidth;
      const availableH = vp.clientHeight;
      const s = Math.min(availableW / tplSize.w, availableH / tplSize.h);
      setScale(Number.isFinite(s) ? Math.max(0.05, Math.min(s, 3)) : 1);
    });
    ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [tplSize.w, tplSize.h]);

  // data
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [savedPlaceholders, setSavedPlaceholders] = useState([]);
  const [activeStudentPhoto, setActiveStudentPhoto] = useState(null);
  const [selectedInstitute, setSelectedInstitute] = useState(null);

  // templates (right sidebar)
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(templateId || null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // bulk mode
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkList, setBulkList] = useState([]); // array of student uuids
  const [bulkIndex, setBulkIndex] = useState(0);

  // swipe handlers
  const touchRef = useRef({ x: 0, y: 0, active: false });

  // UI
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // left
  const [isRightbarOpen, setIsRightbarOpen] = useState(true); // right
  const [frameShape, setFrameShape] = useState("rounded");
  const [frameBorder, setFrameBorder] = useState("#ffffff");
  const [frameWidth, setFrameWidth] = useState(6);
  const [frameCorner, setFrameCorner] = useState(24);
  const [adjustMode, setAdjustMode] = useState(false);

  // Collapsible sections
  const [showFilters, setShowFilters] = useState(true);
  const [showFrames, setShowFrames] = useState(true);
  const [showSelectedSection, setShowSelectedSection] = useState(true);
  const [showImageTools, setShowImageTools] = useState(true);
  /* ========================= PRINT & IMPOSITION (NEW) ========================= */
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
  /* ========================================================================== */


  const studentObjectsRef = useRef([]);
  const bgRef = useRef(null);
  const logoRef = useRef(null);
  const signatureRef = useRef(null);

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

  const {
    activeObj,
    setActiveObj,
    canvas,
    undo,
    redo,
    duplicateObject,
    downloadPDF,       // existing single-page exporter
    downloadHighRes,
    multipleSelected,
    saveHistory,
    resetHistory,
  } = useCanvasEditor(canvasRef, tplSize.w, tplSize.h);

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
  const centerImageInFrame = (img) => {
    const box = getOverlayBox(img);
    if (!img || !box) return;
    img.set({ left: box.cx, top: box.cy, originX: "center", originY: "center" });
    img.setCoords();
    canvas.requestRenderAll();
  };

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
    canvas.add(overlay);
    canvas.setActiveObject(overlay);
    canvas.requestRenderAll();
    saveHistory();
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
    saveHistory();
  };

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
      .catch(() => {});
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
      } catch {}
    };
    fetchInstitute();
  }, []);

  // Templates list (for right sidebar)
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await axios.get("https://canvaback.onrender.com/api/template/list");
        setTemplates(res.data?.data || res.data || []);
      } catch {
        // non-blocking
      }
    };
    loadTemplates();
  }, []);

  // helper to load/apply a template by ID
  const applyTemplateResponse = useCallback(
    async (data) => {
      setSavedPlaceholders(data?.placeholders || []);
      const w = Number(data?.width) || 400;
      const h = Number(data?.height) || 550;
      setTplSize({ w, h });
      setCanvasSize?.(w, h);

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
        saveHistory();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  /* ==================== Render template + student objects ================== */
  useEffect(() => {
    if (!canvas) return;

    // clear
    if (bgRef.current) canvas.remove(bgRef.current);
    if (logoRef.current) canvas.remove(logoRef.current);
    if (signatureRef.current) canvas.remove(signatureRef.current);
    studentObjectsRef.current.forEach((o) => canvas.remove(o));
    studentObjectsRef.current = [];
    bgRef.current = null;
    logoRef.current = null;
    signatureRef.current = null;

    const load = async () => {
      if (templateImage) {
        const bg = fabric.util.object.clone(templateImage);
        bg.scaleX = canvas.width / bg.width;
        bg.scaleY = canvas.height / bg.height;
        bg.set({ selectable: false, evented: false });
        canvas.add(bg);
        bg.sendToBack();
        bgRef.current = bg;
      }

      let cancelled = false;
      const safeLoadImage = (url, cb) => {
        fabric.Image.fromURL(
          url,
          (img) => !cancelled && cb(img),
          { crossOrigin: "anonymous" }
        );
      };

      // pick current student (single or bulk)
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

      // student photo
      const current = bulkMode
        ? filteredStudents.find((s) => s?.uuid === bulkList[bulkIndex]) || null
        : selectedStudent;

      const photoUrl = Array.isArray(current?.photo)
        ? current?.photo[0]
        : current?.photo;
      const savedPhoto = getSavedProps("studentPhoto");
      const photoLeft = savedPhoto?.left ?? Math.round(canvas.width * 0.5);
      const photoTop = savedPhoto?.top ?? Math.round(canvas.height * 0.33);
      const savedShape = savedPhoto?.shape || "circle";

      if (photoUrl) {
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

          // Normal mode: overlay follows the image (move/scale unit)
          applyMaskAndFrame(canvas, img, savedShape, {
            stroke: frameBorder,
            strokeWidth: frameWidth,
            rx: frameCorner,
            absolute: false,
            followImage: true,
          });

          // default selection allows moving/scaling entire unit
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

          img.on("selected", () => {
            setActiveStudentPhoto(img);
          });
          img.on("deselected", () => setActiveStudentPhoto(null));

          // Double-click to enter Adjust (move image inside mask)
          img.on("mousedblclick", () => {
            enterAdjustMode(img);
            fitImageToFrame(img, "cover");
          });

          canvas.add(img);
          studentObjectsRef.current.push(img);
        });
      }

      // institute logo/signature
      if (selectedInstitute?.logo) {
        const savedLogo = getSavedProps("logo");
        safeLoadImage(selectedInstitute.logo, (img) => {
          if (savedLogo?.scaleX && savedLogo?.scaleY) {
            img.set({
              left: savedLogo.left ?? 20,
              top: savedLogo.top ?? 20,
              scaleX: savedLogo.scaleX,
              scaleY: savedLogo.scaleY,
              angle: savedLogo?.angle ?? 0,
            });
          } else {
            img.scaleToWidth(Math.round(canvas.width * 0.2));
            img.set({ left: savedLogo?.left ?? 20, top: savedLogo?.top ?? 20 });
          }
          img.customId = "logo";
          img.field = "logo";
          logoRef.current = img;
          canvas.add(img);
        });
      }

      if (selectedInstitute?.signature) {
        const savedSign = getSavedProps("signature");
        safeLoadImage(selectedInstitute.signature, (img) => {
          if (savedSign?.scaleX && savedSign?.scaleY) {
            img.set({
              left: savedSign.left ?? canvas.width - 150,
              top: savedSign.top ?? canvas.height - 80,
              scaleX: savedSign.scaleX,
              scaleY: savedSign.scaleY,
              angle: savedSign?.angle ?? 0,
            });
          } else {
            img.scaleToWidth(Math.round(canvas.width * 0.3));
            img.set({
              left: savedSign?.left ?? canvas.width - 150,
              top: savedSign?.top ?? canvas.height - 80,
            });
          }
          img.customId = "signature";
          img.field = "signature";
          signatureRef.current = img;
          canvas.add(img);
        });
      }

      canvas.renderAll();
      return () => (cancelled = true);
    };

    const t = setTimeout(load, 60);
    return () => clearTimeout(t);
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
    const onModified = () => saveHistory();
    const onAdded = () => saveHistory();
    const onRemoved = () => saveHistory();
    canvas.on("object:modified", onModified);
    canvas.on("object:added", onAdded);
    canvas.on("object:removed", onRemoved);
    return () => {
      canvas.off("object:modified", onModified);
      canvas.off("object:added", onAdded);
      canvas.off("object:removed", onRemoved);
    };
  }, [canvas, saveHistory]);

  // Keyboard shortcuts: delete/backspace, undo/redo
  useEffect(() => {
    const onKey = (e) => {
      const cmd = e.metaKey || e.ctrlKey;

      if (cmd && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

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
        saveHistory();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canvas, undo, redo, saveHistory, setActiveObj]);

  
  // Update design canvas to match selected page size (in pixels at selected DPI)
  useEffect(() => {
    if (!canvas) return;
    const W = contentPx.W, H = contentPx.H;
    setTplSize({ w: W, h: H });
    setCanvasSize?.(W, H);
  }, [canvas, contentPx.W, contentPx.H, setCanvasSize]);

  // Draw bleed/safe/crop marks as Fabric overlay
  useEffect(() => {
    if (!canvas) return;
    canvas._renderOverlay = (ctx) => {
      const W = canvas.getWidth();
      const H = canvas.getHeight();

      // page border (bleed edge)
      ctx.save();
      ctx.strokeStyle = "rgba(255,0,0,0.6)";
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
      ctx.restore();

      // trim box (inside bleed)
      const trimX = bleedPx.left;
      const trimY = bleedPx.top;
      const trimW = W - bleedPx.left - bleedPx.right;
      const trimH = H - bleedPx.top - bleedPx.bottom;
      ctx.save();
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(trimX + 0.5, trimY + 0.5, trimW - 1, trimH - 1);
      ctx.restore();

      // safe area (inside trim)
      const safeX = trimX + safePx.left;
      const safeY = trimY + safePx.top;
      const safeW = trimW - safePx.left - safePx.right;
      const safeH = trimH - safePx.top - safePx.bottom;
      ctx.save();
      ctx.strokeStyle = "rgba(34,197,94,0.8)";
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(safeX + 0.5, safeY + 0.5, safeW - 1, safeH - 1);
      ctx.restore();

      if (showMarks) {
        const markLen = mmToPx(4, dpi);
        const off = mmToPx(1.5, dpi);
        drawCropMarks(ctx, W, H, markLen, off, "#000", 1);
      }
      if (showReg) {
        drawRegistrationMark(ctx, W / 2, H / 2, 8, 1);
        drawRegistrationMark(ctx, W / 2, mmToPx(10, dpi), 6, 1);
        drawRegistrationMark(ctx, W / 2, H - mmToPx(10, dpi), 6, 1);
        drawRegistrationMark(ctx, mmToPx(10, dpi), H / 2, 6, 1);
        drawRegistrationMark(ctx, W - mmToPx(10, dpi), H / 2, 6, 1);
      }
    };
    canvas.requestRenderAll();
    return () => {
      if (!canvas) return;
      canvas._renderOverlay = null;
      canvas.requestRenderAll();
    };
  }, [canvas, bleedPx, safePx, showMarks, showReg, dpi]);

/* ============================ Replace / Extract ========================== */
  const replaceActiveImage = () => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== "image") {
      toast.error("Select an image to replace");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const prevShape = obj.shape || frameShape;
        const stroke = obj.frameOverlay?.stroke ?? frameBorder;
        const strokeWidth = obj.frameOverlay?.strokeWidth ?? frameWidth;

        obj.setSrc(
          ev.target.result,
          () => {
            // normal mode after replace
            applyMaskAndFrame(canvas, obj, prevShape, {
              stroke,
              strokeWidth,
              rx: frameCorner,
              absolute: false,
              followImage: true,
            });
            setAdjustMode(false);
            canvas.requestRenderAll();
            saveHistory();
          },
          { crossOrigin: "anonymous" }
        );
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

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
    saveHistory();
  };

  /* =========================== Save placeholders =========================== */
  const saveTemplateLayout = async () => {
    if (!canvas || !activeTemplateId) return;
    const placeholders = canvas
      .getObjects()
      .filter((o) => o.customId !== "templateBg" && !o.isFrameSlot)
      .map((obj) => {
        const rawW = obj.width || 0;
        const rawH = obj.height || 0;
        const scaleX = obj.scaleX || 1;
        const scaleY = obj.scaleY || 1;
        return {
          field: obj.field || obj.customId || "unknown",
          type: obj.type,
          left: obj.left,
          top: obj.top,
          scaleX,
          scaleY,
          angle: obj.angle || 0,
          renderedWidth: rawW * scaleX,
          renderedHeight: rawH * scaleY,
          text: obj.text || null,
          fontSize: obj.fontSize || null,
          fill: obj.fill || null,
          fontFamily: obj.fontFamily || null,
          fontWeight: obj.fontWeight || null,
          textAlign: obj.textAlign || null,
          src: obj.type === "image" && obj._element ? obj._element.src : null,
          shape: obj.type === "image" ? obj.shape || null : null,
          frame:
            obj.type === "image" && obj.frameOverlay
              ? {
                  stroke: obj.frameOverlay.stroke,
                  strokeWidth: obj.frameOverlay.strokeWidth,
                  rx: frameCorner,
                  fixed: !obj.frameOverlay.followImage,
                }
              : null,
        };
      });
    try {
      await axios.put(
        `https://canvaback.onrender.com/api/template/update-canvas/${activeTemplateId}`,
        { placeholders, width: tplSize.w, height: tplSize.h }
      );
      setSavedPlaceholders(placeholders);
      toast.success("Template layout saved!");
      onSaved?.();
    } catch {
      toast.error("Save failed!");
    }
  };

  /* ============================ Align & Z-index ============================ */
  const withActive = (fn) => () => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    fn(obj);
    canvas.requestRenderAll();
    saveHistory();
  };
  const alignLeft = withActive((obj) => {
    obj.set({ left: obj.width ? (obj.width * obj.scaleX) / 2 : 0, originX: "center" });
  });
  const alignCenter = withActive((obj) => {
    obj.set({ left: canvas.getWidth() / 2, originX: "center" });
  });
  const alignRight = withActive((obj) => {
    const w = canvas.getWidth();
    const ow = (obj.width || 0) * (obj.scaleX || 1);
    obj.set({ left: w - ow / 2, originX: "center" });
  });
  const alignTop = withActive((obj) => {
    obj.set({ top: obj.height ? (obj.height * obj.scaleY) / 2 : 0, originY: "center" });
  });
  const alignMiddle = withActive((obj) => {
    obj.set({ top: canvas.getHeight() / 2, originY: "center" });
  });
  const alignBottom = withActive((obj) => {
    const h = canvas.getHeight();
    const oh = (obj.height || 0) * (obj.scaleY || 1);
    obj.set({ top: h - oh / 2, originY: "center" });
  });
  const bringToFront = withActive((obj) => {
    obj.bringToFront();
    if (obj.type === "image" && obj.frameOverlay) moveOverlayAboveImage(canvas, obj, obj.frameOverlay);
  });
  const sendToBack = withActive((obj) => {
    obj.sendToBack();
    if (obj.type === "image" && obj.frameOverlay) moveOverlayAboveImage(canvas, obj, obj.frameOverlay);
  });

  /* ============================= Carousel (bulk) =========================== */
  const rebuildBulkFromFiltered = () => {
    const ids = filteredStudents.map((s) => s.uuid);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkMode, filteredStudents]);

  const gotoIndex = (idx) => {
    if (!bulkList.length) return;
    const n = ((idx % bulkList.length) + bulkList.length) % bulkList.length;
    setBulkIndex(n);
    const uuid = bulkList[n];
    const st = filteredStudents.find((s) => s.uuid === uuid) || null;
    setSelectedStudent(st);
  };

  const prevStudent = () => gotoIndex(bulkIndex - 1);
  const nextStudent = () => gotoIndex(bulkIndex + 1);

  const onTouchStart = (e) => {
    if (!bulkMode) return;
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, active: true };
  };
  const onTouchEnd = (e) => {
    if (!bulkMode || !touchRef.current.active) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const abs = Math.abs(dx);
    touchRef.current.active = false;
    if (abs > 40) {
      if (dx > 0) prevStudent();
      else nextStudent();
    }
  };

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
      // dynamic import; same dep your single-page PDF likely uses
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "p",
        unit: "px",
        format: [tplSize.w, tplSize.h],
        compress: true,
      });

      toast("Creating PDF…");
      // ensure no active selection outlines
      canvas.discardActiveObject();
      canvas.requestRenderAll();

      for (let i = 0; i < bulkList.length; i++) {
        gotoIndex(i);
        // Allow render settle
        await sleep(350);
        canvas.discardActiveObject();
        canvas.requestRenderAll();

        // export current canvas page
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

  
  /* ============================ PRINT EXPORTS (NEW) ============================ */
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

  const exportSinglePNG = () => {
    const dataUrl = canvas.toDataURL({ format: "png", quality: 1 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `design_${pagePreset}_${pageOrientation}_${dpi}dpi.png`;
    a.click();
  };

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
      const line = (x1,y1,x2,y2) => doc.line(x1,y1,x2,y2);
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

    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
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
        await new Promise(r=>setTimeout(r, 250));
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

    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
    doc.save(`imposed_${rows}x${cols}_${sheetPreset}_${ts}.pdf`);
  };
  /* ============================================================================ */

/* ================================= UI =================================== */
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100">
      <Toaster position="top-right" />

      {/* TOP BAR */}
      {!hideHeader && (
        <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b z-40 flex items-center justify-between px-3 md:px-4 gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              className="md:hidden p-2 rounded hover:bg-gray-100"
              onClick={() => setIsSidebarOpen((s) => !s)}
              title="Toggle left sidebar"
            >
              <MenuIcon size={20} />
            </button>
            <a href="/" className="font-bold">
              Framee
            </a>

            <div className="hidden sm:flex items-center gap-2 ml-2">
              <button
                title="Add Text"
                onClick={addText}
                className="p-2 rounded bg-white shadow hover:bg-blue-100"
              >
                <Type size={20} />
              </button>
              <button
                title="Add Rectangle"
                onClick={addRect}
                className="p-2 rounded bg-white shadow hover:bg-blue-100"
              >
                <Square size={20} />
              </button>
              <button
                title="Add Circle"
                onClick={addCircle}
                className="p-2 rounded bg-white shadow hover:bg-blue-100"
              >
                <Circle size={20} />
              </button>

              {/* Upload new image */}
              <input
                type="file"
                accept="image/*"
                id="upload-image"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      setCropSrc(reader.result);
                      cropCallbackRef.current = (croppedUrl) => addImage(croppedUrl);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <label
                htmlFor="upload-image"
                className="p-2 rounded bg-white shadow hover:bg-blue-100 cursor-pointer"
                title="Upload Image"
              >
                <ImageIcon size={20} />
              </label>

              <UndoRedoControls
                undo={undo}
                redo={redo}
                duplicateObject={duplicateObject}
                downloadPDF={downloadPDF}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk toggle */}
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

            {/* Carousel controls (visible when bulk) */}
            {bulkMode && (
              <div className="flex items-center gap-1">
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

            <button
              title="Reset Canvas"
              onClick={() => {
                canvas?.clear();
                resetHistory();
                saveHistory();
              }}
              className="p-2 rounded-full bg-yellow-500 text-white shadow hover:bg-yellow-600"
            >
              <RefreshCw size={18} />
            </button>

            {/* Download current */}
            <button
              title="Download PNG"
              onClick={downloadCurrentPNG}
              className="p-2 rounded-full bg-green-600 text-white shadow hover:bg-green-700"
            >
              <Download size={18} />
            </button>

            {/* NEW: Print Exports */}
            <button
              title="Export Single PDF (with bleed/marks)"
              onClick={exportSinglePDF}
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-purple-600 text-white shadow hover:bg-purple-700 text-sm"
            >
              <FileDown size={16} /> Single PDF
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
            <button
              title="Download All (PNGs)"
              onClick={downloadBulkPNGs}
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-700 text-sm"
            >
              <Images size={16} /> Download All
            </button>

            {/* NEW: Bulk multi-page PDF */}
            {bulkMode && (
              <button
                title="Download PDF (All)"
                onClick={downloadBulkPDF}
                className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-purple-600 text-white shadow hover:bg-purple-700 text-sm"
              >
                <FileDown size={16} /> Download PDF (All)
              </button>
            )}

            {/* Save template layout */}
            <button
              title="Save Template"
              onClick={saveTemplateLayout}
              className="px-3 py-2 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 text-sm"
            >
              Save
            </button>

            {/* Right sidebar toggle */}
            <button
              className="md:hidden p-2 rounded hover:bg-gray-100"
              onClick={() => setIsRightbarOpen((s) => !s)}
              title="Toggle template sidebar"
            >
              <MenuIcon size={20} />
            </button>
          </div>
        </header>
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed top-14 bottom-14 md:bottom-16 left-0 md:w-80 w-72 bg-white border-r z-30 overflow-y-auto transform transition-transform duration-200 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >

        {/* NEW: Page Size / DPI */}
        <div className="border-b">
          <button className="w-full text-left p-3 text-sm font-semibold" onClick={() => setShowFilters((v) => v)}>
            Page Size & DPI
          </button>
          <div className="px-3 pb-3 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              {["ID-1/CR80","A4","Letter","Legal","Tabloid","Custom"].map(key => (
                <button key={key} onClick={()=>setPagePreset(key)} className={`border rounded px-2 py-1 ${pagePreset===key?"bg-gray-900 text-white":""}`}>{key}</button>
              ))}
            </div>
            {pagePreset==="Custom" && (
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs">Width (mm)
                  <input type="number" className="w-full border rounded px-2 py-1" value={customPage.w_mm}
                    onChange={e=>setCustomPage(s=>({...s, w_mm: clamp(parseFloat(e.target.value)||0, 1, 3000)}))}/>
                </label>
                <label className="text-xs">Height (mm)
                  <input type="number" className="w-full border rounded px-2 py-1" value={customPage.h_mm}
                    onChange={e=>setCustomPage(s=>({...s, h_mm: clamp(parseFloat(e.target.value)||0, 1, 3000)}))}/>
                </label>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button className={`border rounded px-2 py-1 ${pageOrientation==="portrait"?"bg-gray-900 text-white":""}`} onClick={()=>setPageOrientation("portrait")}>Portrait</button>
              <button className={`border rounded px-2 py-1 ${pageOrientation==="landscape"?"bg-gray-900 text-white":""}`} onClick={()=>setPageOrientation("landscape")}>Landscape</button>
            </div>
            <div>
              <div className="flex items-center justify-between"><span className="text-xs">DPI</span><span className="text-[11px] opacity-70">{dpi} dpi</span></div>
              <Slider min={150} max={600} step={50} value={dpi} onChange={(_,v)=>setDpi(Array.isArray(v)?v[0]:v)} />
            </div>
          </div>
        </div>

        {/* NEW: Bleed / Safe / Marks */}
        <div className="border-b">
          <button className="w-full text-left p-3 text-sm font-semibold" onClick={() => setShowFilters((v) => v)}>
            Bleed / Safe / Marks
          </button>
          <div className="px-3 pb-3 space-y-2 text-sm">
            <div className="grid grid-cols-4 gap-2">
              {["top","right","bottom","left"].map(side => (
                <label key={side} className="text-xs capitalize">Bleed {side}
                  <input type="number" className="w-full border rounded px-2 py-1" value={bleed[side]}
                    onChange={e=>setBleed(prev=>({...prev, [side]: clamp(parseFloat(e.target.value)||0, 0, 50)}))}/>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {["top","right","bottom","left"].map(side => (
                <label key={side} className="text-xs capitalize">Safe {side}
                  <input type="number" className="w-full border rounded px-2 py-1" value={safe[side]}
                    onChange={e=>setSafe(prev=>({...prev, [side]: clamp(parseFloat(e.target.value)||0, 0, 100)}))}/>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showMarks} onChange={e=>setShowMarks(e.target.checked)}/> Crop marks</label>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showReg} onChange={e=>setShowReg(e.target.checked)}/> Registration mark</label>
            </div>
          </div>
        </div>

        {/* NEW: Imposition */}
        <div className="border-b">
          <button className="w-full text-left p-3 text-sm font-semibold" onClick={() => setShowFilters((v) => v)}>
            Imposition (n‑up)
          </button>
          <div className="px-3 pb-3 space-y-2 text-sm">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={imposeOn} onChange={e=>setImposeOn(e.target.checked)}/> Enable Imposition on Sheet
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["A4","Letter","Legal","Tabloid","Custom"].map(key => (
                <button key={key} className={`border rounded px-2 py-1 ${sheetPreset===key?"bg-gray-900 text-white":""}`} onClick={()=>setSheetPreset(key)}>{key}</button>
              ))}
            </div>
            {sheetPreset==="Custom" && (
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs">Sheet W (mm)
                  <input type="number" className="w-full border rounded px-2 py-1" value={sheetCustom.w_mm}
                    onChange={e=>setSheetCustom(s=>({...s, w_mm: clamp(parseFloat(e.target.value)||0, 30, 3000)}))}/>
                </label>
                <label className="text-xs">Sheet H (mm)
                  <input type="number" className="w-full border rounded px-2 py-1" value={sheetCustom.h_mm}
                    onChange={e=>setSheetCustom(s=>({...s, h_mm: clamp(parseFloat(e.target.value)||0, 30, 3000)}))}/>
                </label>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">Rows
                <input type="number" className="w-full border rounded px-2 py-1" value={rows}
                  onChange={e=>setRows(clamp(parseInt(e.target.value)||1,1,20))}/>
              </label>
              <label className="text-xs">Columns
                <input type="number" className="w-full border rounded px-2 py-1" value={cols}
                  onChange={e=>setCols(clamp(parseInt(e.target.value)||1,1,20))}/>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">Gap X (mm)
                <input type="number" className="w-full border rounded px-2 py-1" value={gap.x_mm}
                  onChange={e=>setGap(g=>({...g, x_mm: clamp(parseFloat(e.target.value)||0,0,100)}))}/>
              </label>
              <label className="text-xs">Gap Y (mm)
                <input type="number" className="w-full border rounded px-2 py-1" value={gap.y_mm}
                  onChange={e=>setGap(g=>({...g, y_mm: clamp(parseFloat(e.target.value)||0,0,100)}))}/>
              </label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {["top","right","bottom","left"].map(side => (
                <label key={side} className="text-xs capitalize">Outer {side}
                  <input type="number" className="w-full border rounded px-2 py-1" value={outer[side]}
                    onChange={e=>setOuter(prev=>({...prev, [side]: clamp(parseFloat(e.target.value)||0,0,200)}))}/>
                </label>
              ))}
            </div>
            <div className="text-[11px] text-gray-500">
              When Bulk + Imposition are on, we tile across the sheet using your filtered students.
            </div>
          </div>
        </div>
        {/* Filters (collapsible) */}
        <div className="border-b">
          <button
            className="w-full text-left p-3 text-sm font-semibold"
            onClick={() => setShowFilters((v) => !v)}
          >
            Filters
          </button>
          {showFilters && (
            <div className="px-3 pb-3">
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
                {filteredStudents.map((s) => (
                  <option key={s.uuid} value={s.uuid}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>

              <div className="text-[11px] text-gray-500 mt-2">
                Bulk mode uses the filtered list above. Use Prev/Next or swipe on mobile.
              </div>
            </div>
          )}
        </div>

        {/* Frames (collapsible) */}
        <div className="border-b">
          <button
            className="w-full text-left p-3 text-sm font-semibold"
            onClick={() => setShowFrames((v) => !v)}
          >
            Add Frame
          </button>
          {showFrames && (
            <div className="px-3 pb-3">
              <div className="grid grid-cols-4 gap-2">
                <IconButton title="Rectangle Frame" onClick={() => addFrameSlot("rect")}><Square size={18} /></IconButton>
                <IconButton title="Rounded Frame" onClick={() => addFrameSlot("rounded")}><Square size={18} /></IconButton>
                <IconButton title="Circle Frame" onClick={() => addFrameSlot("circle")}><Circle size={18} /></IconButton>
                <IconButton title="Triangle Frame" onClick={() => addFrameSlot("triangle")}><Triangle size={18} /></IconButton>
                <IconButton title="Hexagon Frame" onClick={() => addFrameSlot("hexagon")}><Hexagon size={18} /></IconButton>
                <IconButton title="Star Frame" onClick={() => addFrameSlot("star")}><Star size={18} /></IconButton>
                <IconButton title="Heart Frame" onClick={() => addFrameSlot("heart")}><Heart size={18} /></IconButton>
              </div>
              <div className="text-[11px] text-gray-500 mt-2">
                Tip: Drag an image over a dashed frame to snap & mask it. Double-click an image to adjust inside the frame.
              </div>
            </div>
          )}
        </div>

        {/* Selected object (collapsible) */}
        {activeObj && (
          <div className="border-b">
            <button
              className="w-full text-left p-3 text-sm font-semibold"
              onClick={() => setShowSelectedSection((v) => !v)}
            >
              Selected Object
            </button>
            {showSelectedSection && (
              <div className="px-3 pb-3">
                <div className="flex flex-wrap gap-2">
                  <IconButton onClick={cropImage} title="Crop"><Crop size={18} /></IconButton>

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
                      saveHistory();
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

                  {/* Extract image from frame */}
                  {activeObj?.type === "image" && activeObj?.frameOverlay && (
                    <IconButton onClick={extractActiveImage} title="Extract Image (remove frame)">
                      <Move size={18} />
                    </IconButton>
                  )}
                </div>

                {/* Student photo quick zooms */}
                {activeStudentPhoto && (
                  <Stack direction="row" spacing={1} justifyContent="start" className="mt-3">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() =>
                        setImageZoom(
                          activeStudentPhoto,
                          (activeStudentPhoto.scaleX || 1) * 1.1
                        )
                      }
                    >
                      Zoom In
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() =>
                        setImageZoom(
                          activeStudentPhoto,
                          (activeStudentPhoto.scaleX || 1) * 0.9
                        )
                      }
                    >
                      Zoom Out
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        const box = getOverlayBox(activeStudentPhoto);
                        if (!box) return;
                        const scale = Math.min(
                          box.w / activeStudentPhoto.width,
                          box.h / activeStudentPhoto.height
                        );
                        activeStudentPhoto.set({
                          scaleX: scale,
                          scaleY: scale,
                          left: box.cx,
                          top: box.cy,
                          originX: "center",
                          originY: "center",
                        });
                        canvas.requestRenderAll();
                      }}
                    >
                      Reset Fit
                    </Button>
                  </Stack>
                )}
              </div>
            )}
          </div>
        )}

        {/* Image tools (collapsible) */}
        {activeObj && activeObj.type === "image" && (
          <div className="border-b">
            <button
              className="w-full text-left p-3 text-sm font-semibold"
              onClick={() => setShowImageTools((v) => !v)}
            >
              Mask & Frame / Adjust
            </button>
            {showImageTools && (
              <div className="px-3 pb-3">
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {["rect","rounded","circle","triangle","hexagon","star","heart"].map((shape) => {
                    const Icon = {rect:Square, rounded:Square, circle:Circle, triangle:Triangle, hexagon:Hexagon, star:Star, heart:Heart}[shape];
                    return (
                      <IconButton key={shape} title={shape} onClick={() => {
                        setFrameShape(shape);
                        applyMaskAndFrame(canvas, activeObj, shape, {
                          stroke: frameBorder, strokeWidth: frameWidth, rx: frameCorner,
                          absolute: adjustMode, followImage: !adjustMode
                        });
                        if (adjustMode) fitImageToFrame(activeObj, "cover");
                        saveHistory();
                      }}>
                        <Icon size={18} />
                      </IconButton>
                    );
                  })}
                  <IconButton title="Remove Frame (keep slot)" onClick={() => { removeMaskAndFrame(canvas, activeObj, true); saveHistory(); }}>
                    <RefreshCw size={18} />
                  </IconButton>
                </div>

                {frameShape === "rounded" && (
                  <div className="mb-2">
                    <label className="block text-xs mb-1">Corner Radius</label>
                    <Slider
                      min={0}
                      max={Math.floor(Math.min(activeObj?.width || 100, activeObj?.height || 100) / 2)}
                      value={frameCorner}
                      onChange={(_, v) => {
                        const val = Array.isArray(v) ? v[0] : v;
                        setFrameCorner(val);
                        if (activeObj) {
                          applyMaskAndFrame(canvas, activeObj, "rounded", {
                            stroke: frameBorder, strokeWidth: frameWidth, rx: val, absolute: adjustMode, followImage: !adjustMode
                          });
                          if (adjustMode) fitImageToFrame(activeObj, "cover");
                        }
                      }}
                    />
                  </div>
                )}

                <div className="mb-2">
                  <label className="block text-xs mb-1">Border Width</label>
                  <Slider
                    min={0}
                    max={30}
                    value={frameWidth}
                    onChange={(_, v) => {
                      const val = Array.isArray(v) ? v[0] : v;
                      setFrameWidth(val);
                      if (activeObj?.frameOverlay) {
                        activeObj.frameOverlay.set({ strokeWidth: val });
                        canvas.requestRenderAll();
                      }
                    }}
                  />
                </div>

                <div className="mb-2">
                  <label className="block text-xs mb-1">Border Color</label>
                  <input
                    type="color"
                    value={frameBorder}
                    onChange={(e) => {
                      const col = e.target.value;
                      setFrameBorder(col);
                      if (activeObj?.frameOverlay) {
                        activeObj.frameOverlay.set({ stroke: col });
                        canvas.requestRenderAll();
                      }
                    }}
                  />
                </div>

                {/* Adjust Mode */}
                <div className="mt-4 p-3 border rounded">
                  <div className="text-sm font-semibold mb-2">Adjust Image in Frame</div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {!adjustMode ? (
                      <Button size="small" variant="contained" onClick={() => enterAdjustMode(activeObj)}>
                        Enter Adjust
                      </Button>
                    ) : (
                      <Button size="small" color="secondary" variant="outlined" onClick={() => exitAdjustMode(activeObj)}>
                        Done
                      </Button>
                    )}
                    <Button size="small" variant="outlined" onClick={() => fitImageToFrame(activeObj, "contain")} disabled={!adjustMode}>
                      Fit
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => fitImageToFrame(activeObj, "cover")} disabled={!adjustMode}>
                      Fill
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => centerImageInFrame(activeObj)} disabled={!adjustMode}>
                      Center
                    </Button>
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs mb-1">Zoom</label>
                    <Slider
                      min={0.1}
                      max={5}
                      step={0.01}
                      value={Number((activeObj?.scaleX || 1).toFixed(2))}
                      onChange={(_, v) => setImageZoom(activeObj, Array.isArray(v) ? v[0] : v)}
                      disabled={!adjustMode}
                    />
                  </div>
                  <div className="text-[11px] text-gray-500 mt-2">
                    Double-click an image to enter Adjust. Drag to pan under the mask. Use Fit/Fill/Center/Zoom.
                  </div>
                  <div className="mt-3">
                    <Button size="small" variant="outlined" onClick={replaceActiveImage}>
                      Replace Image
                    </Button>
                    {activeObj?.frameOverlay && (
                      <Button size="small" variant="text" className="ml-2" onClick={extractActiveImage}>
                        Extract (remove frame)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* CENTER / Canva-like viewport */}
      <main
        ref={viewportRef}
        className={`absolute bg-gray-100 top-14 right-0 ${
          isSidebarOpen ? "left-0 md:left-80" : "left-0 md:left-80"
        } ${isRightbarOpen ? "md:right-80" : "right-0"} bottom-14 md:bottom-16 overflow-hidden flex items-center justify-center`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={stageRef}
          style={{
            width: `${tplSize.w}px`,
            height: `${tplSize.h}px`,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
          className="shadow-lg border bg-white relative"
        >
          {/* Mobile overlay carousel arrows in bulk mode */}
          {bulkMode && (
            <>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow md:hidden"
                onClick={prevStudent}
                title="Previous"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow md:hidden"
                onClick={nextStudent}
                title="Next"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
          <CanvasArea ref={canvasRef} width={tplSize.w} height={tplSize.h} />
        </div>

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

      {/* RIGHT SIDEBAR – Template Switcher */}
      <aside
        className={`fixed top-14 bottom-14 md:bottom-16 right-0 md:w-80 w-72 bg-white border-l z-30 overflow-y-auto transform transition-transform duration-200 ${
          isRightbarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-3 border-b flex items-center justify-between">
          <div className="text-sm font-semibold">Templates</div>
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setIsRightbarOpen((s) => !s)}
            title="Close"
          >
            <MenuIcon size={18} />
          </button>
        </div>

        <div className="p-3">
          {loadingTemplate && (
            <div className="text-xs text-gray-500 mb-2">Loading template…</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {templates.map((t) => (
              <button
                key={t._id || t.id}
                onClick={() => loadTemplateById(t._id || t.id)}
                className={`border rounded overflow-hidden text-left hover:shadow focus:ring-2 focus:ring-indigo-500 ${
                  (t._id || t.id) === activeTemplateId ? "ring-2 ring-indigo-500" : ""
                }`}
                title={t.name || "Template"}
              >
                <div className="aspect-[4/5] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                  {t.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.thumbnail}
                      alt={t.name || "template thumbnail"}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <span>Preview</span>
                  )}
                </div>
                <div className="px-2 py-1">
                  <div className="text-xs font-medium truncate">
                    {t.name || "Untitled"}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {t.width || t.w || 400}×{t.height || t.h || 550}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* BOTTOM BAR */}
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
