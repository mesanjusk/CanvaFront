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
import useMediaQuery from "../hooks/useMediaQuery";
import { getStoredUser, getStoredInstituteUUID } from "../utils/storageUtils";
import { Button, Stack, Slider, Switch, FormControlLabel } from "@mui/material";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { fabric } from "fabric";
import {
  Menu as MenuIcon,
  RefreshCw,
  Crop,
  Trash2,
  Lock,
  Unlock,
  Move,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Scissors } from "lucide-react";
import IconButton from "./IconButton";
import CanvasArea from "./CanvasArea";
import ImageCropModal from "./ImageCropModal";
import UndoRedoControls from "./UndoRedoControls";
import { jsPDF } from "jspdf";
import TemplateLayout from "../Pages/addTemplateLayout";
import PrintSettings from "./PrintSettings";
import FrameSection from "./FrameSection";
import ShapeStylePanel from "./ShapeStylePanel";
import {
  buildClipShape,
  buildOverlayShape,
  moveOverlayAboveImage,
  applyMaskAndFrame,
  removeMaskAndFrame,
} from "../utils/shapeUtils";
import {
  PRESET_SIZES,
  mmToPx,
  pxToMm,
  drawCropMarks,
  drawRegistrationMark,
} from "../utils/printUtils";
import { removeBackground } from "../utils/backgroundUtils";
import SelectionToolbar from "./SelectionToolbar";
import BottomNavBar from "./BottomNavBar";
import { useSmartGuides, useObjectSnapping } from "../hooks/useCanvasGuides";
import LayersPanel from "./canvas/LayersPanel";
import CanvasTopBar from "./canvas/CanvasTopBar";
import CanvasToolbox from "./canvas/CanvasToolbox";

let __CLIPBOARD = null;

/* ===================== Helpers ===================== */
const isText = (o) => o && (o.type === "text" || o.type === "i-text");
const isShape = (o) =>
  o &&
  (o.type === "rect" ||
    o.type === "circle" ||
    o.type === "triangle" ||
    o.type === "polygon" ||
    o.type === "path");

const setGradientFill = (obj, colors = ["#ff6b6b", "#845ef7"]) => {
  if (!obj) return;
  const w = (obj.width || 100) * (obj.scaleX || 1);
  const grad = new fabric.Gradient({
    type: "linear",
    gradientUnits: "pixels",
    coords: { x1: -w / 2, y1: 0, x2: w / 2, y2: 0 },
    colorStops: [
      { offset: 0, color: colors[0] },
      { offset: 1, color: colors[1] },
    ],
  });
  obj.set("fill", grad);
};

/* ========================================================================
   CHILD COMPONENT: KeyboardShortcutsModal
   ======================================================================== */
const KeyboardShortcutsModal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-4 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Keyboard Shortcuts</h3>
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Undo</div>
          <div>
            <code>Ctrl/Cmd + Z</code>
          </div>
          <div>Redo</div>
          <div>
            <code>Ctrl/Cmd + Shift + Z</code>
          </div>
          <div>Copy/Paste</div>
          <div>
            <code>Ctrl/Cmd + C / V</code>
          </div>
          <div>Duplicate</div>
          <div>
            <code>Ctrl/Cmd + D</code>
          </div>
          <div>Group/Ungroup</div>
          <div>
            <code>Ctrl/Cmd + G</code>
          </div>
          <div>Select All</div>
          <div>
            <code>Ctrl/Cmd + A</code>
          </div>
          <div>Delete</div>
          <div>
            <code>Delete / Backspace</code>
          </div>
          <div>Nudge</div>
          <div>
            <code>Arrow keys (Shift = 10px)</code>
          </div>
          <div>Pan</div>
          <div>
            <code>Hold Space + drag</code>
          </div>
          <div>Zoom</div>
          <div>
            <code>Ctrl/Cmd + Mouse Wheel</code>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================
   CHILD COMPONENT: RightSidebar (all panels)
   ======================================================================== */
