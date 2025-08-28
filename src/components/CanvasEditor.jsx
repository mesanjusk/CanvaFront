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
  Sun,
  Moon,
  FileJson,
  X
} from "lucide-react";

import TextEditToolbar from "./TextEditToolbar";
import ShapeEditToolbar from "./ShapeEditToolbar";
import axios from "axios";
import { useParams } from "react-router-dom";

const LOCAL_KEY = "localTemplates";

const CanvasEditor = ({ templateId: propTemplateId, onSaved, hideHeader = false }) => {
  const { templateId: routeId } = useParams();
  const templateId = propTemplateId || routeId;
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [courses, setCourses] = useState([]);
const [batches, setBatches] = useState([]);
const [selectedCourse, setSelectedCourse] = useState(null);
const [selectedBatch, setSelectedBatch] = useState(null);
const [filteredStudents, setFilteredStudents] = useState([]);
const [admissions, setAdmissions] = useState([]);
const [templateImage, setTemplateImage] = useState(null);
  
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

  // fetch classes & batches on mount
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
      console.error("Failed to fetch courses/batches", err);
      toast.error("Error loading courses/batches");
    }
  };

  fetchCoursesAndBatches();
}, []);

  // 🔁 Fetch all students on mount
  useEffect(() => {
    axios
      .get("https://canvaback.onrender.com/api/students")
      .then((res) => setStudents(res.data.data))
      .catch((err) => console.error("Failed to fetch students", err));
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
      setAdmissions(admissionData);

      // ✅ Extract students directly from $lookup
      const studentList = admissionData
        .map(a => a.student)    
        .filter(Boolean);       

      setFilteredStudents(studentList);

    } catch (err) {
      console.error("Failed to fetch admissions", err);
      toast.error("Error loading admissions");
    }
  };

  fetchAdmissions();
}, [selectedCourse, selectedBatch]);

const handleStudentSelect = (uuid) => {
  const student = filteredStudents.find((s) => s.uuid === uuid);
  setSelectedStudent(student);
};


// 🔁 Fetch logged-in user's institute automatically 
useEffect(() => { 
  const fetchInstitute = async () => { 
  try { 
    const user = getStoredUser();
    const institute_uuid = user?.institute_uuid || getStoredInstituteUUID(); 
    if (institute_uuid) { 
      const res = await axios.get(
        `https://canvaback.onrender.com/api/institute/${institute_uuid}`
      );

      // 👇 unwrap the actual institute object
      const institute = res.data.result || res.data.data || res.data;

      setSelectedInstitute({
        ...institute,
        logo: institute.logo || null,
        signature: institute.signature || null
      });  
    } 
  } catch (err) { 
    console.error("Failed to fetch institute", err);
  } 
};

  fetchInstitute();
}, []);


// Fetch template only when templateId changes
useEffect(() => {
  if (!templateId) return;

  const fetchTemplate = async () => {
    try {
      const res = await axios.get(
        `https://canvaback.onrender.com/api/template/${templateId}`
      );

      if (res.data?.image) {
        const img = await new Promise((resolve) =>
          fabric.Image.fromURL(
            res.data.image,
            resolve,
            { crossOrigin: "anonymous" }
          )
        );

        img.set({
          selectable: false,
          evented: false,
          hasControls: false,
          left: 0,
          top: 0,
        });
        img.customId = "templateBg";
        setTemplateImage(img);
      }
    } catch (err) {
      console.error("Error loading template:", err);
    }
  };

  fetchTemplate();
}, [templateId]);


