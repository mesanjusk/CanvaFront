import React, { useEffect, useState } from "react";
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

const LOCAL_KEY = "localTemplates";

const CanvasEditor = ({ templateId: propTemplateId, onSaved, hideHeader = false }) => {
  const { templateId: routeId } = useParams();
  const templateId = propTemplateId || routeId;
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
   const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState(null);

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

  // 🔁 Fetch all students on mount
  useEffect(() => {
    axios
      .get("https://canvaback.onrender.com/api/students")
      .then((res) => setStudents(res.data.data))
      .catch((err) => console.error("Failed to fetch students", err));
  }, []);

  const handleStudentSelect = (uuid) => {
  const student = students.find((s) => s.uuid === uuid);
  setSelectedStudent(student);
};

 // 🔁 Fetch all institutes on mount
  useEffect(() => {
    axios
      .get("https://canvaback.onrender.com/api/institute/")
      .then((res) => setInstitutes(res.data))
      .catch((err) => console.error("Failed to fetch institutes", err));
  }, []);

  const handleInstituteSelect = (institute_uuid) => {
  const institute = institutes.find((i) => i.institute_uuid === institute_uuid);
  setSelectedInstitute(institute);
};

useEffect(() => {
  const renderTemplateAndStudent = async () => {
    if (!canvas) return;

    canvas.clear(); // Clear everything

    // Load and add template background
   // Load and add template background
if (templateId) {
  try {
    const res = await axios.get(`https://canvaback.onrender.com/api/template/${templateId}`);
    const { image, title } = res.data;

    if (image) {
      let targetWidth = 400;
let targetHeight = 550;

if (res.data.width && res.data.height) {
  targetWidth = res.data.width;
  targetHeight = res.data.height;
} else if (image) {
  const imgObj = await new Promise((resolve) => {
    fabric.Image.fromURL(image, resolve, { crossOrigin: "anonymous" });
  });
  targetWidth = imgObj.width || 400;
  targetHeight = imgObj.height || 550;
}

canvas.setWidth(targetWidth);
canvas.setHeight(targetHeight);


      await new Promise((resolve) => {
        fabric.Image.fromURL(
          image,
          (img) => {
            const scaleX = targetWidth / img.width;
            const scaleY = targetHeight / img.height;
            const scale = Math.min(scaleX, scaleY);

            img.scale(scale);
            img.set({
              left: (targetWidth - img.getScaledWidth()) / 2,
              top: (targetHeight - img.getScaledHeight()) / 2,
              selectable: true,        
              hasControls: true,        
            });

            canvas.add(img);
            img.sendToBack();
            resolve();
          },
          { crossOrigin: "anonymous" }
        );
      });

      if (title) {
       const titleText = new fabric.IText("{{title}}", {
  left: targetWidth / 2,
  top: 20,
  fontSize: 24,
  fill: "#333",
  originX: "center",
  selectable: true,
  hasControls: true,
});
canvas.add(titleText);

      }
    }
  } catch (err) {
    console.error("Error loading template:", err);
  }
}

// Add student name and photo
if (selectedStudent) {
  const nameText = new fabric.IText("{{firstName}} {{lastName}}", {
    left: 195,
    top: 400,
    fontSize: 22,
    fill: "#000",
    selectable: true,
    hasControls: true,
  });
  canvas.add(nameText);

  const photoPlaceholder = new fabric.IText("{{photo}}", {
    left: 50,
    top: 150,
    fontSize: 18,
    fill: "#555",
    selectable: true,
    hasControls: true,
  });
  canvas.add(photoPlaceholder);

  canvas.renderAll();
}


// Display text "Logo" (movable)
if (selectedInstitute?.logo) {
  const logoText = new fabric.IText("{{logo}}", {
    left: 20,
    top: 20,
    fontSize: 20,
    fill: "black",
    selectable: true,
    hasControls: true,
  });
  canvas.add(logoText);
  logoText.bringToFront();
}

// Display text "Signature" (movable)
if (selectedInstitute?.signature) {
  const signatureText = new fabric.IText("{{signature}}", {
    left: canvas.width - 150,
    top: canvas.height - 80,
    fontSize: 20,
    fill: "black",
    selectable: true,
    hasControls: true,
  });
  canvas.add(signatureText);
  signatureText.bringToFront();
}


  };

  renderTemplateAndStudent();
}, [templateId, selectedStudent, canvas, selectedInstitute]);

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


  return (
    <div className="h-screen flex flex-col">
      <Toaster position="top-right" />
      {!hideHeader && (
        <header className="h-12 bg-gray-800 text-white flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <a href="/" className="font-bold">Framee</a>
            <a href="/templates" className="hover:underline">Templates</a>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a
              href="https://resourcepage.my.canva.site/"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Resource Page
            </a>
          </nav>
        </header>
      )}
      <main className="flex flex-1 overflow-hidden bg-gray-100">
        <aside className="w-60 border-r bg-white p-4 space-y-6 overflow-y-auto">
          <div>
            <label className="block mb-1 font-semibold">Select Student:</label>
            <select onChange={(e) => handleStudentSelect(e.target.value)} className="w-full border rounded px-2 py-1">
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.uuid} value={student.uuid}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold">Select Institute:</label>
            <select onChange={(e) => handleInstituteSelect(e.target.value)} className="w-full border rounded px-2 py-1">
              <option value="">Select an institute</option>
              {(institutes || []).map((institute) => (
                <option key={institute.institute_uuid} value={institute.institute_uuid}>
                  {institute.institute_title}
                </option>
              ))}
            </select>
          </div>
        </aside>
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="flex justify-between items-center px-4 py-2 bg-white border-b shadow z-20">
        <div className="flex gap-2 items-center overflow-x-auto">
          <button title="Add Text" onClick={addText} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Type size={28} /></button>
          <button title="Add Rectangle" onClick={addRect} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Square size={28} /></button>
          <button title="Add Circle" onClick={addCircle} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Circle size={28} /></button>
          <input type="file" accept="image/*" id="upload-image" style={{ display: "none" }} onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                setCropSrc(reader.result);
                cropCallbackRef.current = (croppedUrl) => {
                  addImage(croppedUrl);
                };
              };
              reader.readAsDataURL(file);
            }
          }} />
          <label htmlFor="upload-image" className="p-2 rounded bg-white shadow hover:bg-blue-100 cursor-pointer" title="Upload Image">
            <ImageIcon size={28} />
          </label>
          <TemplatePanel loadTemplate={(templateJson) => {
            if (canvas) {
              canvas.loadFromJSON(templateJson, () => {
                canvas.renderAll();
                saveHistory();
              });
            }
          }} />
          <UndoRedoControls undo={undo} redo={redo} duplicateObject={duplicateObject} downloadPDF={downloadPDF} />
        </div>
        <div className="flex gap-2 items-center">
          <button title="Reset Canvas" onClick={() => {
            canvas?.clear();
            resetHistory();
            saveHistory();
          }} className="p-2 rounded-full bg-yellow-500 text-white shadow hover:bg-yellow-600"><RefreshCw size={22} /></button>
          <button title="Download PNG" onClick={downloadHighRes} className="p-2 rounded-full bg-green-600 text-white shadow hover:bg-green-700"><Download size={22} /></button>
          <button title="Save Template" onClick={saveTemplateLayout} className="p-2 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700">Save Template</button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="mx-auto w-max max-w-full">
          <CanvasArea ref={canvasRef} width={canvasWidth} height={canvasHeight} />
        </div>
      </div>

      {/* Object Toolbars */}
      {activeObj && (
        <FloatingObjectToolbar
          activeObj={activeObj}
          cropImage={cropImage}
          handleDelete={() => {
            canvas?.remove(activeObj);
            setActiveObj(null);
            saveHistory();
          }}
          toggleLock={(obj) => {
            const isLocked = lockedObjects.has(obj);
            obj.set({
              selectable: !isLocked,
              evented: !isLocked,
              hasControls: !isLocked,
              lockMovementX: isLocked ? false : true,
              lockMovementY: isLocked ? false : true,
              editable: obj.type === "i-text" ? !isLocked : undefined,
            });
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
              canvas.setActiveObject(new fabric.ActiveSelection(items, { canvas }));
              canvas.requestRenderAll();
              saveHistory();
            }
          }}
          canvas={canvas}
        />
      )}

      {/* Text & Shape Toolbars */}
      {activeObj?.type === "i-text" && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-5xl z-50">
          <TextEditToolbar
            obj={activeObj}
            canvas={canvas}
            fillColor={fillColor}
            setFillColor={setFillColor}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
        </div>
      )}

      {activeObj && ["rect", "circle", "image"].includes(activeObj.type) && (
        <ShapeEditToolbar
          obj={activeObj}
          canvas={canvas}
          fillColor={fillColor}
          setFillColor={setFillColor}
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
        />
      )}

      {/* Crop Image Modal */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onCancel={() => {
            setCropSrc(null);
            cropCallbackRef.current = null;
          }}
          onConfirm={(url) => {
            cropCallbackRef.current?.(url);
            setCropSrc(null);
            cropCallbackRef.current = null;
          }}
        />
      )}

      {/* Drawer Settings */}
      <Drawer isOpen={showSettings} onClose={() => setShowSettings(false)}>

        {selectedInstitute?.logo && (
  <div className="p-4">
    <h3 className="text-lg font-bold mb-2">Institute Logo</h3>
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
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">Selected Student Photo</h3>
      <img
        src={selectedStudent.photo[0]}
        
        className="w-32 h-32 object-cover rounded"
      />
    </div>
  )}

        <RightPanel
          fillColor={fillColor}
          setFillColor={setFillColor}
          fontSize={fontSize}
          setFontSize={setFontSize}
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          canvasWidth={canvasWidth}
          setCanvasWidth={setCanvasWidth}
          canvasHeight={canvasHeight}
          setCanvasHeight={setCanvasHeight}
          setBackgroundImage={(url) => {
            fabric.Image.fromURL(url, (img) => {
              canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                scaleX: canvas.width / img.width,
                scaleY: canvas.height / img.height,
              });
              saveHistory();
            });
          }}
        />
        <LayerPanel canvas={canvas} />
      </Drawer>

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
       
      </main>
    </div>
   
  );
};

export default CanvasEditor;