const RightSidebar = ({
  isMobile,
  isRightbarOpen,
  rightPanel,
  setIsRightbarOpen,
  setRightPanel,

  // gallery
  gallaries,
  loadingGallary,
  gallaryError,
  loadGallaryById,

  // templates
  templates,
  loadingTemplate,
  templateError,
  loadTemplateById,
  activeTemplateId,
  tplSize,
  setSavedPlaceholders,
  frameCorner,

  // canvas & layers
  canvas,
  setActiveObj,

  // bulk & filters
  bulkMode,
  setBulkMode,
  showFilters,
  setShowFilters,
  showLogo,
  setShowLogo,
  showSignature,
  setShowSignature,
  courses,
  batches,
  selectedCourse,
  setSelectedCourse,
  selectedBatch,
  setSelectedBatch,
  selectedStudent,
  filteredStudents,
  allStudents,
  handleStudentSelect,

  // print settings
  usePrintSizing,
  setUsePrintSizing,
  pagePreset,
  setPagePreset,
  customPage,
  setCustomPage,
  pageOrientation,
  setPageOrientation,
  dpi,
  setDpi,
  bleed,
  setBleed,
  safe,
  setSafe,
  showMarks,
  setShowMarks,
  showReg,
  setShowReg,
  imposeOn,
  setImposeOn,
  sheetPreset,
  setSheetPreset,
  sheetCustom,
  setSheetCustom,
  rows,
  setRows,
  cols,
  setCols,
  gap,
  setGap,
  outer,
  setOuter,

  // frames
  addFrameSlot,

  // object inspector
  activeObj,
  setActiveStudentPhoto,
  imgFilters,
  setImgFilters,
  cropImage,
  removeSelectedImageBackground,
  replaceInputRef,
  replaceActiveImage,
  extractActiveImage,
  saveHistoryDebounced,
}) => {
  return (
    <aside
      className={`fixed z-30 bg-white overflow-y-auto transform transition-transform duration-200
        ${
          isMobile
            ? "left-0 right-0 bottom-14 top-auto w-full max-h-[70vh] border-t rounded-t-2xl"
            : "top-14 bottom-14 md:bottom-16 right-0 md:w-80 w-72 border-l"
        }
        ${
          isRightbarOpen
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-x-full"
        }`}
    >
      {/* drag handle on mobile */}
      {isMobile && (
        <div className="flex justify-center pt-2">
          <div className="h-1.5 w-12 rounded-full bg-gray-300" />
        </div>
      )}

      <div className="p-3 border-b flex items-center justify-between">
        <div className="text-sm font-semibold">
          {rightPanel === "gallaries"
            ? "Gallery"
            : rightPanel === "templates"
            ? "Templates"
            : rightPanel === "bulk"
            ? "Bulk & Print"
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

      <div className={`p-3 ${isMobile ? "pb-6" : ""}`}>
        {/* GALLERY PANEL */}
        {rightPanel === "gallaries" && (
          <Fragment>
            {loadingGallary && (
              <div className="text-xs text-gray-500 mb-2">
                Loading gallery…
              </div>
            )}
            {gallaryError && (
              <div className="text-xs text-red-600 mb-2">{gallaryError}</div>
            )}
            {!loadingGallary && !gallaryError && gallaries.length === 0 && (
              <div className="text-xs text-gray-500 mb-2">
                No gallery items found.
              </div>
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
                        alt="Gallery"
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

        {/* TEMPLATES PANEL */}
        {rightPanel === "templates" && (
          <Fragment>
            {loadingTemplate && (
              <div className="text-xs text-gray-500 mb-2">
                Loading template…
              </div>
            )}
            {templateError && (
              <div className="text-xs text-red-600 mb-2">
                {templateError}
              </div>
            )}
            {!loadingTemplate && !templateError && templates.length === 0 && (
              <div className="text-xs text-gray-500 mb-2">
                No templates yet.
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t) => (
                <button
                  key={t._id || t.id}
                  onClick={() => {
                    loadTemplateById(t._id || t.id);
                  }}
                  className={`border rounded overflow-hidden text-left hover:shadow focus:ring-2 focus:ring-indigo-500 ${
                    (t._id || t.id) === activeTemplateId
                      ? "ring-2 ring-indigo-500"
                      : ""
                  }`}
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
                      {t.width || t.w || 400}×
                      {t.height || t.h || 550}
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

        {/* BULK + PRINT PANEL */}
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
                      <div className="text-xs font-medium mb-1">
                        Profile
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2">
                          <input
                            id="logoCheckbox"
                            type="checkbox"
                            checked={showLogo}
                            onChange={(e) =>
                              setShowLogo(e.target.checked)
                            }
                            className="accent-[#25D366]"
                          />
                          <span className="text-sm">Logo</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            id="signatureCheckbox"
                            type="checkbox"
                            checked={showSignature}
                            onChange={(e) =>
                              setShowSignature(e.target.checked)
                            }
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
                      onChange={(e) =>
                        setSelectedCourse(e.target.value)
                      }
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
                      onChange={(e) =>
                        setSelectedBatch(e.target.value)
                      }
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
                      onChange={(e) =>
                        handleStudentSelect(e.target.value)
                      }
                      value={selectedStudent?.uuid || ""}
                      disabled={bulkMode}
                    >
                      <option value="">Select a student</option>
                      {(filteredStudents.length
                        ? filteredStudents
                        : allStudents
                      ).map((s) => (
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

        {/* FRAMES PANEL */}
        {rightPanel === "frames" && (
          <FrameSection addFrameSlot={addFrameSlot} />
        )}

        {/* OBJECT SETTINGS PANEL */}
        {rightPanel === "object" && (
          <Fragment>
            {activeObj ? (
              <Fragment>
                <div className="flex flex-wrap gap-2 mb-3">
                  <IconButton onClick={cropImage} title="Crop">
                    <Crop size={18} />
                  </IconButton>

                  {activeObj?.type === "image" && (
                    <>
                      <IconButton
                        onClick={removeSelectedImageBackground}
                        title="Remove Background"
                      >
                        <Scissors size={18} />
                      </IconButton>
                      <IconButton
                        title="Replace Image"
                        onClick={() =>
                          replaceInputRef.current &&
                          replaceInputRef.current.click()
                        }
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
                    {activeObj?.lockMovementX ? (
                      <Unlock size={18} />
                    ) : (
                      <Lock size={18} />
                    )}
                  </IconButton>

                  {activeObj?.type === "image" && activeObj?.frameOverlay && (
                    <IconButton
                      onClick={extractActiveImage}
                      title="Extract Image (remove frame)"
                    >
                      <Move size={18} />
                    </IconButton>
                  )}
                </div>

                {/* Image filter sliders */}
                {activeObj?.type === "image" && (
                  <div className="space-y-2 mb-3">
                    <div className="text-xs font-medium text-gray-600">
                      Image Adjust
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs w-16">Bright</label>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.05}
                        value={imgFilters.brightness}
                        onChange={(e) =>
                          setImgFilters((v) => ({
                            ...v,
                            brightness: parseFloat(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs w-16">Contrast</label>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.05}
                        value={imgFilters.contrast}
                        onChange={(e) =>
                          setImgFilters((v) => ({
                            ...v,
                            contrast: parseFloat(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs w-16">Satur.</label>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.05}
                        value={imgFilters.saturation}
                        onChange={(e) =>
                          setImgFilters((v) => ({
                            ...v,
                            saturation: parseFloat(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          setImgFilters({
                            brightness: 0,
                            contrast: 0,
                            saturation: 0,
                          })
                        }
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                )}
              </Fragment>
            ) : (
              <div className="text-sm text-gray-600">
                No object selected.
              </div>
            )}
          </Fragment>
        )}
      </div>
    </aside>
  );
};

/* =============================================================================
   Main Editor
============================================================================= */
const CanvasEditor = ({ templateId: propTemplateId, hideHeader = false }) => {
  const { templateId: routeId } = useParams();
  const templateId = propTemplateId || routeId;
  const isMobile = useMediaQuery("(max-width: 768px)");
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

  // ✨ ADDED: Snapping toggles
  const [snapCenterGuides, setSnapCenterGuides] = useState(true);
  const [snapObjects, setSnapObjects] = useState(true);
  const [snapTolerance, setSnapTolerance] = useState(6);

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
    downloadPDF, // existing single-page exporter
    downloadHighRes,
    saveHistory,
    resetHistory,
  } = useCanvasEditor(canvasRef, tplSize.w, tplSize.h);

  // Debounced history saver
  const saveHistoryDebounced = React.useMemo(() => {
    let t;
    return () => {
      clearTimeout(t);
      t = setTimeout(() => saveHistory(), 150);
    };
  }, [saveHistory]);

  // ✨ ADDED: enable guides & snapping controlled by toggles
  useSmartGuides(canvasRef, snapCenterGuides, 8);
  useObjectSnapping(canvas, snapObjects, snapTolerance);

  // grid background rendering
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const prevBg = c._renderBackground;
    c._renderBackground = function (ctx) {
      if (typeof prevBg === "function") prevBg.call(this, ctx);
      if (!showGrid) return;
      const w = this.getWidth(),
        h = this.getHeight();
      ctx.save();
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      for (let x = 0.5; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0.5; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();
    };
    c.requestRenderAll();
    return () => {
      if (!c) return;
      c._renderBackground = prevBg;
      c.requestRenderAll();
    };
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
    const s = Math.min(
      vp.clientWidth / tplSize.w,
      vp.clientHeight / tplSize.h,
      1
    );
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

  const withFabClose = (fn) => (...args) => {
    fn(...args);
    if (isMobile) setShowMobileTools(false);
  };

  // gallaries (right sidebar)
  const [gallaries, setGallaries] = useState([]);
  const [activeGallaryId, setActiveGallaryId] = useState(null);
  const [loadingGallary, setLoadingGallary] = useState(false);
  const [gallaryError, setGallaryError] = useState(null); // ✨ ADDED

  // templates (right sidebar)
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(templateId || null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState(null); // ✨ ADDED

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
  const [pageOrientation, setPageOrientation] = useState("portrait");
  const [dpi, setDpi] = useState(300);
  const [customPage, setCustomPage] = useState({ w_mm: 210, h_mm: 297 });

  const [bleed, setBleed] = useState({
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
  });
  const [safe, setSafe] = useState({
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
  });
  const [showMarks, setShowMarks] = useState(true);
  const [showReg, setShowReg] = useState(false);

  // Imposition
  const [imposeOn, setImposeOn] = useState(false);
  const [sheetPreset, setSheetPreset] = useState("A4");
  const [sheetCustom, setSheetCustom] = useState({ w_mm: 210, h_mm: 297 });
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [gap, setGap] = useState({ x_mm: 5, y_mm: 5 });
  const [outer, setOuter] = useState({
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
  });

  // Derived page size (mm) and pixel size per DPI
  const pageMM = useMemo(() => {
    const base =
      pagePreset === "Custom"
        ? customPage
        : PRESET_SIZES[pagePreset] || PRESET_SIZES.A4;
    const { w_mm, h_mm } = base;
    return pageOrientation === "portrait"
      ? { w_mm, h_mm }
      : { w_mm: h_mm, h_mm: w_mm };
  }, [pagePreset, pageOrientation, customPage]);

  const contentPx = useMemo(
    () => ({
      W: mmToPx(pageMM.w_mm, dpi),
      H: mmToPx(pageMM.h_mm, dpi),
    }),
    [pageMM, dpi]
  );

  const bleedPx = useMemo(
    () => ({
      top: mmToPx(bleed.top, dpi),
      right: mmToPx(bleed.right, dpi),
      bottom: mmToPx(bleed.bottom, dpi),
      left: mmToPx(bleed.left, dpi),
    }),
    [bleed, dpi]
  );

  const safePx = useMemo(
    () => ({
      top: mmToPx(safe.top, dpi),
      right: mmToPx(safe.right, dpi),
      bottom: mmToPx(safe.bottom, dpi),
      left: mmToPx(safe.left, dpi),
    }),
    [safe, dpi]
  );

  const studentObjectsRef = useRef([]);
  const bgRef = useRef(null);
  const logoRef = useRef(null);
  const signatureRef = useRef(null);

  const getSavedProps = useCallback(
    (field) => savedPlaceholders.find((p) => p.field === field) || null,
    [savedPlaceholders]
  );

  /* ============================ ✨ ADDED: Autosave/Restore ============================ */
  const DRAFT_KEY = useMemo(
    () => `canvas_draft_${activeTemplateId || "global"}`,
    [activeTemplateId]
  );
  const [draftRestored, setDraftRestored] = useState(false);

  // Restore draft once when canvas ready
  useEffect(() => {
    if (!canvas || draftRestored) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const json = JSON.parse(raw);
        canvas.loadFromJSON(json, () => {
          canvas.renderAll();
          toast.success("Draft restored");
          setDraftRestored(true);
        });
      } else {
        setDraftRestored(true);
      }
    } catch (e) {
      console.warn("Draft restore failed", e);
      setDraftRestored(true);
    }
  }, [canvas, DRAFT_KEY, draftRestored]);

  // Save draft on changes (debounced by history saver already)
  const persistDraft = useCallback(() => {
    if (!canvas) return;
    try {
      const json = canvas.toJSON();
      localStorage.setItem(DRAFT_KEY, JSON.stringify(json));
    } catch (e) {
      console.warn("Draft save failed", e);
    }
  }, [canvas, DRAFT_KEY]);

  useEffect(() => {
    if (!canvas) return;
    const onAnyChange = () => {
      saveHistoryDebounced();
      persistDraft();
    };
    canvas.on("object:modified", onAnyChange);
    canvas.on("object:added", onAnyChange);
    canvas.on("object:removed", onAnyChange);
    return () => {
      canvas.off("object:modified", onAnyChange);
      canvas.off("object:added", onAnyChange);
      canvas.off("object:removed", onAnyChange);
    };
  }, [canvas, persistDraft, saveHistoryDebounced]);

  /* ============================ Adjust helpers (existing trimmed) ============================ */
  const getOverlayBox = (img) => {
    const ov = img?.frameOverlay;
    if (!img || !ov) return null;
    return {
      w: ov.getScaledWidth(),
      h: ov.getScaledHeight(),
      cx: ov.left,
      cy: ov.top,
    };
  };
  const setImageZoom = (img, z) => {
    if (!img) return;
    img.set({ scaleX: z, scaleY: z });
    img.setCoords();
    canvas.requestRenderAll();
  };
  const fitImageToFrame = (img, mode = "contain") => {
    if (!img) return;
    const box = getOverlayBox(img);
    if (!box) return;
    const iw = img.width,
      ih = img.height;
    const sx = box.w / iw,
      sy = box.h / ih;
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

  const replaceActiveImage = (file) => {
    if (!activeObj || activeObj.type !== "image") return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      fabric.Image.fromURL(
        dataUrl,
        (img) => {
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
        },
        { crossOrigin: "anonymous" }
      );
    };
    reader.readAsDataURL(file);
  };

  // Image filters
  const [imgFilters, setImgFilters] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
  });
  const applyImageFilters = (img) => {
    if (!img || img.type !== "image") return;
    const { Brightness, Contrast, Saturation } = fabric.Image.filters;
    const f = [];
    if (imgFilters.brightness !== 0)
      f.push(new Brightness({ brightness: imgFilters.brightness }));
    if (imgFilters.contrast !== 0)
      f.push(new Contrast({ contrast: imgFilters.contrast }));
    if (imgFilters.saturation !== 0)
      f.push(new Saturation({ saturation: imgFilters.saturation }));
    img.filters = f;
    img.applyFilters();
    canvas.requestRenderAll();
  };
  useEffect(() => {
    if (activeObj && activeObj.type === "image") applyImageFilters(activeObj);
  }, [imgFilters]); // eslint-disable-line

  const enterAdjustMode = (img) => {
    if (!img) return;
    const stroke = img.frameOverlay?.stroke ?? frameBorder;
    const strokeWidth = img.frameOverlay?.strokeWidth ?? frameWidth;
    const rx = frameCorner;

    const w = img.frameOverlay
      ? img.frameOverlay.getScaledWidth()
      : img.getScaledWidth();
    const h = img.frameOverlay
      ? img.frameOverlay.getScaledHeight()
      : img.getScaledHeight();
    const clip = buildClipShape(img.shape || "rounded", w, h, { rx });
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
      applyMaskAndFrame(canvas, img, img.shape || "rounded", {
        stroke,
        strokeWidth,
        rx,
        absolute: true,
        followImage: false,
      });
    } else {
      img.frameOverlay.isFrameOverlay = true;
      img.frameOverlay.ownerImage = img;
      img.frameOverlay.followImage = false;
      img.frameOverlay.set({
        selectable: false,
        evented: false,
        hoverCursor: "default",
      });
    }

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

    applyMaskAndFrame(canvas, img, img.shape || "rounded", {
      stroke,
      strokeWidth,
      rx,
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
    hit.set({
      strokeDashArray: null,
      selectable: false,
      evented: false,
      hoverCursor: "default",
    });

    const w = hit.getScaledWidth();
    const h = hit.getScaledHeight();
    const clip = buildClipShape(hit.shapeType || "rounded", w, h, {
      rx: frameCorner,
    });
    clip.set({
      absolutePositioned: true,
      originX: hit.originX,
      originY: hit.originY,
      left: hit.left,
      top: hit.top,
      angle: hit.angle || 0,
    });
    img.clipPath = clip;
    img.shape = hit.shapeType || "rounded";

    img.set({
      left: hit.left,
      top: hit.top,
      originX: "center",
      originY: "center",
    });
    canvas.requestRenderAll();
    const box = { w, h, cx: hit.left, cy: hit.top };
    const sx = box.w / img.width;
    const sy = box.h / img.height;
    const scale = Math.max(sx, sy);
    img.set({
      scaleX: scale,
      scaleY: scale,
      left: box.cx,
      top: box.cy,
    });
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
        const institute_uuid =
          user?.institute_uuid || getStoredInstituteUUID();
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

  // Gallary list (with states)
  useEffect(() => {
    if (!canvas) return;
    canvas.selection = true;
  }, [canvas]);

  useEffect(() => {
    const loadGallaries = async () => {
      setGallaryError(null);
      try {
        const user = getStoredUser();
        const institute_uuid =
          user?.institute_uuid || getStoredInstituteUUID();
        const { data } = await axios.get(
          `https://canvaback.onrender.com/api/gallary/GetGallaryList/${institute_uuid}`
        );
        const list = Array.isArray(data?.result)
          ? data.result
          : Array.isArray(data)
          ? data
          : [];
        setGallaries(list);
      } catch (err) {
        console.error("Error fetching gallaries:", err);
        setGallaryError("Failed to load gallery");
        setGallaries([]);
      }
    };
    loadGallaries();
  }, []);

  const applyGallaryResponse = useCallback(
    async (data) => {
      if (!canvas || !data?.image) return;
      canvas
        .getObjects()
        .forEach((obj) => {
          if (obj.customId === "gallaryImage") canvas.remove(obj);
        });
      fabric.Image.fromURL(
        data.image,
        (img) => {
          img.set({ left: 20, top: 20, scaleX: 0.5, scaleY: 0.5 });
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
      setGallaryError(null);
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
        setGallaryError("Failed to load selected gallery");
        toast.error("Failed to load gallary");
      } finally {
        setLoadingGallary(false);
      }
    },
    [applyGallaryResponse, resetHistory, saveHistory]
  );

  /* ======================= Save & cache helpers (existing) ======================= */
  const saveProps = (key, value) => {
    try {
      const tpl = activeTemplateId || "global";
      localStorage.setItem(
        `canvas_props_${tpl}_${key}`,
        JSON.stringify(value)
      );
    } catch (e) {
      console.warn("saveProps failed", e);
    }
  };

  function cacheTemplatePlaceholders(canvas) {
    if (!canvas) return;
    const frameObj = canvas
      .getObjects()
      .find((o) => o.customId === "frameSlot");
    if (frameObj) {
      saveProps("studentPhoto", {
        left: frameObj.left,
        top: frameObj.top,
        scaleX: frameObj.scaleX ?? 1,
        scaleY: frameObj.scaleY ?? 1,
        width: frameObj.width ?? frameObj.getScaledWidth(),
        height: frameObj.height ?? frameObj.getScaledHeight(),
      });
    }
    const textObj = canvas.getObjects().find(
      (o) =>
        o.customId === "studentName" ||
        o.customId === "templateText" ||
        (o.type === "i-text" && !o.customId)
    );
    if (textObj) {
      saveProps("studentName", {
        left: textObj.left,
        top: textObj.top,
        fontSize: textObj.fontSize,
        fill: textObj.fill,
        fontFamily: textObj.fontFamily,
        fontWeight: textObj.fontWeight,
        textAlign: textObj.textAlign,
        originX: textObj.originX,
        originY: textObj.originY,
        width: textObj.width,
      });
    }
  }

  /* ======================= Render Template (existing trimmed) ======================= */
  const renderTemplate = useCallback(
    async (data) => {
      if (!canvas) return;
      const templateIds = [
        "templateBg",
        "frameSlot",
        "templateText",
        "logo",
        "signature",
      ];
      canvas
        .getObjects()
        .filter((o) => o?.customId && templateIds.includes(o.customId))
        .forEach((o) => canvas.remove(o));

      const w = Number(data?.width) || canvas.width;
      const h = Number(data?.height) || canvas.height;
      setTplSize({ w, h });
      setCanvasSize?.(w, h);

      if (data?.image) {
        await new Promise((resolve) => {
          fabric.Image.fromURL(
            data.image,
            (img) => {
              img.set({
                selectable: false,
                evented: false,
                customId: "templateBg",
              });
              img.scaleX = canvas.width / img.width;
              img.scaleY = canvas.height / img.height;
              canvas.add(img);
              img.sendToBack();
              resolve();
            },
            { crossOrigin: "anonymous" }
          );
        });
      }

      if (data?.canvasJson) {
        canvas.loadFromJSON(data.canvasJson, () => {
          canvas.getObjects().forEach((o) => {
            // classify template text & frame slots
            if (o.type === "i-text" && (!o.customId || /text/i.test(o.customId))) {
              o.customId = "templateText";
            }
            if (
              o.customId === "frameSlot" ||
              (o.type === "path" &&
                ["#7c3aed", "rgb(124,58,237)"].includes(o.stroke))
            ) {
              o.customId = "frameSlot";
            }

            // ✅ ensure objects (except background) stay editable
            if (o.customId === "templateBg") {
              // background stays locked
              o.set({ selectable: false, evented: false });
            } else {
              // everything else: text, shapes, photos, etc.
              o.set({
                selectable: true,
                evented: true,
                lockMovementX: false,
                lockMovementY: false,
                lockScalingX: false,
                lockScalingY: false,
                lockRotation: false,
                hasControls: true,
              });
            }
          });

          cacheTemplatePlaceholders(canvas);
          canvas.requestRenderAll();
        });
      }

      if (showLogo && selectedInstitute?.logo)
        loadTemplateAsset("logo", selectedInstitute.logo, canvas);
      if (showSignature && selectedInstitute?.signature)
        loadTemplateAsset("signature", selectedInstitute.signature, canvas);
    },
    [canvas, selectedInstitute, showLogo, showSignature]
  );

  const loadTemplateById = useCallback(
    async (id) => {
      if (!id) return;
      setLoadingTemplate(true);
      setTemplateError(null);
      try {
        const res = await axios.get(
          `https://canvaback.onrender.com/api/template/${id}`
        );
        await renderTemplate(res.data || {});
        setActiveTemplateId(id);
      } catch (e) {
        setTemplateError("Failed to load template");
        toast.error("Failed to load template");
      } finally {
        setLoadingTemplate(false);
      }
    },
    [renderTemplate]
  );

  useEffect(() => {
    if (templateId) loadTemplateById(templateId);
  }, [templateId, loadTemplateById]);

  function safeLoadImage(url, callback) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => callback(new fabric.Image(img));
    img.onerror = () => console.error("Failed to load image:", url);
    img.src = url;
  }

  useEffect(() => {
    const currentStudent = bulkMode
      ? filteredStudents.find((s) => s?.uuid === bulkList[bulkIndex]) || null
      : selectedStudent;
    if (!canvas || !currentStudent) return;

    canvas
      .getObjects()
      .forEach((o) => {
        if (["studentName", "studentPhoto"].includes(o.customId))
          canvas.remove(o);
      });

    const name = `${currentStudent.firstName || ""} ${
      currentStudent.lastName || ""
    }`.trim();
    let nameObj = canvas
      .getObjects()
      .find(
        (o) =>
          o.customId === "studentName" || o.customId === "templateText"
      );
    if (nameObj) {
      nameObj.set({ text: name, selectable: false, evented: false });
    } else {
      const frameSlot = canvas
        .getObjects()
        .find((o) => o.customId === "frameSlot");
      if (!frameSlot) return;
      nameObj = new fabric.Text(name, {
        left: frameSlot.left + frameSlot.width / 2,
        top: frameSlot.top + frameSlot.height + 10,
        fontSize: 28,
        fill: "#000",
        fontFamily: "Arial",
        fontWeight: "bold",
        originX: "center",
        originY: "top",
        selectable: false,
        evented: false,
        customId: "studentName",
      });
      canvas.add(nameObj);
    }
    canvas.requestRenderAll();

    const frameSlot = canvas
      .getObjects()
      .find((o) => o.customId === "frameSlot");
    if (!frameSlot) return;

    const bounds = frameSlot.getBoundingRect(true);
    if (!bounds.width || !bounds.height) {
      const t = setTimeout(() => setSelectedStudent((s) => ({ ...s })), 30);
      return () => clearTimeout(t);
    }

    const photoUrl = Array.isArray(currentStudent.photo)
      ? currentStudent.photo[0]
      : currentStudent.photo;
    if (!photoUrl) return;

    const perStudent =
      studentLayoutsRef.current?.[currentStudent.uuid]?.studentPhotoProps;
    const savedPhoto = perStudent ?? getSavedProps("studentPhoto") ?? {};

    safeLoadImage(photoUrl, (img) => {
      if (!img) return;
      let clipPath;
      if (frameSlot.type === "path" && frameSlot.path) {
        clipPath = new fabric.Path(frameSlot.path, {
          originX: "center",
          originY: "center",
          left: frameSlot.left,
          top: frameSlot.top,
          scaleX: frameSlot.scaleX || 1,
          scaleY: frameSlot.scaleY || 1,
          absolutePositioned: true,
        });
      } else if (
        frameSlot.type === "polygon" ||
        frameSlot.type === "polyline"
      ) {
        clipPath =
          new fabric[
            frameSlot.type.charAt(0).toUpperCase() + frameSlot.type.slice(1)
          ](frameSlot.points, {
            originX: "center",
            originY: "center",
            left: frameSlot.left,
            top: frameSlot.top,
            scaleX: frameSlot.scaleX || 1,
            scaleY: frameSlot.scaleY || 1,
            absolutePositioned: true,
          });
      } else {
        clipPath = new fabric.Rect({
          width: bounds.width,
          height: bounds.height,
          originX: "center",
          originY: "center",
          left: bounds.left + bounds.width / 2,
          top: bounds.top + bounds.height / 2,
          absolutePositioned: true,
        });
      }

      const scale = Math.max(bounds.width / img.width, bounds.height / img.height);
      img.set({
        originX: "center",
        originY: "center",
        left: savedPhoto.left ?? bounds.left + bounds.width / 2,
        top: savedPhoto.top ?? bounds.top + bounds.height / 2,
        scaleX: savedPhoto.scaleX ?? scale,
        scaleY: savedPhoto.scaleY ?? scale,
        angle: savedPhoto.angle ?? 0,
        selectable: true,
        evented: true,
        customId: "studentPhoto",
        clipPath,
      });

      const persist = () => {
        const uuid = currentStudent.uuid;
        if (!studentLayoutsRef.current[uuid])
          studentLayoutsRef.current[uuid] = {};
        studentLayoutsRef.current[uuid].studentPhotoProps = {
          left: img.left,
          top: img.top,
          scaleX: img.scaleX,
          scaleY: img.scaleY,
          angle: img.angle,
        };
        saveProps(
          "studentPhoto",
          studentLayoutsRef.current[uuid].studentPhotoProps
        );
      };
      img.on("modified", persist);
      img.on("scaling", persist);
      img.on("moving", persist);

      canvas.add(img);
      img.moveTo(canvas.getObjects().indexOf(frameSlot) + 1);

      frameSlot.set({ stroke: null, selectable: false, evented: false });

      studentObjectsRef.current.push(img);
      canvas.requestRenderAll();
    });
  }, [canvas, selectedStudent, bulkMode, bulkIndex, filteredStudents, bulkList]);

  function loadTemplateAsset(id, url, canvas) {
    const existing = canvas.getObjects().find((obj) => obj.customId === id);
    if (existing) return;
    const saved = getSavedProps(id);
    safeLoadImage(url, (img) => {
      if (!img) return;
      if (saved) {
        const scaleX =
          saved.width && img.width ? saved.width / img.width : img.scaleX ?? 1;
        const scaleY =
          saved.height && img.height
            ? saved.height / img.height
            : img.scaleY ?? 1;
        img.set({
          left: saved.left ?? 20,
          top: saved.top ?? 20,
          scaleX,
          scaleY,
          angle: saved.angle ?? 0,
        });
      }
      img.customId = id;
      canvas.add(img);
      img.setCoords();
      canvas.requestRenderAll();
    });
  }

  // ✨ ADDED: Ctrl/Cmd + wheel zoom-at-cursor, Space to pan (scroll viewport)
  useEffect(() => {
    const el = canvasRef.current?.getElement?.();
    const vp = viewportRef.current;
    if (!el || !vp) return;

    const onWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = -e.deltaY;
      let newZoom = zoom * (delta > 0 ? 1.1 : 0.9);
      newZoom = Math.max(0.1, Math.min(4, newZoom));
      const zoomPct = Math.round(newZoom * 100);
      handleZoomChange(zoomPct);
      const cx = (mx / (tplSize.w * newZoom)) * el.clientWidth;
      const cy = (my / (tplSize.h * newZoom)) * el.clientHeight;
      vp.scrollLeft = Math.max(0, cx - vp.clientWidth / 2);
      vp.scrollTop = Math.max(0, cy - vp.clientHeight / 2);
    };

    let panning = false;
    const onKeyDown = (e) => {
      if (e.code === "Space") {
        panning = true;
        vp.style.cursor = "grab";
      }
    };
    const onKeyUp = (e) => {
      if (e.code === "Space") {
        panning = false;
        vp.style.cursor = "default";
      }
    };
    const onMouseMove = (e) => {
      if (!panning) return;
      vp.scrollLeft -= e.movementX;
      vp.scrollTop -= e.movementY;
    };

    vp.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    vp.addEventListener("mousemove", onMouseMove);
    return () => {
      vp.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      vp.removeEventListener("mousemove", onMouseMove);
    };
  }, [zoom, tplSize, handleZoomChange]);

  // ✨ ADDED: Drag & Drop image over stage to upload
  useEffect(() => {
    const host = stageRef.current;
    if (!host) return;
    const onDragOver = (e) => {
      e.preventDefault();
      host.classList.add("ring-2", "ring-indigo-400");
    };
    const onDragLeave = () =>
      host.classList.remove("ring-2", "ring-indigo-400");
    const onDrop = (e) => {
      e.preventDefault();
      host.classList.remove("ring-2", "ring-indigo-400");
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setCropSrc(reader.result);
          cropCallbackRef.current = (croppedUrl) => {
            addImage(croppedUrl);
            // after adding, try to snap to slot if overlapping
            const obj = canvas?.getObjects()?.slice(-1)[0];
            if (obj && obj.type === "image")
              setTimeout(() => snapImageToNearestSlot(obj), 50);
          };
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Drop an image file");
      }
    };
    host.addEventListener("dragover", onDragOver);
    host.addEventListener("dragleave", onDragLeave);
    host.addEventListener("drop", onDrop);
    return () => {
      host.removeEventListener("dragover", onDragOver);
      host.removeEventListener("dragleave", onDragLeave);
      host.removeEventListener("drop", onDrop);
    };
  }, [canvas, addImage, setCropSrc]);

  // Object events for history
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

  // Double-click image to adjust
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

  // Update design canvas to match selected page size (only when print sizing is enabled)
  useEffect(() => {
    if (!usePrintSizing) return;
    if (!canvas) return;
    const W = contentPx.W,
      H = contentPx.H;
    setTplSize({ w: W, h: H });
    setCanvasSize?.(W, H);
  }, [canvas, contentPx.W, contentPx.H, setCanvasSize, usePrintSizing]);

  // Draw bleed/safe/crop marks as Fabric overlay (only when print sizing is enabled)
  useEffect(() => {
    if (!usePrintSizing) return;
    if (!canvas) return;
    const prevOverlay = canvas._renderOverlay;
    canvas._renderOverlay = (ctx) => {
      const W = canvas.getWidth();
      const H = canvas.getHeight();
      const trimX = bleedPx.left;
      const trimY = bleedPx.top;
      const trimW = W - bleedPx.left - bleedPx.right;
      const trimH = H - bleedPx.top - bleedPx.bottom;
      ctx.save();
      ctx.strokeStyle = "rgba(255,0,0,0.6)";
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(trimX + 0.5, trimY + 0.5, trimW - 1, trimH - 1);
      ctx.restore();
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
      }
      if (typeof prevOverlay === "function") prevOverlay(ctx);
    };
    canvas.requestRenderAll();
    return () => {
      if (!canvas) return;
      canvas._renderOverlay = prevOverlay;
      canvas.requestRenderAll();
    };
  }, [canvas, bleedPx, safePx, showMarks, showReg, dpi, usePrintSizing]);

  const extractActiveImage = () => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== "image") {
      toast.error("Select an image to extract");
      return;
    }
    removeMaskAndFrame(canvas, obj, false);
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

  // ✨ ADDED: Align to canvas edges & distribute with spacing
  const alignToCanvas = (dir) => {
    if (!canvas) return;
    const sel = canvas.getActiveObject();
    const objs =
      sel?.type === "activeSelection" ? sel._objects : sel ? [sel] : [];
    if (!objs.length) {
      toast.error("Select object(s)");
      return;
    }
    const W = canvas.getWidth(),
      H = canvas.getHeight();
    objs.forEach((o) => {
      const r = o.getBoundingRect(true, true);
      if (dir === "left") o.left = 0;
      if (dir === "right") o.left = W - r.width;
      if (dir === "top") o.top = 0;
      if (dir === "bottom") o.top = H - r.height;
      if (dir === "hcenter") o.left = (W - r.width) / 2;
      if (dir === "vcenter") o.top = (H - r.height) / 2;
      o.setCoords();
    });
    canvas.requestRenderAll();
    saveHistoryDebounced();
  };

  const distributeWithSpacing = (axis = "h", spacing = 20) => {
    const sel = canvas?.getActiveObject();
    if (!sel || sel.type !== "activeSelection") {
      toast.error("Select multiple objects");
      return;
    }
    const objs = sel._objects
      .slice()
      .sort((a, b) => (axis === "h" ? a.left - b.left : a.top - b.top));
    if (objs.length < 3) return;
    if (axis === "h") {
      let x = objs[0].left;
      objs.forEach((o, i) => {
        if (i === 0) return;
        const prev = objs[i - 1];
        x =
          prev.left +
          prev.getBoundingRect(true, true).width +
          spacing;
        o.left = x;
        o.setCoords();
      });
    } else {
      let y = objs[0].top;
      objs.forEach((o, i) => {
        if (i === 0) return;
        const prev = objs[i - 1];
        y =
          prev.top +
          prev.getBoundingRect(true, true).height +
          spacing;
        o.top = y;
        o.setCoords();
      });
    }
    canvas.discardActiveObject();
    const as = new fabric.ActiveSelection(objs, { canvas });
    canvas.setActiveObject(as);
    canvas.requestRenderAll();
    saveHistoryDebounced();
  };

  // Carousel (bulk) — unchanged (trimmed)
  const rebuildBulkFromFiltered = () => {
    const ids = (filteredStudents.length ? filteredStudents : allStudents).map(
      (s) => s.uuid
    );
    setBulkList(ids);
    setBulkIndex(0);
    if (ids.length)
      setSelectedStudent(filteredStudents[0]);
    else setSelectedStudent(null);
  };
  useEffect(() => {
    if (bulkMode) rebuildBulkFromFiltered();
  }, [bulkMode, filteredStudents]); // eslint-disable-line

  const gotoIndex = (idx) => {
    if (!bulkList.length) return;
    if (canvasRef.current && bulkList[bulkIndex]) {
      const objs = canvasRef.current.getObjects();
      objs
        .filter((o) => o.customId === "studentPhoto")
        .forEach((p) => canvasRef.current.remove(p));
      studentLayoutsRef.current[bulkList[bulkIndex]] =
        canvasRef.current.toJSON();
    }
    const n = ((idx % bulkList.length) + bulkList.length) % bulkList.length;
    setBulkIndex(n);
    const uuid = bulkList[n];
    const st =
      (filteredStudents.length ? filteredStudents : allStudents).find(
        (s) => s.uuid === uuid
      ) || null;
    if (!canvasRef.current) {
      setSelectedStudent(st);
      return;
    }
    const saved = studentLayoutsRef.current[uuid];
    if (saved?.canvas) {
      const savedJson = JSON.parse(JSON.stringify(saved.canvas));
      if (Array.isArray(savedJson.objects))
        savedJson.objects = savedJson.objects.filter(
          (obj) => obj.customId !== "studentPhoto"
        );
      canvasRef.current.loadFromJSON(savedJson, () => {
        canvasRef.current.renderAll();
        setSelectedStudent(st);
      });
    } else {
      canvasRef.current.requestRenderAll();
      setSelectedStudent(st);
    }
  };
  const prevStudent = () => gotoIndex(bulkIndex - 1);
  const nextStudent = () => gotoIndex(bulkIndex + 1);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const downloadCurrentPNG = () => {
    const current = bulkMode
      ? filteredStudents.find((s) => s?.uuid === bulkList[bulkIndex]) ||
        selectedStudent
      : selectedStudent;
    const name =
      current?.firstName || current?.lastName
        ? `${(current?.firstName || "").trim()}_${(
            current?.lastName || ""
          ).trim()}`
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
          ? `${(st?.firstName || "").trim()}_${(
              st?.lastName || ""
            ).trim()}`
          : `canvas_${i + 1}`;
      downloadHighRes?.(tplSize.w, tplSize.h, `${name}.png`);
      await sleep(300);
    }
    toast.success("Bulk export complete.");
  };

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
    const doc = new jsPDF({
      orientation: w_mm > h_mm ? "l" : "p",
      unit: "mm",
      format: [w_mm, h_mm],
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    const png = canvas.toDataURL({ format: "png", quality: 1 });
    doc.addImage(png, "PNG", 0, 0, w_mm, h_mm);
    if (showMarks) {
      const trim = getTrimBoundsPx();
      const toMM = (px) => pxToMm(px, dpi);
      const markLen = 4,
        off = 1.5;
      doc.setLineWidth(0.2);
      const line = (x1, y1, x2, y2) => doc.line(x1, y1, x2, y2);
      const tx = toMM(trim.x),
        ty = toMM(trim.y),
        tw = toMM(trim.w),
        th = toMM(trim.h);
      line(tx - off, ty, tx - off, ty + markLen);
      line(tx, ty - off, tx + markLen, ty - off);
      line(tx + tw + off, ty, tx + tw + off, ty + markLen);
      line(tx + tw - markLen, ty - off, tx + tw, ty - off);
      line(tx - off, ty + th - markLen, tx - off, ty + th);
      line(tx, ty + th + off, tx + markLen, ty + th + off);
      line(tx + tw + off, ty + th - markLen, tx + tw + off, ty + th);
      line(
        tx + tw - markLen,
        ty + th + off,
        tx + tw,
        ty + th + off
      );
      if (showReg) {
        const cx = w_mm / 2,
          cy = h_mm / 2;
        doc.circle(cx, cy, 2);
        doc.line(cx - 3, cy, cx + 3, cy);
        doc.line(cx, cy - 3, cx, cy + 3);
      }
    }
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    doc.save(
      `design_${pagePreset}_${pageOrientation}_${dpi}dpi_${ts}.pdf`
    );
  };

  /* ====================== ✨ ADDED: Export Imposed Sheet PDF ====================== */
  const exportImposedPDF = () => {
    try {
      if (!imposeOn) {
        toast.error("Enable 'Imposed PDF' in Print Settings first.");
        return;
      }
      // Compute sheet size (mm)
      const baseSheet =
        sheetPreset === "Custom"
          ? sheetCustom
          : PRESET_SIZES[sheetPreset] || PRESET_SIZES.A4;
      const sheetWmm = baseSheet.w_mm;
      const sheetHmm = baseSheet.h_mm;

      // Tile geometry (mm)
      const innerWmm = sheetWmm - (outer.left + outer.right);
      const innerHmm = sheetHmm - (outer.top + outer.bottom);
      const totalGapXmm = (cols - 1) * gap.x_mm;
      const totalGapYmm = (rows - 1) * gap.y_mm;
      const cellWmm = (innerWmm - totalGapXmm) / cols;
      const cellHmm = (innerHmm - totalGapYmm) / rows;

      // Render current canvas to PNG
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      const png = canvas.toDataURL({ format: "png", quality: 1 });

      // Build the PDF with sheet size (mm)
      const doc = new jsPDF({
        orientation: sheetWmm >= sheetHmm ? "l" : "p",
        unit: "mm",
        format: [sheetWmm, sheetHmm],
        compress: true,
      });

      // Place tiles row by row
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = outer.left + c * (cellWmm + gap.x_mm);
          const y = outer.top + r * (cellHmm + gap.y_mm);
          doc.addImage(png, "PNG", x, y, cellWmm, cellHmm);
        }
      }

      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      doc.save(`Imposed_${cols}x${rows}_${sheetPreset}_${ts}.pdf`);
      toast.success("Imposed PDF ready.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export imposed PDF.");
    }
  };

  /* ============================ UI =================================== */
  const [showHelp, setShowHelp] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false); // currently unused but kept

  return (
    <div className="min-h-screen w-screen overflow-hidden bg-gray-100 pb-14 md:pb-0 flex flex-col">
      <Toaster position="top-right" />

      <CanvasTopBar
        activeObj={activeObj}
        alignToCanvas={alignToCanvas}
        bulkMode={bulkMode}
        canvas={canvas}
        canvasRef={canvasRef}
        distributeWithSpacing={distributeWithSpacing}
        downloadBulkPDF={downloadBulkPDF}
        downloadBulkPNGs={downloadBulkPNGs}
        downloadCurrentPNG={downloadCurrentPNG}
        exportImposedPDF={exportImposedPDF}
        exportSinglePDF={exportSinglePDF}
        fitToViewport={fitToViewport}
        handleSizeChange={handleSizeChange}
        handleZoomChange={handleZoomChange}
        hideHeader={hideHeader}
        imposeOn={imposeOn}
        isShape={isShape}
        isText={isText}
        navigateBack={() => navigate(-1)}
        saveHistoryDebounced={saveHistoryDebounced}
        setIsRightbarOpen={setIsRightbarOpen}
        setRightPanel={setRightPanel}
        setShowHelp={setShowHelp}
        setSnapCenterGuides={setSnapCenterGuides}
        setSnapObjects={setSnapObjects}
        setSnapTolerance={setSnapTolerance}
        setShowGrid={setShowGrid}
        setGradientFill={setGradientFill}
        showGrid={showGrid}
        snapCenterGuides={snapCenterGuides}
        snapObjects={snapObjects}
        snapTolerance={snapTolerance}
        tplSize={tplSize}
        zoom={zoom}
      />

      <CanvasToolbox
        addCircle={addCircle}
        addRect={addRect}
        addText={addText}
        duplicateObject={duplicateObject}
        handleUpload={handleUpload}
        redo={redo}
        setIsRightbarOpen={setIsRightbarOpen}
        setRightPanel={setRightPanel}
        setShowMobileTools={setShowMobileTools}
        showMobileTools={showMobileTools}
        undo={undo}
        withFabClose={withFabClose}
      />

      {/* CENTER / Canva-like viewport */}
      <div className="relative flex-1 flex flex-col md:flex-row">
        <main
          ref={viewportRef}
          className="relative bg-gray-100 flex-1 overflow-auto flex items-center justify-center"
        >
          <div className="flex flex-col items-center">
            <div
              ref={stageRef}
              style={{
                width: `${tplSize.w * zoom}px`,
                height: `${tplSize.h * zoom}px`,
              }}
              className="shadow-lg border bg-white relative"
            >
              <CanvasArea
                ref={canvasRef}
                width={tplSize.w}
                height={tplSize.h}
              />
              {showToolbar && activeObj && (
                <SelectionToolbar activeObj={activeObj} canvas={canvas} />
              )}
            </div>

            {bulkMode && (
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  className="p-3 rounded-full bg-white border shadow-sm active:scale-95"
                  title="Previous"
                  onClick={prevStudent}
                  onTouchEnd={prevStudent}
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="px-2 text-sm text-gray-700">
                  {bulkList.length
                    ? `${bulkIndex + 1}/${bulkList.length}`
                    : "0/0"}
                </div>
                <button
                  type="button"
                  className="p-3 rounded-full bg-white border shadow-sm active:scale-95"
                  title="Next"
                  onClick={nextStudent}
                  onTouchEnd={nextStudent}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}

            {cropSrc && (
              <ImageCropModal
                src={cropSrc}
                onCancel={() => setCropSrc(null)}
                onConfirm={(img) => {
                  if (cropCallbackRef.current) {
                    cropCallbackRef.current(img);
                  }
                  setCropSrc(null);
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* RIGHT SIDEBAR / BOTTOM SHEET PANELS */}
      <RightSidebar
        isMobile={isMobile}
        isRightbarOpen={isRightbarOpen}
        rightPanel={rightPanel}
        setIsRightbarOpen={setIsRightbarOpen}
        setRightPanel={setRightPanel}
        // gallery
        gallaries={gallaries}
        loadingGallary={loadingGallary}
        gallaryError={gallaryError}
        loadGallaryById={loadGallaryById}
        // templates
        templates={templates}
        loadingTemplate={loadingTemplate}
        templateError={templateError}
        loadTemplateById={loadTemplateById}
        activeTemplateId={activeTemplateId}
        tplSize={tplSize}
        setSavedPlaceholders={setSavedPlaceholders}
        frameCorner={frameCorner}
        // canvas
        canvas={canvas}
        setActiveObj={setActiveObj}
        // bulk
        bulkMode={bulkMode}
        setBulkMode={setBulkMode}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        showLogo={showLogo}
        setShowLogo={setShowLogo}
        showSignature={showSignature}
        setShowSignature={setShowSignature}
        courses={courses}
        batches={batches}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        selectedBatch={selectedBatch}
        setSelectedBatch={setSelectedBatch}
        selectedStudent={selectedStudent}
        filteredStudents={filteredStudents}
        allStudents={allStudents}
        handleStudentSelect={handleStudentSelect}
        // print settings
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
        // frames
        addFrameSlot={addFrameSlot}
        // object settings
        activeObj={activeObj}
        setActiveStudentPhoto={setActiveStudentPhoto}
        imgFilters={imgFilters}
        setImgFilters={setImgFilters}
        cropImage={cropImage}
        removeSelectedImageBackground={removeSelectedImageBackground}
        replaceInputRef={replaceInputRef}
        replaceActiveImage={replaceActiveImage}
        extractActiveImage={extractActiveImage}
        saveHistoryDebounced={saveHistoryDebounced}
      />

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

      {isMobile && <BottomNavBar />}

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Bottom fixed nav (for opening panels) */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex h-14 bg-white border-t shadow-md md:hidden">
          <button
            className="flex-1 flex flex-col items-center justify-center text-xs"
            onClick={() => {
              setIsRightbarOpen(true);
              setRightPanel("gallaries");
            }}
          >
            <span>Gallery</span>
          </button>

          <button
            className="flex-1 flex flex-col items-center justify-center text-xs"
            onClick={() => {
              setIsRightbarOpen(true);
              setRightPanel("templates");
            }}
          >
            <span>Templates</span>
          </button>

          <button
            className="flex-1 flex flex-col items-center justify-center text-xs"
            onClick={() => {
              setIsRightbarOpen(true);
              setRightPanel("bulk");
            }}
          >
            <span>Bulk</span>
          </button>

          <button
            className="flex-1 flex flex-col items-center justify-center text-xs"
            onClick={() => {
              setIsRightbarOpen(true);
              setRightPanel("object");
            }}
          >
            <span>Edit</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CanvasEditor;