// --- Render function wrapped in useCallback ---
const renderTemplateAndStudent = useCallback(() => {
  if (!canvas || !selectedInstitute) return;

  canvas.clear(); // ✅ clear only once per render cycle

  // Add cached template background
  if (templateImage) {
    const bg = fabric.util.object.clone(templateImage);
    const scaleX = canvas.width / bg.width;
    const scaleY = canvas.height / bg.height;
    bg.scaleX = scaleX;
    bg.scaleY = scaleY;
    canvas.add(bg);
    bg.sendToBack();
  }

  // Add student placeholders
  if (selectedStudent) {
    const nameText = new fabric.IText("{{firstName}} {{lastName}}", {
      left: 195,
      top: 400,
      fontSize: 22,
      fill: "#000",
      selectable: true,
    });
    canvas.add(nameText);

    const photoPlaceholder = new fabric.IText("{{photo}}", {
      left: 50,
      top: 150,
      fontSize: 18,
      fill: "#555",
      selectable: true,
    });
    canvas.add(photoPlaceholder);
  }

  // Add institute logo
  if (selectedInstitute.logo) {
    fabric.Image.fromURL(
      selectedInstitute.logo,
      (img) => {
        img.scaleToWidth(80);
        img.set({ left: 20, top: 20, selectable: true });
        img.customId = "instituteLogo";
        canvas.add(img);
      },
      { crossOrigin: "anonymous" }
    );
  }

  // Add institute signature
  if (selectedInstitute.signature) {
    fabric.Image.fromURL(
      selectedInstitute.signature,
      (img) => {
        img.scaleToWidth(120);
        img.set({
          left: canvas.width - 150,
          top: canvas.height - 80,
          selectable: true,
        });
        img.customId = "instituteSignature";
        canvas.add(img);
      },
      { crossOrigin: "anonymous" }
    );
  }

  canvas.renderAll();
}, [canvas, templateImage, selectedStudent, selectedInstitute]);


// --- Debounced effect to run render ---
useEffect(() => {
  const t = setTimeout(() => {
    renderTemplateAndStudent();
  }, 200); // wait 200ms before applying changes

  return () => clearTimeout(t);
}, [renderTemplateAndStudent]);

const loadTemplate = (templateJson) => {
  if (canvas) {
    canvas.loadFromJSON(templateJson, () => {
      canvas.renderAll();
      saveHistory();
    });
  }
};

const saveTemplateLayout = async () => {
  if (!canvas) return;

  // Optionally prompt for a template name
  const title = prompt("Enter a name for this template:", `Template-${Date.now()}`);
  if (!title) return;

  // Export canvas JSON (including extra props)
  const templateJson = canvas.toJSON(['selectable', 'hasControls']);

  // Export as PNG (preview)
  const imageData = canvas.toDataURL({ format: "png", quality: 1 });

 const payload = {
  title,
  layout: JSON.stringify(templateJson),
  image: imageData,
  width: canvas.getWidth(),
  height: canvas.getHeight(),
  photo: selectedStudent?.photo?.[0] || null,
  signature: selectedInstitute?.signature || null,
  logo: selectedInstitute?.logo || null,
  template: templateId || null, // ✅ use templateId from URL
};

  try {
    await axios.post(`https://canvaback.onrender.com/api/templatelayout/save`, payload);
    toast.success('Template saved successfully');
    onSaved?.();
  } catch (error) {
    console.error("❌ Failed to save template", error);
    toast.error('Error saving template');
  }
};

