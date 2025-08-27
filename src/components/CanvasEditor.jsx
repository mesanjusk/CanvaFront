import React, { useEffect, useMemo, useRef, useState } from "react";
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
import TextEditToolbar from "./TextEditToolbar";
import ShapeEditToolbar from "./ShapeEditToolbar";
import axios from "axios";
import { useParams } from "react-router-dom";
import { getStoredUser, getStoredInstituteUUID } from "../utils/storageUtils";

import {
  RefreshCw,
  Download,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  LayoutGrid,
  MoveHorizontal,
  Maximize2,
  Minimize2,
  PanelsTopLeft,
  FileJson,
  Save,
  Settings2,
} from "lucide-react";

/* global fabric */

const LOCAL_KEY = "localTemplates";

/** ---------------------------------------------------------
 *  Canva-like Responsive CanvasEditor
 *  - Left vertical toolbar (tools)
 *  - Top app bar (brand, selects, actions)
 *  - Center canvas stage with scroll
 *  - Right properties drawer/panel (toggle)
 *  - Bottom alignment toolbar (sticky)
 * --------------------------------------------------------- */

const CanvasEditor = ({ templateId: propTemplateId, onSaved, hideHeader = false }) => {
  const { templateId: routeId } = useParams();
  const templateId = propTemplateId || routeId;

  // Data sets
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");

  const [selectedInstitute, setSelectedInstitute] = useState(null);

  // UI state
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightOpen, setRightOpen] = useState(true); // right panel / drawer visibility
  const [zoom, setZoom] = useState(1);
  const [showMobilePanels, setShowMobilePanels] = useState(false);

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

  // ---------- Helpers ----------
  const canvasStageRef = useRef(null);
  const isMobile = useMemo(() => typeof window !== "undefined" && window.innerWidth < 1024, []);

  const applyZoom = (factor) => {
    if (!canvas) return;
    const next = Math.max(0.1, Math.min(4, factor));
    setZoom(next);
    canvas.setZoom(next);
    canvas.requestRenderAll();
  };

  const zoomIn = () => applyZoom(zoom + 0.1);
  const zoomOut = () => applyZoom(zoom - 0.1);
  const zoomFit = () => {
    if (!canvas || !canvasStageRef.current) return;
    const stage = canvasStageRef.current.getBoundingClientRect();
    const padding = 48;
    const scaleX = (stage.width - padding) / canvas.getWidth();
    const scaleY = (stage.height - padding) / canvas.getHeight();
    applyZoom(Math.max(0.1, Math.min(scaleX, scaleY)));
  };
  const zoomActual = () => applyZoom(1);

  const handleStudentSelect = (uuid) => {
    const student = students.find((s) => s.uuid === uuid);
    setSelectedStudent(student || null);
  };

  const replacePlaceholders = async () => {
    if (!canvas) return;

    const textObjs = canvas.getObjects().filter((o) => o.type === "i-text");
    const tokens = {
      "{{firstName}}": selectedStudent?.firstName || "",
      "{{lastName}}": selectedStudent?.lastName || "",
      "{{title}}": "",
      "{{course}}": (courses.find((c) => c._id === selectedCourse)?.name) || "",
      "{{batch}}": (batches.find((b) => b._id === selectedBatch)?.name) || "",
      "{{institute}}": selectedInstitute?.name || "",
    };

    // Replace text placeholders
    textObjs.forEach((t) => {
      let s = t.text || "";
      Object.entries(tokens).forEach(([k, v]) => {
        if (s.includes(k)) s = s.replaceAll(k, v);
      });
      t.set({ text: s });
    });

    // Replace image {{photo}}
    const photoText = textObjs.find((t) => (t.text || "").includes("{{photo}}"));
    if (photoText && selectedStudent?.photo?.[0]) {
      const { left = 50, top = 150 } = photoText;
      canvas.remove(photoText);

      await new Promise((resolve) => {
        fabric.Image.fromURL(
          selectedStudent.photo[0],
          (img) => {
            img.set({
              left,
              top,
              selectable: true,
              hasControls: true,
              objectCaching: true,
            });
            img.scaleToWidth(120);
            canvas.add(img);
            resolve();
          },
          { crossOrigin: "anonymous" }
        );
      });
    }

    canvas.requestRenderAll();
    saveHistory();
  };

  // ---------- Load Courses & Batches ----------
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

  // ---------- Load Students ----------
  useEffect(() => {
    axios
      .get("https://canvaback.onrender.com/api/students")
      .then((res) => setStudents(res.data.data || []))
      .catch((err) => console.error("Failed to fetch students", err));
  }, []);

  // ---------- Load Institute (current user) ----------
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

  // ---------- Render Template + Student ----------
  useEffect(() => {
    const renderTemplateAndStudent = async () => {
      if (!canvas) return;

      canvas.clear();

      // Template background
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
                  const scaleX = targetWidth / img.width;
                  const scaleY = targetHeight / img.height;
                  const scale = Math.min(scaleX, scaleY);
                  img.scale(scale);
                  img.set({
                    left: (targetWidth - img.getScaledWidth()) / 2,
                    top: (targetHeight - img.getScaledHeight()) / 2,
                    selectable: false,
                    hasControls: false,
                    evented: false,
                  });
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

      // Student tokens (will be replaced after)
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
      }

      canvas.requestRenderAll();
      saveHistory();
      await replacePlaceholders();
    };

    renderTemplateAndStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, selectedStudent, selectedCourse, selectedBatch, canvas]);

  // ---------- Place Institute logo/signature ----------
  useEffect(() => {
    if (!canvas || !selectedInstitute) return;

    const addImages = async () => {
      if (selectedInstitute.logo) {
        await new Promise((resolve) => {
          fabric.Image.fromURL(
            selectedInstitute.logo,
            (img) => {
              img.scaleToWidth(80);
              img.set({ left: 20, top: 20, selectable: true });
              canvas.add(img);
              resolve();
            },
            { crossOrigin: "anonymous" }
          );
        });
      }

      if (selectedInstitute.signature) {
        await new Promise((resolve) => {
          fabric.Image.fromURL(
            selectedInstitute.signature,
            (img) => {
              img.scaleToWidth(120);
              img.set({
                left: canvas.width - 150,
                top: canvas.height - 80,
                selectable: true,
              });
              canvas.add(img);
              resolve();
            },
            { crossOrigin: "anonymous" }
          );
        });
      }
      canvas.requestRenderAll();
      saveHistory();
    };

    addImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, selectedInstitute]);

  // ---------- Load a saved template layout JSON ----------
  const loadTemplate = (templateJson) => {
    if (!canvas) return;
    canvas.loadFromJSON(templateJson, () => {
      canvas.renderAll();
      replacePlaceholders();
      saveHistory();
    });
  };

  // ---------- Save template layout ----------
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

  // ---------- JSX ----------
  return (
    <div className="h-full flex flex-col bg-neutral-100">
      <Toaster position="top-right" />

      {/* Top App Bar */}
      {!hideHeader && (
        <header className="h-14 bg-white border-b flex items-center px-3 gap-3 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <PanelsTopLeft className="w-5 h-5" />
            <span className="font-semibold">Framee Designer</span>
          </div>

          {/* Selects (Student / Course / Batch) */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <select
              className="min-w-[180px] max-w-xs px-2 py-1 border rounded bg-white"
              onChange={(e) => handleStudentSelect(e.target.value)}
              value={selectedStudent?.uuid || ""}
              title="Select Student"
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.uuid} value={s.uuid}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>

            <select
              className="min-w-[160px] max-w-xs px-2 py-1 border rounded bg-white"
              onChange={(e) => setSelectedCourse(e.target.value)}
              value={selectedCourse}
              title="Select Course"
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="min-w-[160px] max-w-xs px-2 py-1 border rounded bg-white"
              onChange={(e) => setSelectedBatch(e.target.value)}
              value={selectedBatch}
              title="Select Batch"
            >
              <option value="">Select batch</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
              onClick={saveTemplateLayout}
              title="Save Template"
            >
              <Save className="w-4 h-4" /> Save
            </button>

            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={downloadHighRes}
              title="Download PNG"
            >
              <Download className="w-4 h-4" /> PNG
            </button>

            <button
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={downloadPDF}
              title="Download PDF"
            >
              <FileJson className="w-4 h-4 rotate-90" /> PDF
            </button>

            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-neutral-200 hover:bg-neutral-300"
              onClick={exportJSON}
              title="Export JSON"
            >
              <FileJson className="w-4 h-4" />
              <span className="hidden md:inline">JSON</span>
            </button>

            {/* Toggle right panel (properties) */}
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-neutral-200 hover:bg-neutral-300"
              onClick={() => setRightOpen((v) => !v)}
              title="Toggle Properties"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Main Stage Layout */}
      <div className="flex-1 grid grid-cols-[auto_1fr_auto] lg:grid-cols-[auto_1fr_auto]">
        {/* Left Toolbar (collapsible on desktop, bottom sheet on mobile) */}
        <aside
          className={`${
            leftCollapsed ? "w-14" : "w-16 lg:w-20"
          } bg-white border-r h-full hidden md:flex flex-col items-center py-3 gap-2 sticky top-14`}
        >
          <button
            className="p-2 rounded hover:bg-neutral-100"
            title="Add Text"
            onClick={addText}
          >
            <Type size={22} />
          </button>
          <button className="p-2 rounded hover:bg-neutral-100" title="Add Rectangle" onClick={addRect}>
            <Square size={22} />
          </button>
          <button className="p-2 rounded hover:bg-neutral-100" title="Add Circle" onClick={addCircle}>
            <Circle size={22} />
          </button>

          {/* Upload image with crop */}
          <input
            type="file"
            accept="image/*"
            id="upload-image"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                setCropSrc(reader.result);
                cropCallbackRef.current = (croppedUrl) => {
                  addImage(croppedUrl);
                };
              };
              reader.readAsDataURL(file);
            }}
          />
          <label
            htmlFor="upload-image"
            className="p-2 rounded hover:bg-neutral-100 cursor-pointer"
            title="Upload Image"
          >
            <ImageIcon size={22} />
          </label>

          {/* Templates picker */}
          <div className="pt-2 mt-2 border-t w-full flex flex-col items-center">
            <TemplatePanel loadTemplate={loadTemplate} />
          </div>

          <div className="mt-auto flex flex-col items-center gap-2">
            <button
              className="p-2 rounded hover:bg-neutral-100"
              onClick={() => setLeftCollapsed((v) => !v)}
              title="Collapse"
            >
              <MoveHorizontal size={20} />
            </button>
          </div>
        </aside>

        {/* Center Stage */}
        <section className="relative overflow-hidden">
          {/* Secondary bar (undo/redo/duplicate + zoom) */}
          <div className="h-11 bg-white border-b flex items-center justify-between px-3 sticky top-14 z-30">
            <div className="flex items-center gap-2">
              <UndoRedoControls
                undo={undo}
                redo={redo}
                duplicateObject={duplicateObject}
                downloadPDF={downloadPDF}
              />
              <button
                title="Reset Canvas"
                onClick={() => {
                  canvas?.clear();
                  resetHistory();
                  saveHistory();
                }}
                className="p-2 rounded bg-amber-500 text-white hover:bg-amber-600"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <button
                className="px-2 py-1 rounded bg-neutral-200 hover:bg-neutral-300"
                onClick={zoomOut}
                title="Zoom Out"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <div className="min-w-[64px] text-center text-sm">{Math.round(zoom * 100)}%</div>
              <button
                className="px-2 py-1 rounded bg-neutral-200 hover:bg-neutral-300"
                onClick={zoomIn}
                title="Zoom In"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                className="ml-2 px-2 py-1 rounded bg-neutral-200 hover:bg-neutral-300"
                onClick={zoomFit}
                title="Fit"
              >
                Fit
              </button>
              <button
                className="px-2 py-1 rounded bg-neutral-200 hover:bg-neutral-300"
                onClick={zoomActual}
                title="Actual Size"
              >
                100%
              </button>
            </div>

            {/* Mobile: open panels */}
            <button
              className="md:hidden px-3 py-1.5 rounded bg-neutral-200 hover:bg-neutral-300"
              onClick={() => setShowMobilePanels((v) => !v)}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas stage (scrollable both ways) */}
          <div
            ref={canvasStageRef}
            className="relative h-[calc(100vh-14rem)] md:h-[calc(100vh-9rem)] overflow-auto bg-neutral-50"
          >
            <div className="w-max mx-auto p-6">
              <div className="shadow rounded bg-white p-2 inline-block">
                <CanvasArea ref={canvasRef} width={canvasWidth} height={canvasHeight} />
              </div>
            </div>
          </div>

          {/* Floating object toolbar */}
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
                const objs = canvas.getActiveObjects?.() || [];
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
                const active = canvas.getActiveObject?.();
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

          {/* Inline edit toolbars */}
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
        </section>

        {/* Right Properties Panel (Drawer on mobile) */}
        <aside className={`hidden lg:block ${rightOpen ? "w-80" : "w-0"} transition-all`}>
          {rightOpen && (
            <div className="h-full bg-white border-l flex flex-col sticky top-14">
              <div className="p-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  <span className="font-medium">Properties</span>
                </div>
                <button
                  className="px-2 py-1 rounded bg-neutral-200 hover:bg-neutral-300"
                  onClick={() => setRightOpen(false)}
                >
                  Hide
                </button>
              </div>

              <div className="flex-1 overflow-auto">
                {selectedInstitute?.logo && (
                  <div className="p-4">
                    <h3 className="text-sm font-semibold mb-2">Institute Logo</h3>
                    <img src={selectedInstitute.logo} className="w-32 h-32 object-contain" />
                  </div>
                )}
                {selectedInstitute?.signature && (
                  <div className="p-4">
                    <h3 className="text-sm font-semibold mb-2">Signature</h3>
                    <img src={selectedInstitute.signature} className="w-40 h-20 object-contain" />
                  </div>
                )}
                {selectedStudent?.photo?.[0] && (
                  <div className="p-4">
                    <h3 className="text-sm font-semibold mb-2">Selected Student Photo</h3>
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
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom alignment toolbar (sticky) */}
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

      {/* Mobile combined panels (Drawer) */}
      <Drawer isOpen={showMobilePanels} onClose={() => setShowMobilePanels(false)}>
        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Tools</h3>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 rounded bg-neutral-200" onClick={addText}>
                Text
              </button>
              <button className="px-3 py-2 rounded bg-neutral-200" onClick={addRect}>
                Rect
              </button>
              <button className="px-3 py-2 rounded bg-neutral-200" onClick={addCircle}>
                Circle
              </button>
              <label htmlFor="upload-image" className="px-3 py-2 rounded bg-neutral-200">
                Image
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Templates</h3>
            <TemplatePanel loadTemplate={loadTemplate} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Properties</h3>
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
          </div>
        </div>
      </Drawer>

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

      {/* Old settings drawer toggle path retained for compatibility */}
      <Drawer isOpen={showSettings} onClose={() => setShowSettings(false)}>
        <div className="p-4">
          <h3 className="text-lg font-bold mb-2">Settings</h3>
          <p className="text-sm text-neutral-600">Project settings will appear here.</p>
        </div>
      </Drawer>
    </div>
  );
};

export default CanvasEditor;
