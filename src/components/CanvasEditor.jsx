import React, { useEffect, useState, useCallback } from "react"; 
import toast, { Toaster } from 'react-hot-toast'; 
import { useCanvasEditor } from "../hooks/useCanvasEditor"; 
import { useCanvasTools } from "../hooks/useCanvasTools"; 
import CanvasArea from "./CanvasArea"; 
import RightPanel from "./RightPanel"; 
import ImageCropModal from "./ImageCropModal"; 
import Drawer from "./Drawer"; 
import TemplatePanel from "./TemplatePanel"; 
import UndoRedoControls from "./UndoRedoControls"; 
import LayerPanel from "./LayerPanel"; 
import BottomToolbar from "./BottomToolbar"; 
import FloatingObjectToolbar from "./FloatingObjectToolbar"; 
import { getStoredUser, getStoredInstituteUUID} from '../utils/storageUtils';

import {
  RefreshCw,
  Download,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
} from "lucide-react";

import TextEditToolbar from "./TextEditToolbar";
import ShapeEditToolbar from "./ShapeEditToolbar";
import axios from "axios";
import { useParams } from "react-router-dom";

const PHOTO_MASK_WIDTH = 400;
const PHOTO_MASK_HEIGHT = 400;
let activeStudentPhoto = null; 

