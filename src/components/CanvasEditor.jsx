import React, { useEffect, useState } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { useCanvasEditor } from "../hooks/useCanvasEditor";
import { useCanvasTools } from "../hooks/useCanvasTools";
import CanvasArea from "./CanvasArea";
import ImageCropModal from "./ImageCropModal";
import TemplatePanel from "./TemplatePanel";
import BottomToolbar from "./BottomToolbar";
import FloatingObjectToolbar from "./FloatingObjectToolbar";
import EditorSidebar from "./EditorSidebar";
import EditorToolbar from "./EditorToolbar";
import EditorDrawer from "./EditorDrawer";

import { Sun, Moon, X } from "lucide-react";

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
  const [darkMode, setDarkMode] = useState(false);
  const [showLauncher, setShowLauncher] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

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
    if (templateId) {
      try {
        const res = await axios.get(
          `https://canvaback.onrender.com/api/template/${templateId}`
        );
        const { image, title } = res.data;

        if (image) {
          let targetWidth = 400;
          let targetHeight = 550;

          if (res.data.width && res.data.height) {
            targetWidth = res.data.width;
            targetHeight = res.data.height;
          } else {
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

  const rightPanelProps = {
    fillColor,
    setFillColor,
    fontSize,
    setFontSize,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
    canvasWidth,
    setCanvasWidth,
    canvasHeight,
    setCanvasHeight,
    setBackgroundImage: (url) => {
      fabric.Image.fromURL(url, (img) => {
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
          scaleX: canvas.width / img.width,
          scaleY: canvas.height / img.height,
        });
        saveHistory();
      });
    },
  };


  return (
    <div className="h-full flex flex-col">
      <Toaster position="top-right" />
      {!hideHeader && (
        <header className="h-12 bg-gray-800 dark:bg-gray-900 text-white flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <a href="/" className="font-bold">Framee</a>
            <a href="/templates" className="underline">Templates</a>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1 rounded hover:bg-gray-700"
            title="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>
      )}
      <main className="flex flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800">
        <EditorSidebar
          students={students}
          institutes={institutes}
          onStudentSelect={handleStudentSelect}
          onInstituteSelect={handleInstituteSelect}
        />
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <EditorToolbar
            addText={addText}
            addRect={addRect}
            addCircle={addCircle}
            addImage={addImage}
            setCropSrc={setCropSrc}
            cropCallbackRef={cropCallbackRef}
            undo={undo}
            redo={redo}
            duplicateObject={duplicateObject}
            downloadPDF={downloadPDF}
            downloadHighRes={downloadHighRes}
            exportJSON={exportJSON}
            saveTemplateLayout={saveTemplateLayout}
            canvas={canvas}
            resetHistory={resetHistory}
            saveHistory={saveHistory}
          />

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
      <EditorDrawer
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        selectedInstitute={selectedInstitute}
        selectedStudent={selectedStudent}
        rightPanelProps={rightPanelProps}
        canvas={canvas}
      />

      {showLauncher && (
        <div className="fixed right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded shadow-lg z-40">
          <button
            className="absolute top-1 right-1 text-gray-500 hover:text-gray-800"
            onClick={() => setShowLauncher(false)}
          >
            <X size={16} />
          </button>
          <TemplatePanel loadTemplate={loadTemplate} />
        </div>
      )}

      <button
        onClick={() => setShowLauncher(!showLauncher)}
        className="fixed right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-full shadow z-30"
        title="Templates"
      >
        T
      </button>

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
      <footer className="h-10 flex items-center justify-center text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
        © 2025 Framee
      </footer>
    </div>
   
  );
};

export default CanvasEditor;