const exportJSON = () => {
  if (!canvas) return;
  const json = canvas.toJSON(['selectable', 'hasControls']);
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'canvas.json';
  a.click();
  URL.revokeObjectURL(url);
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
                                  <FloatingObjectToolbar activeObj={activeObj} cropImage={cropImage} 
                                  handleDelete={() => { canvas?.remove(activeObj); setActiveObj(null); 
                                    saveHistory(); }} 
                                    toggleLock={(obj) => { 
                                      const isLocked = lockedObjects.has(obj); 
                                      obj.set({ selectable: !isLocked, 
                                        evented: !isLocked, 
                                        hasControls: !isLocked, 
                                        lockMovementX: isLocked ? false : true, 
                                        lockMovementY: isLocked ? false : true, 
                                        editable: obj.type === "i-text" ? !isLocked : undefined, }); 
                                        const updated = new Set(lockedObjects); 
                                        isLocked ? updated.delete(obj) : updated.add(obj); 
                                        setLockedObjects(updated); 
                                        canvas?.discardActiveObject(); 
                                        canvas?.requestRenderAll(); 
                                      }} 
                                        setShowSettings={setShowSettings} 
                                        fitCanvasToObject={() => { 
                                          const bounds = activeObj.getBoundingRect(); 
                                          canvas.setWidth(bounds.width + 100); 
                                          canvas.setHeight(bounds.height + 100); 
                                          canvas.centerObject(activeObj); 
                                          canvas.requestRenderAll(); 
                                        }} 
                                        isLocked={isLocked} 
                                        multipleSelected={multipleSelected} 
                                        groupObjects={() => { 
                                          const objs = canvas.getActiveObjects(); 
                                          if (objs.length > 1) { 
                                            const group = new fabric.Group(objs); 
                                            objs.forEach(o => canvas.remove(o));
                                             canvas.add(group); 
                                             canvas.setActiveObject(group); 
                                             canvas.requestRenderAll(); 
                                             saveHistory(); 
                                            } 
                                          }} 
                                          ungroupObjects={() => { 
                                            const active = canvas.getActiveObject(); 
                                            if (active && active.type === "group") { 
                                              const items = active._objects; 
                                              active._restoreObjectsState(); 
                                              canvas.remove(active); 
                                              items.forEach(obj => canvas.add(obj)); 
                                              canvas.setActiveObject(new fabric.ActiveSelection(items, 
                                                { canvas })); 
                                                canvas.requestRenderAll(); 
                                                saveHistory(); 
                                              } 
                                            }} 
                                              canvas={canvas} /> 
                                              )} 
                                              {/* Text & Shape Toolbars */} 
                                              {activeObj?.type === "i-text" && ( 
                                                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-5xl z-50"> 
                                                <TextEditToolbar obj={activeObj} canvas={canvas} fillColor={fillColor} 
                                                setFillColor={setFillColor} fontSize={fontSize} setFontSize={setFontSize} /> 
                                                </div> 
                                                )} 
                                                {activeObj && 
                                                ["rect", "circle", "image"].includes(activeObj.type) && ( 
                                                <ShapeEditToolbar obj={activeObj} canvas={canvas} fillColor={fillColor} setFillColor={setFillColor} 
                                                strokeColor={strokeColor} setStrokeColor={setStrokeColor} 
                                                strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth} /> 
                                              )} 
                                              {/* Crop Image Modal */} 
                                              {cropSrc && ( 
                                                <ImageCropModal src={cropSrc} onCancel={() => { setCropSrc(null); 
                                                  cropCallbackRef.current = null; }} 
                                                  onConfirm={(url) => { cropCallbackRef.current?.(url); setCropSrc(null); 
                                                    cropCallbackRef.current = null; }} /> 
                                                  )} 
                                                  {/* Drawer Settings */} 
                                                  <Drawer isOpen={showSettings} onClose={() => setShowSettings(false)}> 
                                                    {selectedInstitute?.logo && ( 
                                                      <div className="p-4"> <h3 className="text-lg font-bold mb-2">Institute Logo</h3> 
                                                      <img src={selectedInstitute.logo} className="w-32 h-32 object-contain" /> 
                                                      </div> 
                                                      )} 
                                                      {selectedInstitute?.signature && ( 
                                                        <div className="p-4"> 
                                                        <h3 className="text-lg font-bold mb-2">Signature</h3> 
                                                        <img src={selectedInstitute.signature} className="w-32 h-20 object-contain" /> 
                                                        </div> 
                                                        )} 
                                                        {selectedStudent && selectedStudent.photo && ( 
                                                          <div className="p-4"> <h3 className="text-lg font-bold mb-2">Selected Student Photo</h3>
                                                           <img src={selectedStudent.photo[0]} className="w-32 h-32 object-cover rounded" /> 
                                                           </div> 
                                                          )} 
                                                           <RightPanel fillColor={fillColor} setFillColor={setFillColor} fontSize={fontSize} 
                                                           setFontSize={setFontSize} strokeColor={strokeColor} setStrokeColor={setStrokeColor} 
                                                           strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth} canvasWidth={canvasWidth} 
                                                           setCanvasWidth={setCanvasWidth} canvasHeight={canvasHeight} 
                                                           setCanvasHeight={setCanvasHeight} setBackgroundImage={(url) => { 
                                                            fabric.Image.fromURL(url, (img) => { 
                                                              canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), 
                                                              { scaleX: canvas.width / img.width, scaleY: canvas.height / img.height, 

                                                              }); 
                                                              saveHistory(); 
                                                            }); }} /> 
                                                            <LayerPanel canvas={canvas} /> 
                                                            </Drawer> 
                                                            <BottomToolbar alignLeft={alignLeft} alignCenter={alignCenter} 
                                                            alignRight={alignRight} alignTop={alignTop} 
                                                            alignMiddle={alignMiddle} alignBottom={alignBottom} bringToFront={bringToFront} 
                                                            sendToBack={sendToBack} /> 
                                                            </div> 
                                                            </main> 
                                                            </div>
   
  );
};

export default CanvasEditor; 