const CanvasEditor = ({ templateId: propTemplateId, onSaved, hideHeader = false }) => {
  const { templateId: routeId } = useParams();
  const templateId = propTemplateId || routeId;
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [courses, setCourses] = useState([]);
  const [savedPlaceholders, setSavedPlaceholders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [templateImage, setTemplateImage] = useState(null);
  const [activeStudentPhoto, setActiveStudentPhoto] = useState(null);
  const studentObjectsRef = React.useRef([]);
  const bgRef = React.useRef(null);
  const logoRef = React.useRef(null);
  const signatureRef = React.useRef(null);
  
  const {
    canvasRef,
    fillColor, setFillColor,
    fontSize, setFontSize,
    strokeColor, setStrokeColor,
    strokeWidth, setStrokeWidth,
    canvasWidth, setCanvasWidth,
    canvasHeight, setCanvasHeight,
    cropSrc, setCropSrc,
    cropCallbackRef,
    addText,
    addRect,
    addCircle,
    addImage,
    cropImage,
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
    bringToFront,
    sendToBack,
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

  // --- helper: create clip shape ---
  const createClipShape = (shapeType, width, height) => {
    if (shapeType === "circle") {
      return new fabric.Circle({
        radius: Math.min(width, height) / 2,
        originX: "center",
        originY: "center",
      });
    } else {
      return new fabric.Rect({
        width,
        height,
        originX: "center",
        originY: "center",
      });
    }
  };

  // --- student photo toolbar controls ---
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

  // fetch students
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
        const studentList = admissionData.map(a => a.student).filter(Boolean);
        setAdmissions(admissionData);
        setFilteredStudents(studentList);
      } catch {
        toast.error("Error loading admissions");
      }
    };
    fetchAdmissions();
  }, [selectedCourse, selectedBatch]);

  const handleStudentSelect = (uuid) => {
    const student = filteredStudents.find((s) => s.uuid === uuid);
    setSelectedStudent(student);
  };

  // fetch institute
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
            signature: institute.signature || null
          });  
        } 
      } catch {} 
    };
    fetchInstitute();
  }, []);

  // fetch template
  useEffect(() => {
    if (!templateId) return;
    const fetchTemplate = async () => {
      try {
        const res = await axios.get(
          `https://canvaback.onrender.com/api/template/${templateId}`
        );
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

  // --- render template ---
  const renderTemplateAndStudent = useCallback(() => {
    if (!canvas || !selectedInstitute) return;
    if (bgRef.current) canvas.remove(bgRef.current);
    if (logoRef.current) canvas.remove(logoRef.current);
    if (signatureRef.current) canvas.remove(signatureRef.current);
    studentObjectsRef.current.forEach((obj) => canvas.remove(obj));
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

    if (selectedStudent) {
      const savedName = getSavedProps("studentName");
      const nameText = new fabric.IText(
        `${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`,
        { left: savedName?.left ?? 130, top: savedName?.top ?? 300, fontSize: savedName?.fontSize ?? 22, fill: "#000" }
      );
      nameText.customId = "studentName";
      nameText.field = "studentName";
      canvas.add(nameText);
      studentObjectsRef.current.push(nameText);
    }

    // --- student photo ---
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
 // --- 6. Institute Logo (respects saved pos) ---
  const savedLogo = getSavedProps("logo");
  if (selectedInstitute.logo) {
    safeLoadImage(selectedInstitute.logo, (img) => {
      // NOTE: use saved scale if present, else simple scaleToWidth(80)
      if (savedLogo?.scaleX && savedLogo?.scaleY) {
        img.set({
          left: savedLogo.left ?? 20,
          top: savedLogo.top ?? 20,
          scaleX: savedLogo.scaleX,
          scaleY: savedLogo.scaleY,
          angle: savedLogo?.angle ?? 0,
        });
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

  // --- 7. Institute Signature (respects saved pos) ---
  const savedSign = getSavedProps("signature");
  if (selectedInstitute.signature) {
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
        img.scaleToWidth(120);
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
    return () => { cancelled = true; };
  }, [canvas, selectedInstitute, templateImage, selectedStudent, getSavedProps]);

  useEffect(() => {
    const t = setTimeout(() => { renderTemplateAndStudent(); }, 200);
    return () => clearTimeout(t);
  }, [renderTemplateAndStudent]);

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
      await axios.put(
        `https://canvaback.onrender.com/api/template/update-canvas/${templateId}`,
        { placeholders }
      );
      setSavedPlaceholders(placeholders);
      toast.success("Template layout saved!");
    } catch {
      toast.error("Save failed!");
    }
  };


  return (
    <div className="h-full flex flex-col"> 
    <Toaster position="top-right" /> 
    {!hideHeader && ( 
      <header className="h-12 bg-gray-800 text-white flex items-center px-4 gap-4"> 
      <a href="/" className="font-bold">Framee</a> 
      <a href="/templates" className="underline">Templates</a> 
      </header> 
    )} 
    <main className="flex-1 bg-gray-100"> 
      <div className="min-h-full w-full bg-gray-100 flex flex-col"> 
    
<div className="p-4">
  <label className="block mb-2 font-semibold">Select Course:</label>
  <select onChange={(e) => setSelectedCourse(e.target.value)}>
    <option value="">Select a course</option>
    {courses.map((cls) => (
      <option key={cls._id} value={cls.Course_uuid}>
        {cls.name}
      </option>
    ))}
  </select>
</div>

<div className="p-4">
  <label className="block mb-2 font-semibold">Select Batch:</label>
  <select onChange={(e) => setSelectedBatch(e.target.value)}>
    <option value="">Select a batch</option>
    {batches.map((batch) => (
      <option key={batch._id} value={batch.name}>
        {batch.name}
      </option>
    ))}
  </select>
</div>

    <div className="p-4"> 
          <label className="block mb-2 font-semibold">Select Student:</label> 
         <select onChange={(e) => handleStudentSelect(e.target.value)}> 
  <option value="">Select a student</option> 
  {filteredStudents.map((student) => ( 
    <option key={student.uuid} value={student.uuid}> 
      {student.firstName} {student.lastName} 
    </option> 
  ))} 
</select>
            </div>


            {/* Toolbar */} 
            <div className="w-full flex justify-between items-center px-4 py-2 bg-white border-b shadow z-20"> 
              <div className="flex gap-2 items-center overflow-x-auto"> 
                <button title="Add Text" onClick={addText} 
                className="p-2 rounded bg-white shadow hover:bg-blue-100">
                  <Type size={28} />
                  </button> 
                  <button title="Add Rectangle" onClick={addRect} 
                  className="p-2 rounded bg-white shadow hover:bg-blue-100">
                    <Square size={28} />
                    </button> 
                    <button title="Add Circle" onClick={addCircle} 
                    className="p-2 rounded bg-white shadow hover:bg-blue-100"><Circle size={28} />
                    </button> 
                    <input type="file" accept="image/*" id="upload-image" 
                    style={{ display: "none" }} onChange={(e) => { 
                      const file = e.target.files[0]; 
                      if (file) { const reader = new FileReader(); 
                        reader.onload = () => { 
                          setCropSrc(reader.result); 
                          cropCallbackRef.current = (croppedUrl) => { 
                            addImage(croppedUrl); 
                          }; 
                        }; 
                        reader.readAsDataURL(file); 
                      } 
                    }} /> 
                    <label htmlFor="upload-image" 
                    className="p-2 rounded bg-white shadow hover:bg-blue-100 cursor-pointer" 
                    title="Upload Image"> <ImageIcon size={28} /> </label> 
                    <TemplatePanel loadTemplate={(templateJson) => { 
                      if (canvas) { 
                        canvas.loadFromJSON(templateJson, () => { 
                          canvas.renderAll(); 
                          replacePlaceholders(); 
                          saveHistory(); 
                        }); 
                      } 
                    }} /> 
                    <UndoRedoControls undo={undo} redo={redo} duplicateObject={duplicateObject} 
                    downloadPDF={downloadPDF} /> 
                    </div> 
                    <div className="flex gap-2 items-center"> 
                      <button title="Reset Canvas" onClick={() => { 
                        canvas?.clear(); 
                        resetHistory(); 
                        saveHistory(); 
                      }} className="p-2 rounded-full bg-yellow-500 text-white shadow hover:bg-yellow-600">
                        <RefreshCw size={22} />
                        </button> 
                        <button title="Download PNG" onClick={downloadHighRes} 
                        className="p-2 rounded-full bg-green-600 text-white shadow hover:bg-green-700">
                          <Download size={22} />
                          </button> 
                          <button title="Save Template" onClick={saveTemplateLayout} 
                          className="p-2 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700">
                            Save Template</button> 
                            </div> 
                            </div> 
                            {/* Canvas Area */} 
                         <div className="flex-1 bg-gray-50 flex items-center justify-center p-2">
  <div className="relative shadow-lg border bg-white"
       style={{ width: "400px", height: "550px" }}> 
    <CanvasArea
      ref={canvasRef}
      width={400}
      height={550}
      className="block"
    />
  </div>
</div>

 
                                {/* Object Toolbars */} 
                               {activeObj && (
          <FloatingObjectToolbar
            activeObj={activeObj}
            cropImage={cropImage}
            handleDelete={() => { canvas?.remove(activeObj); setActiveObj(null); saveHistory(); }}
            toggleLock={(obj) => {}}
            setShowSettings={setShowSettings}
            isLocked={isLocked}
            multipleSelected={multipleSelected}
            groupObjects={() => {}}
            ungroupObjects={() => {}}
            canvas={canvas}
          >
            {/* extra buttons for student photo */}
             {/* Student Photo Toolbar */}
        {activeStudentPhoto && (
          <div className="flex gap-2 justify-center mt-3">
            <button
              onClick={handleZoomIn}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Zoom In
            </button>
            <button
              onClick={handleZoomOut}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Zoom Out
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-gray-500 text-white rounded"
            >
              Reset
            </button>
          </div>
        )}
          </FloatingObjectToolbar>
        )} 
                                                            </div> 
                                                            </main> 
                                                            </div>
   
  );
};

export default CanvasEditor; 
