import React, { useEffect, useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
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
import { getStoredUser, getStoredInstituteUUID } from "../utils/storageUtils";
import { fabric } from "fabric";

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

  const [selectedInstitute, setSelectedInstitute] = useState(null);

  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);

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

  // simple flags to avoid duplicate logos/signatures
  const logoAddedRef = useRef(false);
  const signAddedRef = useRef(false);

  /* ---------------------------- fetch courses/batches ---------------------------- */
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

  /* --------------------------------- students ---------------------------------- */
  useEffect(() => {
    axios
      .get("https://canvaback.onrender.com/api/students")
      .then((res) => setStudents(res.data.data || []))
      .catch((err) => console.error("Failed to fetch students", err));
  }, []);

  const handleStudentSelect = (uuid) => {
    const student = students.find((s) => s.uuid === uuid);
    setSelectedStudent(student || null);
  };

  /* ---------------------------- fetch institute auto --------------------------- */
  useEffect(() => {
    const fetchInstitute = async () => {
      try {
        const user = getStoredUser();
        const institute_uuid = user?.institute_uuid || getStoredInstituteUUID();
        if (!institute_uuid) return;

        const res = await axios.get(
          `https://canvaback.onrender.com/api/institute/${institute_uuid}`
        );
        const institute = res.data.result || res.data.data || res.data;

        setSelectedInstitute({
          ...institute,
          logo: institute.logo || null,
          signature: institute.signature || null,
        });
      } catch (err) {
        console.error("Failed to fetch institute", err);
      }
    };
    fetchInstitute();
  }, []);

  /* -------------------- helper: replace placeholders in canvas ------------------- */
  const replacePlaceholders = async () => {
    if (!canvas) return;

    const S = selectedStudent || {};
    const I = selectedInstitute || {};

    // Gather placeholder values
    const placeholders = {
      "{{title}}": "", // let template control title text if needed
      "{{firstName}}": S.firstName || "",
      "{{lastName}}": S.lastName || "",
      "{{name}}": [S.firstName, S.lastName].filter(Boolean).join(" "),
      "{{course}}": (courses.find(c => c._id === selectedCourse)?.name) || "",
      "{{batch}}": (batches.find(b => b._id === selectedBatch)?.name) || "",
      "{{institute}}": I?.name || I?.title || "",
    };

    // 1) Replace text placeholders in all IText objects
    canvas.getObjects("i-text").forEach((obj) => {
      let t = obj.text || "";
      Object.entries(placeholders).forEach(([key, val]) => {
        if (t.includes(key)) t = t.replaceAll(key, val);
      });
      obj.set({ text: t });
    });

    // 2) Replace {{photo}} if present by dropping an image at that location
    const textObjs = canvas.getObjects("i-text");
    for (const obj of textObjs) {
      if ((obj.text || "").includes("{{photo}}")) {
        const left = obj.left ?? 50;
        const top = obj.top ?? 150;

        // remove the placeholder text
        canvas.remove(obj);

        const photoUrl = S?.photo?.[0];
        if (photoUrl) {
          try {
            await new Promise((resolve) => {
              fabric.Image.fromURL(
                photoUrl,
                (img) => {
                  img.set({ left, top, selectable: true, hasControls: true });
                  // scale to a reasonable width if very large
                  if (img.width > 160) {
                    img.scaleToWidth(160);
                  }
                  canvas.add(img);
                  resolve();
                },
                { crossOrigin: "anonymous" }
              );
            });
          } catch (e) {
            console.warn("Failed to load student photo", e);
          }
        }
      }
    }

    canvas.requestRenderAll();
    saveHistory();
  };

  /* ----------------- load template bg + base fields (student etc.) --------------- */
  useEffect(() => {
    const renderTemplateAndStudent = async () => {
      if (!canvas) return;

      canvas.clear();
      logoAddedRef.current = false;
      signAddedRef.current = false;

      // Load template background if provided
      if (templateId) {
        try {
          const res = await axios.get(
            `https://canvaback.onrender.com/api/template/${templateId}`
          );
          const { image, title } = res.data || {};

          let targetWidth = 400;
          let targetHeight = 550;

          if (res.data?.width && res.data?.height) {
            targetWidth = res.data.width;
            targetHeight = res.data.height;
          } else if (image) {
            // probe the image dimensions
            const imgObj = await new Promise((resolve) => {
              fabric.Image.fromURL(image, resolve, { crossOrigin: "anonymous" });
            });
            targetWidth = imgObj?.width || 400;
            targetHeight = imgObj?.height || 550;
          }

          canvas.setWidth(targetWidth);
          canvas.setHeight(targetHeight);

          if (image) {
            await new Promise((resolve) => {
              fabric.Image.fromURL(
                image,
                (img) => {
                  // fill canvas while preserving aspect ratio
                  const scaleX = targetWidth / img.width;
                  const scaleY = targetHeight / img.height;
                  const scale = Math.max(scaleX, scaleY);
                  img.scale(scale);
                  img.set({
                    left: (targetWidth - img.getScaledWidth()) / 2,
                    top: (targetHeight - img.getScaledHeight()) / 2,
                    selectable: false,
                    evented: false,
                    hasControls: false,
                  });
                  img.lockMovementX = img.lockMovementY = true;
                  canvas.add(img);
                  img.sendToBack();
                  resolve();
                },
                { crossOrigin: "anonymous" }
              );
            });
          }

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
        } catch (err) {
          console.error("Error loading template:", err);
        }
      }

      // Add basic placeholders if a student is preselected
      if (selectedStudent) {
        const nameText = new fabric.IText("{{firstName}} {{lastName}}", {
          left: 195,
          top: canvas.height - 150,
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
      }

      await replacePlaceholders();
    };

    renderTemplateAndStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, selectedStudent, canvas, selectedCourse, selectedBatch]);

  /* -------------------- add institute logo/signature (once) --------------------- */
  useEffect(() => {
    if (!canvas || !selectedInstitute) return;

    const addLogo = async () => {
      if (logoAddedRef.current) return;
      const url = selectedInstitute?.logo;
      if (!url) return;
      await new Promise((resolve) => {
        fabric.Image.fromURL(
          url,
          (img) => {
            img.scaleToWidth(80);
            img.set({ left: 20, top: 20, selectable: true });
            canvas.add(img);
            canvas.requestRenderAll();
            logoAddedRef.current = true;
            resolve();
          },
          { crossOrigin: "anonymous" }
        );
      });
    };

    const addSignature = async () => {
      if (signAddedRef.current) return;
      const url = selectedInstitute?.signature;
      if (!url) return;
      await new Promise((resolve) => {
        fabric.Image.fromURL(
          url,
          (img) => {
            img.scaleToWidth(120);
            img.set({
              left: Math.max(0, canvas.width - 150),
              top: Math.max(0, canvas.height - 80),
              selectable: true,
            });
            canvas.add(img);
            canvas.requestRenderAll();
            signAddedRef.current = true;
            resolve();
          },
          { crossOrigin: "anonymous" }
        );
      });
    };

    addLogo();
    addSignature();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, selectedInstitute]);

  /* ------------------------------- load JSON tpl ------------------------------- */
  const loadTemplate = (templateJson) => {
    if (canvas) {
      canvas.loadFromJSON(templateJson, async () => {
        canvas.renderAll();
        await replacePlaceholders();
        saveHistory();
      });
    }
  };

  /* --------------------------------- save tpl --------------------------------- */
  const saveTemplateLayout = async () => {
    if (!canvas) return;
    const title = prompt("Enter a name for this template:", `Template-${Date.now()}`);
    if (!title) return;

    const templateJson = canvas.toJSON(["selectable", "hasControls"]);
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
      template: templateId || null,
    };

    try {
      await axios.post(`https://canvaback.onrender.com/api/templatelayout/save`, payload);
      toast.success("Template saved successfully");
      onSaved?.();
    } catch (error) {
      console.error("❌ Failed to save template", error);
      toast.error("Error saving template");
    }
  };

  const exportJSON = () => {
    if (!canvas) return;
    const json = canvas.toJSON(["selectable", "hasControls"]);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "canvas.json";
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
            <label className="block mb-2 font-semibold">Select Student:</label>
            <select onChange={(e) => handleStudentSelect(e.target.value)} className="border px-3 py-2 rounded">
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.uuid} value={student.uuid}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4">
            <label className="block mb-2 font-semibold">Select Course:</label>
            <select
              onChange={(e) => setSelectedCourse(e.target.value)}
              value={selectedCourse || ""}
              className="border px-3 py-2 rounded"
            >
              <option value="">Select a course</option>
              {courses.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4">
            <label className="block mb-2 font-semibold">Select Batch:</label>
            <select
              onChange={(e) => setSelectedBatch(e.target.value)}
              value={selectedBatch || ""}
              className="border px-3 py-2 rounded"
            >
              <option value="">Select a batch</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name}
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
                className="p-2 rounded bg-white shadow hover:bg-blue-100">
                <Circle size={28} />
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
                      cropCallbackRef.current = (croppedUrl) => {
                        addImage(croppedUrl);
                      };
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
                <ImageIcon size={28} />
              </label>

              <TemplatePanel
                loadTemplate={(templateJson) => {
                  if (canvas) {
                    canvas.loadFromJSON(templateJson, async () => {
                      canvas.renderAll();
                      await replacePlaceholders();
                      saveHistory();
                    });
                  }
                }}
              />

              <UndoRedoControls
                undo={undo}
                redo={redo}
                duplicateObject={duplicateObject}
                downloadPDF={downloadPDF}
              />
            </div>

            <div className="flex gap-2 items-center">
              <button
                title="Reset Canvas"
                onClick={() => {
                  canvas?.clear();
                  resetHistory();
                  saveHistory();
                  logoAddedRef.current = false;
                  signAddedRef.current = false;
                }}
                className="p-2 rounded-full bg-yellow-500 text-white shadow hover:bg-yellow-600"
              >
                <RefreshCw size={22} />
              </button>

              <button
                title="Download PNG"
                onClick={downloadHighRes}
                className="p-2 rounded-full bg-green-600 text-white shadow hover:bg-green-700"
              >
                <Download size={22} />
              </button>

              <button
                title="Save Template"
                onClick={saveTemplateLayout}
                className="p-2 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700"
              >
                Save Template
              </button>
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
                const locked = lockedObjects.has(obj);
                obj.set({
                  selectable: !locked,
                  evented: !locked,
                  hasControls: !locked,
                  lockMovementX: locked ? false : true,
                  lockMovementY: locked ? false : true,
                  editable: obj.type === "i-text" ? !locked : undefined,
                });
                const updated = new Set(lockedObjects);
                locked ? updated.delete(obj) : updated.add(obj);
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
                  objs.forEach((o) => canvas.remove(o));
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
                  items.forEach((obj) => canvas.add(obj));
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
            {selectedStudent?.photo?.[0] && (
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2">Selected Student Photo</h3>
                <img src={selectedStudent.photo[0]} className="w-32 h-32 object-cover rounded" />
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
                fabric.Image.fromURL(
                  url,
                  (img) => {
                    canvas.setBackgroundImage(
                      img,
                      canvas.renderAll.bind(canvas),
                      {
                        scaleX: canvas.width / img.width,
                        scaleY: canvas.height / img.height,
                      }
                    );
                    saveHistory();
                  },
                  { crossOrigin: "anonymous" }
                );
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
