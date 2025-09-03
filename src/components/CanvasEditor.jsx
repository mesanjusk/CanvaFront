import React, { useEffect, useState, useCallback, forwardRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useCanvasEditor } from "../hooks/useCanvasEditor";
import { useCanvasTools } from "../hooks/useCanvasTools";
import { getStoredUser, getStoredInstituteUUID } from "../utils/storageUtils";
import {
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from "@mui/material";
import Cropper from "react-easy-crop";
import axios from "axios";
import { useParams } from "react-router-dom";
import { fabric } from "fabric";
import {
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
  Settings,
  Maximize2,
  Group,
  AlignLeft as AlignLeftIcon,
  AlignCenter as AlignCenterIcon,
  AlignRight as AlignRightIcon,
  AlignStartVertical,
  AlignVerticalSpaceAround,
  AlignEndVertical,
  ArrowUpFromLine,
  ArrowDownToLine,
} from "lucide-react";

// -----------------------------------------------------------------------------
// Small UI helpers
// -----------------------------------------------------------------------------
const IconButton = ({ onClick, title, children, className = "" }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded bg-white shadow hover:bg-blue-100 ${className}`.trim()}
    type="button"
  >
    {children}
  </button>
);

const FontSelector = ({ activeObj, canvas }) => (
  <select
    className="border rounded px-2 py-1"
    onChange={(e) => {
      activeObj?.set("fontFamily", e.target.value);
      canvas?.renderAll();
    }}
    defaultValue={activeObj?.fontFamily || "Arial"}
  >
    {["Arial", "Roboto", "Lobster"].map((f) => (
      <option key={f} value={f} style={{ fontFamily: f }}>
        {f}
      </option>
    ))}
  </select>
);

// -----------------------------------------------------------------------------
// Canvas surface
// -----------------------------------------------------------------------------
const CanvasArea = forwardRef(({ width, height }, ref) => {
  useEffect(() => {
    const canvas = new fabric.Canvas("main-canvas", {
      width,
      height,
      backgroundColor: "#fff",
      preserveObjectStacking: true,
    });
    if (ref) ref.current = canvas;

    return () => {
      canvas.dispose();
    };
  }, [width, height, ref]);

  return (
    <div className="bg-white shadow border">
      <canvas id="main-canvas" />
    </div>
  );
});

// -----------------------------------------------------------------------------
// Templates panel (right side — small grid)
// -----------------------------------------------------------------------------
const defaultTemplates = [
  { name: "Blank", data: { version: "5.2.4", objects: [] }, image: null },
];

const TemplateCard = ({ template, onSelect }) => (
  <div
    className="cursor-pointer rounded overflow-hidden shadow hover:shadow-lg bg-white dark:bg-gray-700"
    onClick={() =>
      onSelect(template.layout ? JSON.parse(template.layout) : template.data)
    }
  >
    {template.image && (
      <img
        src={template.image}
        alt={template.title || template.name}
        className="w-full h-20 object-cover"
      />
    )}
    <div className="p-2 text-center text-xs">
      {template.title || template.name}
    </div>
  </div>
);

const TemplatePanel = ({ loadTemplate }) => {
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    axios
      .get("https://canvaback.onrender.com/api/templatelayout")
      .then((res) => setSaved(res.data))
      .catch(() => {});
  }, []);

  const templates = defaultTemplates.concat(saved);

  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      {templates.map((t, idx) => (
        <TemplateCard key={idx} template={t} onSelect={loadTemplate} />
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Undo/Redo cluster (top bar)
// -----------------------------------------------------------------------------
const UndoRedoControls = ({ undo, redo, duplicateObject, downloadPDF }) => (
  <div className="flex gap-2">
    <IconButton onClick={undo} title="Undo">Undo</IconButton>
    <IconButton onClick={redo} title="Redo">Redo</IconButton>
    <IconButton onClick={duplicateObject} title="Duplicate">Duplicate</IconButton>
    <IconButton onClick={downloadPDF} title="Export PDF">PDF</IconButton>
  </div>
);

// -----------------------------------------------------------------------------
// Floating toolbar (appears above canvas for active object)
// -----------------------------------------------------------------------------
const FloatingObjectToolbar = ({
  activeObj,
  cropImage,
  handleDelete,
  toggleLock,
  setShowSettings,
  fitCanvasToObject,
  isLocked,
  multipleSelected,
  groupObjects,
  ungroupObjects,
  canvas,
  children,
}) => {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-white shadow-lg rounded px-3 py-2 flex gap-3 items-center">
      <IconButton onClick={cropImage} title="Crop"><Crop size={20} /></IconButton>
      <IconButton onClick={handleDelete} title="Delete"><Trash2 size={20} /></IconButton>
      <IconButton onClick={() => toggleLock(activeObj)} title={isLocked ? "Unlock" : "Lock"}>
        {isLocked ? <Unlock size={20} /> : <Lock size={20} />}
      </IconButton>
      <IconButton onClick={() => setShowSettings(true)} title="Settings"><Settings size={20} /></IconButton>
      <IconButton onClick={fitCanvasToObject} title="Fit Canvas"><Maximize2 size={20} /></IconButton>
      {multipleSelected && <IconButton onClick={groupObjects} title="Group"><Group size={20} /></IconButton>}
      {activeObj?.type === "group" && <IconButton onClick={ungroupObjects} title="Ungroup"><RefreshCw size={20} /></IconButton>}
      <FontSelector activeObj={activeObj} canvas={canvas} />
      {children}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Image crop helper
// -----------------------------------------------------------------------------
function getCroppedImg(src, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = src;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
      }, "image/png");
    };
    image.onerror = (e) => reject(e);
  });
}

const aspectOptions = {
  Free: undefined,
  "1:1": 1 / 1,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
  "3:4": 3 / 4,
};

const ImageCropModal = ({ src, onCancel, onConfirm }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    try {
      const croppedImgUrl = await getCroppedImg(src, croppedAreaPixels);
      onConfirm(croppedImgUrl);
    } catch (e) {
      alert("Crop failed: " + e.message);
    }
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Crop Image</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <FormControl variant="standard">
          <InputLabel id="aspect-label">Aspect Ratio</InputLabel>
          <Select
            labelId="aspect-label"
            value={aspect ?? "Free"}
            onChange={(e) => {
              const value = e.target.value;
              setAspect(value === "Free" ? undefined : Number(value));
            }}
          >
            {Object.entries(aspectOptions).map(([label, value]) => (
              <MenuItem key={label} value={value ?? "Free"}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <div style={{ position: "relative", width: "100%", height: 350, background: "#333" }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <Slider value={zoom} min={1} max={3} step={0.01} onChange={(_, v) => setZoom(v)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleConfirm} variant="contained" color="primary">Confirm</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

// -----------------------------------------------------------------------------
// Bottom toolbar (merged from BottomToolbar.jsx)
// -----------------------------------------------------------------------------
const BottomToolbar = ({
  alignLeft,
  alignCenter,
  alignRight,
  alignTop,
  alignMiddle,
  alignBottom,
  bringToFront,
  sendToBack,
}) => {
  return (
    <div className="fixed bottom-0 w-full bg-white border-t shadow z-30 px-2 py-2 overflow-x-auto scrollbar-thin flex justify-start items-center gap-1">
      <IconButton onClick={alignLeft} title="Align Left"><AlignLeftIcon size={22} /></IconButton>
      <IconButton onClick={alignCenter} title="Align Center"><AlignCenterIcon size={22} /></IconButton>
      <IconButton onClick={alignRight} title="Align Right"><AlignRightIcon size={22} /></IconButton>
      <IconButton onClick={alignTop} title="Align Top"><AlignStartVertical size={22} /></IconButton>
      <IconButton onClick={alignMiddle} title="Align Middle"><AlignVerticalSpaceAround size={22} /></IconButton>
      <IconButton onClick={alignBottom} title="Align Bottom"><AlignEndVertical size={22} /></IconButton>
      <IconButton onClick={bringToFront} title="Bring to Front"><ArrowUpFromLine size={22} /></IconButton>
      <IconButton onClick={sendToBack} title="Send to Back"><ArrowDownToLine size={22} /></IconButton>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main editor
// -----------------------------------------------------------------------------
const CanvasEditor = ({ templateId: propTemplateId, onSaved, hideHeader = false }) => {
  const { templateId: routeId } = useParams();
  const templateId = propTemplateId || routeId;

  // data
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [savedPlaceholders, setSavedPlaceholders] = useState([]);
  const [templateImage, setTemplateImage] = useState(null);
  const [activeStudentPhoto, setActiveStudentPhoto] = useState(null);
  const [selectedInstitute, setSelectedInstitute] = useState(null);

  const studentObjectsRef = React.useRef([]);
  const bgRef = React.useRef(null);
  const logoRef = React.useRef(null);
  const signatureRef = React.useRef(null);

  // hooks
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
  } = useCanvasTools({ width: 400, height: 550 });

  const {
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
  } = useCanvasEditor(canvasRef, canvasWidth, canvasHeight);

  const getSavedProps = useCallback(
    (field) => savedPlaceholders.find((p) => p.field === field) || null,
    [savedPlaceholders]
  );

  // helper: clip shape
  const createClipShape = (shapeType, width, height) => {
    if (shapeType === "circle") {
      return new fabric.Circle({ radius: Math.min(width, height) / 2, originX: "center", originY: "center" });
    }
    return new fabric.Rect({ width, height, originX: "center", originY: "center" });
  };

  // student photo controls
  const handleZoomIn = () => {
    if (activeStudentPhoto) {
      activeStudentPhoto.scaleX *= 1.1;
      activeStudentPhoto.scaleY *= 1.1;
      canvas.renderAll();
    }
  };
  const handleZoomOut = () => {
    if (activeStudentPhoto) {
      activeStudentPhoto.scaleX *= 0.9;
      activeStudentPhoto.scaleY *= 0.9;
      canvas.renderAll();
    }
  };
  const handleReset = () => {
    if (activeStudentPhoto) {
      activeStudentPhoto.scaleX = 1;
      activeStudentPhoto.scaleY = 1;
      canvas.renderAll();
    }
  };

  // fetch courses & batches
  useEffect(() => {
    const fetchCoursesAndBatches = async () => {
      try {
        const [courseRes, batchRes] = await Promise.all([
          axios.get("https://socialbackend-iucy.onrender.com/api/courses"),
          axios.get("https://socialbackend-iucy.onrender.com/api/batches"),
        ]);
        setCourses(courseRes.data || []);
        setBatches(batchRes.data || []);
      } catch (err) {
        toast.error("Error loading courses/batches");
      }
    };
    fetchCoursesAndBatches();
  }, []);

  // fetch students list (global)
  useEffect(() => {
    axios
      .get("https://canvaback.onrender.com/api/students")
      .then((res) => setStudents(res.data.data))
      .catch(() => {});
  }, []);

  // admissions based on course+batch
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

  // institute
  useEffect(() => {
    const fetchInstitute = async () => {
      try {
        const user = getStoredUser();
        const institute_uuid = user?.institute_uuid || getStoredInstituteUUID();
        if (institute_uuid) {
          const res = await axios.get(`https://canvaback.onrender.com/api/institute/${institute_uuid}`);
          const institute = res.data.result || res.data.data || res.data;
          setSelectedInstitute({ ...institute, logo: institute.logo || null, signature: institute.signature || null });
        }
      } catch {}
    };
    fetchInstitute();
  }, []);

  // template
  useEffect(() => {
    if (!templateId) return;
    const fetchTemplate = async () => {
      try {
        const res = await axios.get(`https://canvaback.onrender.com/api/template/${templateId}`);
        setSavedPlaceholders(res.data?.placeholders || []);
        if (res.data?.image) {
          const img = await new Promise((resolve) =>
            fabric.Image.fromURL(res.data.image, resolve, { crossOrigin: "anonymous" })
          );
          img.set({ selectable: false, evented: false, hasControls: false, left: 0, top: 0 });
          img.customId = "templateBg";
          setTemplateImage(img);
        }
      } catch {}
    };
    fetchTemplate();
  }, [templateId]);

  // render template+student
  const renderTemplateAndStudent = useCallback(() => {
    if (!canvas || !selectedInstitute) return;
    if (bgRef.current) canvas.remove(bgRef.current);
    if (logoRef.current) canvas.remove(logoRef.current);
    if (signatureRef.current) canvas.remove(signatureRef.current);
    studentObjectsRef.current.forEach((o) => canvas.remove(o));
    studentObjectsRef.current = [];
    bgRef.current = null;
    logoRef.current = null;
    signatureRef.current = null;

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
      fabric.Image.fromURL(url, (img) => { if (!cancelled) cb(img); }, { crossOrigin: "anonymous" });
    };

    // student name
    if (selectedStudent) {
      const savedName = getSavedProps("studentName");
      const nameText = new fabric.IText(
        `${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`.trim(),
        {
          left: savedName?.left ?? 130,
          top: savedName?.top ?? 300,
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
    const photoUrl = Array.isArray(selectedStudent?.photo) ? selectedStudent.photo[0] : selectedStudent?.photo;
    const phWidth = 400, phHeight = 400;
    const savedPhoto = getSavedProps("studentPhoto");
    const photoLeft = savedPhoto?.left ?? 200;
    const photoTop = savedPhoto?.top ?? 180;
    const shapeType = savedPhoto?.shape || "circle";

    const handlePhotoUpload = (oldObj) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          safeLoadImage(ev.target.result, (img) => {
            const autoScale = Math.min(phWidth / img.width, phHeight / img.height, 1);
            img.set({ originX: "center", originY: "center", left: photoLeft, top: photoTop, scaleX: autoScale, scaleY: autoScale });
            img.customId = "studentPhoto";
            img.field = "studentPhoto";
            img.shape = shapeType;
            img.clipPath = createClipShape(shapeType, phWidth, phHeight);
            if (oldObj) canvas.remove(oldObj);
            canvas.add(img);
            studentObjectsRef.current.push(img);
            canvas.renderAll();
            img.on("mousedown", () => handlePhotoUpload(img));
            img.on("selected", () => setActiveStudentPhoto(img));
            img.on("deselected", () => setActiveStudentPhoto(null));
          });
        };
        reader.readAsDataURL(file);
      };
      input.click();
    };

    if (photoUrl) {
      safeLoadImage(photoUrl, (img) => {
        const autoScale = Math.min(phWidth / img.width, phHeight / img.height, 1);
        img.set({ originX: "center", originY: "center", left: photoLeft, top: photoTop, scaleX: savedPhoto?.scaleX ?? autoScale, scaleY: savedPhoto?.scaleY ?? autoScale });
        img.customId = "studentPhoto";
        img.field = "studentPhoto";
        img.shape = shapeType;
        img.clipPath = createClipShape(shapeType, phWidth, phHeight);

         // ✅ Detect selection
    img.on("selected", () => setActiveStudentPhoto(img));
    img.on("deselected", () => setActiveStudentPhoto(null));

        canvas.add(img);
        studentObjectsRef.current.push(img);
        img.on("mousedown", () => handlePhotoUpload(img));
      });
    }

    // logo
    const savedLogo = getSavedProps("logo");
    if (selectedInstitute?.logo) {
      safeLoadImage(selectedInstitute.logo, (img) => {
        if (savedLogo?.scaleX && savedLogo?.scaleY) {
          img.set({ left: savedLogo.left ?? 20, top: savedLogo.top ?? 20, scaleX: savedLogo.scaleX, scaleY: savedLogo.scaleY, angle: savedLogo?.angle ?? 0 });
        } else {
          img.scaleToWidth(80);
          img.set({ left: savedLogo?.left ?? 20, top: savedLogo?.top ?? 20 });
        }
        img.customId = "logo";
        img.field = "logo";
        logoRef.current = img;
        canvas.add(img);
      });
    }

    // signature
    const savedSign = getSavedProps("signature");
    if (selectedInstitute?.signature) {
      safeLoadImage(selectedInstitute.signature, (img) => {
        if (savedSign?.scaleX && savedSign?.scaleY) {
          img.set({ left: savedSign.left ?? canvas.width - 150, top: savedSign.top ?? canvas.height - 80, scaleX: savedSign.scaleX, scaleY: savedSign.scaleY, angle: savedSign?.angle ?? 0 });
        } else {
          img.scaleToWidth(120);
          img.set({ left: savedSign?.left ?? canvas.width - 150, top: savedSign?.top ?? canvas.height - 80 });
        }
        img.customId = "signature";
        img.field = "signature";
        signatureRef.current = img;
        canvas.add(img);
      });
    }

    canvas.renderAll();
    return () => { cancelled = true; };
  }, [canvas, selectedInstitute, templateImage, selectedStudent, getSavedProps]);

  useEffect(() => {
    const t = setTimeout(() => { renderTemplateAndStudent(); }, 200);
    return () => clearTimeout(t);
  }, [renderTemplateAndStudent]);

  // save placeholders
  const saveTemplateLayout = async () => {
    if (!canvas) return;
    const placeholders = canvas.getObjects()
      .filter((o) => o.customId !== "templateBg")
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
          shape: obj.customId === "studentPhoto" ? (obj.shape || "circle") : null,
        };
      });
    try {
      await axios.put(`https://canvaback.onrender.com/api/template/update-canvas/${templateId}`, { placeholders });
      setSavedPlaceholders(placeholders);
      toast.success("Template layout saved!");
    } catch {
      toast.error("Save failed!");
    }
  };

  // ---------------------------------------------------------------------------
  // Align & z-index helpers (for BottomToolbar)
  // ---------------------------------------------------------------------------
  const withActive = (fn) => () => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    fn(obj);
    canvas.requestRenderAll();
    saveHistory();
  };

  const alignLeft = withActive((obj) => {
    obj.set({ left: obj.width ? 0 + obj.width * obj.scaleX / 2 : 0, originX: "center" });
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
    obj.set({ top: obj.height ? 0 + obj.height * obj.scaleY / 2 : 0, originY: "center" });
  });
  const alignMiddle = withActive((obj) => {
    obj.set({ top: canvas.getHeight() / 2, originY: "center" });
  });
  const alignBottom = withActive((obj) => {
    const h = canvas.getHeight();
    const oh = (obj.height || 0) * (obj.scaleY || 1);
    obj.set({ top: h - oh / 2, originY: "center" });
  });
  const bringToFront = withActive((obj) => obj.bringToFront());
  const sendToBack = withActive((obj) => obj.sendToBack());

  // ---------------------------------------------------------------------------
  // UI LAYOUT — fixed top / fixed right / fixed bottom / centered canvas
  // ---------------------------------------------------------------------------
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100">
      <Toaster position="top-right" />

      {/* TOP BAR (fixed) */}
      {!hideHeader && (
        <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b z-40 flex items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <a href="/" className="font-bold">Framee</a>
            <a href="/templates" className="underline">Templates</a>

            {/* Add elements */}
            <div className="flex items-center gap-2 ml-4">
              <button title="Add Text" onClick={addText} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Type size={22} /></button>
              <button title="Add Rectangle" onClick={addRect} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Square size={22} /></button>
              <button title="Add Circle" onClick={addCircle} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Circle size={22} /></button>

              <input type="file" accept="image/*" id="upload-image" style={{ display: "none" }} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    setCropSrc(reader.result);
                    cropCallbackRef.current = (croppedUrl) => { addImage(croppedUrl); };
                  };
                  reader.readAsDataURL(file);
                }
              }} />
              <label htmlFor="upload-image" className="p-2 rounded bg-white shadow hover:bg-blue-100 cursor-pointer" title="Upload Image"><ImageIcon size={22} /></label>

              <UndoRedoControls undo={undo} redo={redo} duplicateObject={duplicateObject} downloadPDF={downloadPDF} />
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <button
              title="Reset Canvas"
              onClick={() => { canvas?.clear(); resetHistory(); saveHistory(); }}
              className="p-2 rounded-full bg-yellow-500 text-white shadow hover:bg-yellow-600"
            >
              <RefreshCw size={18} />
            </button>
            <button title="Download PNG" onClick={downloadHighRes} className="p-2 rounded-full bg-green-600 text-white shadow hover:bg-green-700">
              <Download size={18} />
            </button>
            <button title="Save Template" onClick={saveTemplateLayout} className="px-3 py-2 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 text-sm">
              Save Template
            </button>
          </div>
        </header>
      )}

      {/* RIGHT PANEL (fixed) */}
      <aside className="fixed top-14 right-0 bottom-10 w-72 bg-white border-l z-30 overflow-y-auto">
        <div className="p-3 border-b">
          <div className="text-sm font-semibold mb-2">Template Presets</div>
          <TemplatePanel loadTemplate={(templateJson) => {
            if (canvas) {
              canvas.loadFromJSON(templateJson, () => {
                canvas.renderAll();
                // replacePlaceholders() // optional if you have it
                saveHistory();
              });
            }
          }} />
        </div>

        <div className="p-3 border-b">
          <div className="text-sm font-semibold mb-2">Filters</div>
          <label className="block text-xs mb-1">Course</label>
          <select className="w-full border rounded px-2 py-1 mb-2" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            <option value="">Select course</option>
            {courses.map((c) => (<option key={c._id} value={c.Course_uuid}>{c.name}</option>))}
          </select>

          <label className="block text-xs mb-1">Batch</label>
          <select className="w-full border rounded px-2 py-1 mb-2" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
            <option value="">Select batch</option>
            {batches.map((b) => (<option key={b._id} value={b.name}>{b.name}</option>))}
          </select>

          <label className="block text-xs mb-1">Student</label>
          <select className="w-full border rounded px-2 py-1" onChange={(e) => handleStudentSelect(e.target.value)}>
            <option value="">Select a student</option>
            {filteredStudents.map((s) => (
              <option key={s.uuid} value={s.uuid}>{s.firstName} {s.lastName}</option>
            ))}
          </select>
        </div>

        {activeObj && (
          <div className="p-3">
            <div className="text-sm font-semibold mb-2">Selected Object</div>
            <div className="flex flex-wrap gap-2">
              <IconButton onClick={cropImage} title="Crop"><Crop size={18} /></IconButton>
              <IconButton onClick={() => { canvas?.remove(activeObj); setActiveObj(null); saveHistory(); }} title="Delete"><Trash2 size={18} /></IconButton>
              <IconButton onClick={() => { const locked = !!activeObj.lockMovementX; activeObj.set({ lockMovementX: !locked, lockMovementY: !locked, hasControls: locked }); canvas.renderAll(); }} title="Lock/Unlock">{activeObj?.lockMovementX ? <Unlock size={18} /> : <Lock size={18} />}</IconButton>
            </div>

            {/* Student Photo micro-toolbar */}
            {activeStudentPhoto && (
              <Stack direction="row" spacing={1} justifyContent="start" className="mt-3">
                <Button variant="contained" size="small" onClick={handleZoomIn}>Zoom In</Button>
                <Button variant="contained" size="small" onClick={handleZoomOut}>Zoom Out</Button>
                <Button variant="outlined" size="small" onClick={handleReset}>Reset</Button>
              </Stack>
            )}
          </div>
        )}
      </aside>

      {/* CANVAS CENTER (scroll area) */}
      <main className="absolute left-0 right-72 top-14 bottom-10 overflow-auto flex items-center justify-center p-4">
        <div className="relative shadow-lg border bg-white" style={{ width: "400px", height: "550px" }}>
          <CanvasArea ref={canvasRef} width={400} height={550} />
        </div>

        {/* Floating object toolbar near bottom center */}
        {activeObj && (
          <FloatingObjectToolbar
            activeObj={activeObj}
            cropImage={cropImage}
            handleDelete={() => { canvas?.remove(activeObj); setActiveObj(null); saveHistory(); }}
            toggleLock={(obj) => {
              if (!obj) return;
              const locked = !!obj.lockMovementX;
              obj.set({ lockMovementX: !locked, lockMovementY: !locked, hasControls: locked });
              canvas.renderAll();
            }}
            setShowSettings={() => {}}
            fitCanvasToObject={() => {}}
            isLocked={!!activeObj?.lockMovementX}
            multipleSelected={multipleSelected}
            groupObjects={() => {}}
            ungroupObjects={() => {}}
            canvas={canvas}
          />
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

      {/* BOTTOM TOOLBAR (fixed) */}
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
