// CanvasEditor.jsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useCanvasEditor } from "../hooks/useCanvasEditor";
import { useCanvasTools } from "../hooks/useCanvasTools";
import { getStoredUser, getStoredInstituteUUID } from "../utils/storageUtils";
import { Button, Stack, Slider } from "@mui/material";
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
} from "lucide-react";
import IconButton from "./IconButton";
import CanvasArea from "./CanvasArea";
import ImageCropModal from "./ImageCropModal";
import BottomToolbar from "./BottomToolbar";
import UndoRedoControls from "./UndoRedoControls";

/* =============================================================================
   Frame + Adjust helpers  (unchanged structural logic)
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
      return new fabric.Rect({ width: w, height: h, originX: "center", originY: "center" });
    case "rounded":
      return new fabric.Rect({ width: w, height: h, rx, ry: rx, originX: "center", originY: "center" });
    case "circle":
      return new fabric.Circle({ radius: Math.min(w, h) / 2, originX: "center", originY: "center" });
    case "triangle":
      return new fabric.Polygon(
        [{ x: 0, y: -h / 2 }, { x: -w / 2, y: h / 2 }, { x: w / 2, y: h / 2 }],
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
const buildOverlayShape = (shapeType, w, h, { rx, stroke, strokeWidth, dashed = false }) => {
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
        [{ x: 0, y: -h / 2 }, { x: -w / 2, y: h / 2 }, { x: w / 2, y: h / 2 }],
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
    evented: true,
    hoverCursor: "pointer",
    excludeFromExport: false,
  });
  overlay.isFrameOverlay = false;
  overlay.isFrameSlot = !!dashed;
  if (dashed) overlay.set({ strokeDashArray: [6, 4] });
  return overlay;
};
const moveOverlayAboveImage = (canvas, imageObj, overlay) => {
  const idx = canvas.getObjects().indexOf(imageObj);
  if (idx >= 0) canvas.moveTo(overlay, idx + 1);
};
const applyMaskAndFrame = (canvas, imageObj, shapeType, options) => {
  const { stroke, strokeWidth, rx, absolute = false, followImage = true } = options || {};
  if (!imageObj || imageObj.type !== "image") return;

  // remove prior overlay/handlers
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
  const overlay = buildOverlayShape(shapeType, w, h, { rx, stroke, strokeWidth, dashed: false });
  overlay.set({ selectable: true, evented: true });
  overlay.followImage = followImage;
  overlay.isFrameOverlay = true;
  overlay.isFrameSlot = false;
  overlay.ownerImage = imageObj;

  // forward overlay selection to its image (prevents confusion)
  overlay.on("selected", () => {
    if (overlay.ownerImage) {
      canvas.discardActiveObject();
      canvas.setActiveObject(overlay.ownerImage);
      canvas.requestRenderAll();
    }
  });

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
  const syncImageGeom = () => {
    const img = overlay.ownerImage;
    if (!img) return;
    img.set({
      left: overlay.left,
      top: overlay.top,
      scaleX: overlay.scaleX,
      scaleY: overlay.scaleY,
      angle: overlay.angle,
      originX: overlay.originX,
      originY: overlay.originY,
    });
    img.setCoords();
    moveOverlayAboveImage(canvas, img, overlay);
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

  if (followImage) {
    overlay.on("moving", syncImageGeom);
    overlay.on("scaling", syncImageGeom);
    overlay.on("rotating", syncImageGeom);
  }
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
      slot.set({ selectable: true, evented: true, strokeDashArray: [6, 4] });
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

/* =============================================================================
   Main editor with Canva-like responsive preview
============================================================================= */
const CanvasEditor = ({ templateId: propTemplateId, onSaved, hideHeader = false }) => {
  const { templateId: routeId } = useParams();
  const templateId = propTemplateId || routeId;

  /** -------------------- Template-driven size (key part) ------------------- **/
  const [tplSize, setTplSize] = useState({ w: 400, h: 550 }); // default
  const [templateImage, setTemplateImage] = useState(null);

  // viewport fitting
  const viewportRef = useRef(null); // the gray center area
  const stageRef = useRef(null); // fixed-size artboard wrapper we scale
  const [scale, setScale] = useState(1);

  // compute paddings (top bar 56px, bottom 56px, sidebars)
  const sidebarWidth = 320; // md left panel ~80*4; we use 320 to match your CSS
  const topBarH = hideHeader ? 0 : 56;
  const bottomBarH = 56;

  // responsive fit like Canva
  useLayoutEffect(() => {
    if (!viewportRef.current) return;
    const ro = new ResizeObserver(() => {
      const vp = viewportRef.current;
      if (!vp) return;

      // available area (subtract internal paddings if any)
      const availableW = vp.clientWidth;
      const availableH = vp.clientHeight;

      const targetW = tplSize.w;
      const targetH = tplSize.h;

      const s = Math.min(availableW / targetW, availableH / targetH);
      setScale(Number.isFinite(s) ? Math.max(0.05, Math.min(s, 3)) : 1);
    });
    ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [tplSize.w, tplSize.h]);

  /** ------------------------------ Data ----------------------------------- **/
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

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [frameShape, setFrameShape] = useState("rounded");
  const [frameBorder, setFrameBorder] = useState("#ffffff");
  const [frameWidth, setFrameWidth] = useState(6);
  const [frameCorner, setFrameCorner] = useState(24);
  const [adjustMode, setAdjustMode] = useState(false);

  const studentObjectsRef = useRef([]);
  const bgRef = useRef(null);
  const logoRef = useRef(null);
  const signatureRef = useRef(null);

  // hooks — now pass template-driven size
  const {
    canvasRef,
    canvasWidth,
    canvasHeight,
    cropSrc,
    setCropSrc,
    cropCallbackRef,
    addText,
    addRect,
    addCircle,
    addImage,
    cropImage,
    setCanvasSize, // << ensure your hook exposes this to resize Fabric canvas
  } = useCanvasTools({ width: tplSize.w, height: tplSize.h });

  const {
    activeObj,
    setActiveObj,
    canvas,
    undo,
    redo,
    duplicateObject,
    downloadPDF,
    downloadHighRes,
    multipleSelected,
    saveHistory,
    resetHistory,
  } = useCanvasEditor(canvasRef, tplSize.w, tplSize.h);

  const getSavedProps = useCallback(
    (field) => savedPlaceholders.find((p) => p.field === field) || null,
    [savedPlaceholders]
  );

  /** -------------------- Adjust helpers (unchanged) ------------------------ **/
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
  const nudgeImage = (img, dx, dy) => {
    if (!img) return;
    img.set({ left: (img.left || 0) + dx, top: (img.top || 0) + dy });
    img.setCoords();
    canvas.requestRenderAll();
  };
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
      img.frameOverlay.followImage = img.frameOverlay.followImage ?? false;
    }
    setAdjustMode(true);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
  };
  const exitAdjustMode = (img) => {
    if (!img) return;
    const stroke = img.frameOverlay?.stroke ?? frameBorder;
    const strokeWidth = img.frameOverlay?.strokeWidth ?? frameWidth;
    const rx = frameCorner;
    if (img.frameOverlay?.followImage) {
      applyMaskAndFrame(canvas, img, img.shape || frameShape, {
        stroke,
        strokeWidth,
        rx,
        absolute: false,
        followImage: true,
      });
    } else {
      if (img.clipPath) img.clipPath.absolutePositioned = true;
    }
    setAdjustMode(false);
    canvas.requestRenderAll();
  };

  /** -------------------- Frames & snapping (unchanged) --------------------- **/
  const addFrameSlot = (shapeType) => {
    if (!canvas) return;
    const w = 240, h = 240;
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
    });
    overlay.shapeType = shapeType;
    canvas.add(overlay);
    canvas.setActiveObject(overlay);
    canvas.requestRenderAll();
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
    hit.followImage = false;
    hit.set({ strokeDashArray: null, selectable: false, evented: true });

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

    setAdjustMode(true);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
    saveHistory();
  };

  /** ---------------------- Data loading (same) ----------------------------- **/
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

  // Fetch template -> size + bg + placeholders
  useEffect(() => {
    if (!templateId) return;
    let cancelled = false;

    const fetchTemplate = async () => {
      try {
        const res = await axios.get(
          `https://canvaback.onrender.com/api/template/${templateId}`
        );
        if (cancelled) return;

        setSavedPlaceholders(res.data?.placeholders || []);

        const w = Number(res.data?.width) || 400;
        const h = Number(res.data?.height) || 550;
        setTplSize({ w, h });
        // Resize Fabric canvas to template size
        setCanvasSize?.(w, h);

        if (res.data?.image) {
          fabric.Image.fromURL(
            res.data.image,
            (img) => {
              if (cancelled) return;
              img.set({
                selectable: false,
                evented: false,
                hasControls: false,
                left: 0,
                top: 0,
              });
              img.customId = "templateBg";
              setTemplateImage(img);
            },
            { crossOrigin: "anonymous" }
          );
        } else {
          setTemplateImage(null);
        }
      } catch {
        // continue without bg
      }
    };

    fetchTemplate();
    return () => {
      cancelled = true;
    };
  }, [templateId, setCanvasSize]);

  /** -------------------- Render template + student ------------------------- **/
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
      // background (template image scaled to canvas size)
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

      // student name
      if (selectedStudent) {
        const savedName = getSavedProps("studentName");
        const nameText = new fabric.IText(
          `${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`.trim(),
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
      const photoUrl = Array.isArray(selectedStudent?.photo)
        ? selectedStudent.photo[0]
        : selectedStudent?.photo;
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

          applyMaskAndFrame(canvas, img, savedShape, {
            stroke: frameBorder,
            strokeWidth: frameWidth,
            rx: frameCorner,
            absolute: false,
            followImage: true,
          });

          img.on("selected", () => {
            setActiveStudentPhoto(img);
            enterAdjustMode(img);
            fitImageToFrame(img, "cover");
          });
          img.on("deselected", () => setActiveStudentPhoto(null));

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
  ]);

  /** ------------------------ Canvas events -------------------------------- **/
  useEffect(() => {
    if (!canvas) return;
    const onDbl = (e) => {
      const t = e.target;
      if (!t) return;
      if (t.isFrameOverlay && t.ownerImage) {
        enterAdjustMode(t.ownerImage);
        canvas.setActiveObject(t.ownerImage);
      } else if (t.type === "image") {
        enterAdjustMode(t);
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
    const onKey = (e) => {
      if (!adjustMode || !canvas) return;
      const obj = canvas.getActiveObject();
      if (!obj || obj.type !== "image") return;
      const step = e.shiftKey ? 10 : 2;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "ArrowUp") nudgeImage(obj, 0, -step);
        if (e.key === "ArrowDown") nudgeImage(obj, 0, step);
        if (e.key === "ArrowLeft") nudgeImage(obj, -step, 0);
        if (e.key === "ArrowRight") nudgeImage(obj, step, 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [adjustMode, canvas]);

  /** ---------------------- Replace image ---------------------------------- **/
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
            const followImage = obj.frameOverlay?.followImage ?? false;
            const absolute = !followImage;
            applyMaskAndFrame(canvas, obj, prevShape, {
              stroke,
              strokeWidth,
              rx: frameCorner,
              absolute,
              followImage,
            });
            if (absolute && obj.frameOverlay) {
              const w = obj.frameOverlay.getScaledWidth();
              const h = obj.frameOverlay.getScaledHeight();
              const clip = buildClipShape(prevShape, w, h, { rx: frameCorner });
              clip.set({
                absolutePositioned: true,
                originX: "center",
                originY: "center",
                left: obj.frameOverlay.left,
                top: obj.frameOverlay.top,
                angle: obj.frameOverlay.angle || 0,
              });
              obj.clipPath = clip;
              const sx = w / obj.width;
              const sy = h / obj.height;
              const scale = Math.max(sx, sy);
              obj.set({ scaleX: scale, scaleY: scale, left: obj.frameOverlay.left, top: obj.frameOverlay.top });
            }
            setAdjustMode(true);
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

  /** ---------------------- Save placeholders -------------------------------- **/
  const saveTemplateLayout = async () => {
    if (!canvas) return;
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
        `https://canvaback.onrender.com/api/template/update-canvas/${templateId}`,
        { placeholders, width: tplSize.w, height: tplSize.h }
      );
      setSavedPlaceholders(placeholders);
      toast.success("Template layout saved!");
      onSaved?.();
    } catch {
      toast.error("Save failed!");
    }
  };

  /** ---------------------- Align & z-index helpers -------------------------- **/
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

  /** ---------------------- UI Layout (Canva-like fit) ---------------------- **/
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
              title="Toggle sidebar"
            >
              <MenuIcon size={20} />
            </button>
            <a href="/" className="font-bold">Framee</a>

            <div className="hidden sm:flex items-center gap-2 ml-2">
              <button title="Add Text" onClick={addText} className="p-2 rounded bg-white shadow hover:bg-blue-100">
                <Type size={20} />
              </button>
              <button title="Add Rectangle" onClick={addRect} className="p-2 rounded bg-white shadow hover:bg-blue-100">
                <Square size={20} />
              </button>
              <button title="Add Circle" onClick={addCircle} className="p-2 rounded bg-white shadow hover:bg-blue-100">
                <Circle size={20} />
              </button>

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

          <div className="flex gap-2 items-center">
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
            <button
              title="Download PNG"
              onClick={() => downloadHighRes?.(tplSize.w, tplSize.h)}
              className="p-2 rounded-full bg-green-600 text-white shadow hover:bg-green-700"
            >
              <Download size={18} />
            </button>
            <button
              title="Save Template"
              onClick={saveTemplateLayout}
              className="px-3 py-2 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 text-sm"
            >
              Save
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
        {/* Filters */}
        <div className="p-3 border-b">
          <div className="text-sm font-semibold mb-2">Filters</div>
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
          >
            <option value="">Select a student</option>
            {filteredStudents.map((s) => (
              <option key={s.uuid} value={s.uuid}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Frames */}
        <div className="p-3 border-b">
          <div className="text-sm font-semibold mb-2">Add Frame</div>
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
            Tip: Drag an image over a dashed frame to snap & mask it. Double-click the frame or image to adjust.
          </div>
        </div>

        {/* Selected object tools */}
        {activeObj && (
          <div className="p-3 border-b">
            <div className="text-sm font-semibold mb-2">Selected Object</div>
            <div className="flex flex-wrap gap-2">
              <IconButton onClick={cropImage} title="Crop"><Crop size={18} /></IconButton>
              <IconButton
                onClick={() => {
                  const obj = activeObj;
                  canvas?.remove(obj);
                  if (obj.type === "image" && obj.frameOverlay) {
                    obj.frameOverlay && (obj.frameOverlay.isFrameSlot = true, obj.frameOverlay.isFrameOverlay = false, obj.frameOverlay.ownerImage = null, obj.frameOverlay.set({ selectable: true, evented: true, strokeDashArray: [6,4] }));
                    obj.frameOverlay = null;
                  }
                  setActiveObj(null);
                  if (adjustMode) setAdjustMode(false);
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
                    hasControls: locked,
                    lockScalingX: !locked,
                    lockScalingY: !locked,
                    lockRotation: !locked,
                  });
                  canvas.renderAll();
                }}
                title="Lock/Unlock"
              >
                {activeObj?.lockMovementX ? <Unlock size={18} /> : <Lock size={18} />}
              </IconButton>
            </div>

            {activeStudentPhoto && (
              <Stack direction="row" spacing={1} justifyContent="start" className="mt-3">
                <Button variant="contained" size="small" onClick={() => setImageZoom(activeStudentPhoto, (activeStudentPhoto.scaleX || 1) * 1.1)}>
                  Zoom In
                </Button>
                <Button variant="contained" size="small" onClick={() => setImageZoom(activeStudentPhoto, (activeStudentPhoto.scaleX || 1) * 0.9)}>
                  Zoom Out
                </Button>
                <Button variant="outlined" size="small" onClick={() => {
                  const box = getOverlayBox(activeStudentPhoto);
                  if (!box) return;
                  const scale = Math.min(box.w / activeStudentPhoto.width, box.h / activeStudentPhoto.height);
                  activeStudentPhoto.set({ scaleX: scale, scaleY: scale, left: box.cx, top: box.cy, originX: "center", originY: "center" });
                  canvas.requestRenderAll();
                }}>
                  Reset Fit
                </Button>
              </Stack>
            )}
          </div>
        )}

        {/* Image tools */}
        {activeObj && activeObj.type === "image" && (
          <div className="p-3">
            <div className="text-sm font-semibold mb-2">Mask & Frame</div>
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
              <IconButton title="Remove Frame" onClick={() => { removeMaskAndFrame(canvas, activeObj, true); saveHistory(); }}>
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
              <div className="flex items-center gap-2">
                <Button size="small" onClick={() => nudgeImage(activeObj, 0, -2)} disabled={!adjustMode}>↑</Button>
                <Button size="small" onClick={() => nudgeImage(activeObj, -2, 0)} disabled={!adjustMode}>←</Button>
                <Button size="small" onClick={() => nudgeImage(activeObj, 2, 0)} disabled={!adjustMode}>→</Button>
                <Button size="small" onClick={() => nudgeImage(activeObj, 0, 2)} disabled={!adjustMode}>↓</Button>
              </div>
              <div className="text-[11px] text-gray-500 mt-2">
                Double-click the image or its frame to enter Adjust. Drag to pan under the mask. Use Fit/Fill/Center/Zoom/Nudge.
              </div>
            </div>

            <div className="mt-3">
              <Button size="small" variant="outlined" onClick={replaceActiveImage}>
                Replace Image
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* CENTER — Canva-like preview area */}
      <main
        ref={viewportRef}
        className={`absolute bg-gray-100 top-14 right-0 ${isSidebarOpen ? "left-0 md:left-80" : "left-0 md:left-80"} bottom-14 md:bottom-16 overflow-hidden flex items-center justify-center`}
      >
        {/* Scaled stage wrapper */}
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

      {/* BOTTOM BAR (sticky) */}
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
