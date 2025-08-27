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

/* --------------------------- Viewport / Performance --------------------------- */
const MAX_CANVAS_W = 4000;   // hard ceiling for giant templates
const MAX_CANVAS_H = 4000;
const DEFAULT_DOC_W = 400;   // fallback doc size if template has none
const DEFAULT_DOC_H = 550;

// View-only zoom options (like Canva). Export ignores this zoom and renders at full size.
const ZOOM_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, "Fit"];

/* ---------------------------------------------------------------------------- */

const CanvasEditor = ({ templateId: propTemplateId, onSaved, hideHeader = false }) => {
  const { templateId: routeId } = useParams();
  const templateId = propTemplateId || routeId;

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedInstitute, setSelectedInstitute] = useState(null);

  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");

  // Actual document dimensions (logical/original) – exports use these
  const [docWidth, setDocWidth] = useState(DEFAULT_DOC_W);
  const [docHeight, setDocHeight] = useState(DEFAULT_DOC_H);

  // View-only zoom (%). “Fit” is computed on mount/resize/template change.
  const [viewZoom, setViewZoom] = useState("Fit");
  const containerRef = useRef(null);

  // heavy-render and asset flags
  const renderingRef = useRef(false);
  const logoAddedRef = useRef(false);
  const signAddedRef = useRef(false);
  const placeholderTimer = useRef(null);

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
  } = useCanvasTools({ width: DEFAULT_DOC_W, height: DEFAULT_DOC_H });

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
    downloadPDF,        // will be wrapped to respect full-res export
    downloadHighRes,    // will be wrapped to respect full-res export
    isLocked,
    multipleSelected,
    saveHistory,
    resetHistory,
  } = useCanvasEditor(canvasRef, docWidth, docHeight);

  /* ------------------------------- Data fetches -------------------------------- */
  useEffect(() => {
    const run = async () => {
      try {
        const [courseRes, batchRes] = await Promise.all([
          axios.get("https://socialbackend-iucy.onrender.com/api/courses"),
          axios.get("https://socialbackend-iucy.onrender.com/api/batches"),
        ]);
        setCourses(courseRes.data || []);
        setBatches(batchRes.data || []);
      } catch (e) {
        console.error(e);
        toast.error("Error loading courses/batches");
      }
    };
    run();
  }, []);

  useEffect(() => {
    axios
      .get("https://canvaback.onrender.com/api/students")
      .then((res) => setStudents(res.data.data || []))
      .catch((err) => console.error("Failed to fetch students", err));
  }, []);

  const handleStudentSelect = (uuid) => {
    const s = students.find((x) => x.uuid === uuid);
    setSelectedStudent(s || null);
  };

  useEffect(() => {
    const run = async () => {
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
      } catch (e) {
        console.error("Failed to fetch institute", e);
      }
    };
    run();
  }, []);

  /* ---------------------- View-only scaling / zoom handling --------------------- */
  const applyViewZoom = (modeOrNumber) => {
    if (!canvas || !containerRef.current) return;
    const container = containerRef.current;

    let zoomValue = modeOrNumber;
    if (modeOrNumber === "Fit") {
      const pad = 24; // some padding inside container
      const availW = Math.max(200, container.clientWidth - pad);
      const availH = Math.max(200, container.clientHeight - pad);
      const zx = availW / docWidth;
      const zy = availH / docHeight;
      zoomValue = Math.min(zx, zy);
      zoomValue = Math.max(0.1, Math.min(zoomValue, 2)); // cap extremes in UI
    }

    // fabric zoom
    canvas.setZoom(zoomValue);
    // also set CSS size to match zoom (helps mouse coords and visual crispness)
    canvas.setDimensions(
      { width: docWidth * zoomValue, height: docHeight * zoomValue },
      { cssOnly: true }
    );
    canvas.requestRenderAll();
    setViewZoom(modeOrNumber);
  };

  // Re-apply zoom when container resizes or template size changes
  useEffect(() => {
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      if (viewZoom === "Fit") applyViewZoom("Fit");
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [canvas, viewZoom, docWidth, docHeight]);

  /* ----------------------- Placeholder replacement (debounced) ------------------ */
  const replacePlaceholders = async () => {
    if (!canvas) return;

    const S = selectedStudent || {};
    const I = selectedInstitute || {};
    const placeholders = {
      "{{title}}": "",
      "{{firstName}}": S.firstName || "",
      "{{lastName}}": S.lastName || "",
      "{{name}}": [S.firstName, S.lastName].filter(Boolean).join(" "),
      "{{course}}": (courses.find((c) => c._id === selectedCourse)?.name) || "",
      "{{batch}}": (batches.find((b) => b._id === selectedBatch)?.name) || "",
      "{{institute}}": I?.name || I?.title || "",
    };

    // Replace text in IText nodes
    canvas.getObjects("i-text").forEach((obj) => {
      let t = obj.text || "";
      Object.entries(placeholders).forEach(([k, v]) => {
        if (t.includes(k)) t = t.replaceAll(k, v);
      });
      obj.set({ text: t });
    });

    // Replace {{photo}} placeholder with actual image (once per placeholder)
    const textObjs = canvas.getObjects("i-text");
    for (const obj of textObjs) {
      if ((obj.text || "").includes("{{photo}}")) {
        const left = obj.left ?? 50;
        const top = obj.top ?? 150;
        canvas.remove(obj);

        const photoUrl = S?.photo?.[0];
        if (photoUrl) {
          await new Promise((resolve) => {
            fabric.Image.fromURL(
              photoUrl,
              (img) => {
                if (!img) return resolve();
                img.set({ left, top, selectable: true, hasControls: true });
                if (img.width > 180) img.scaleToWidth(180);
                canvas.add(img);
                resolve();
              },
              { crossOrigin: "anonymous" }
            );
          });
        }
      }
    }

    canvas.requestRenderAll();
    saveHistory();
  };

  const safeReplacePlaceholders = () => {
    if (placeholderTimer.current) clearTimeout(placeholderTimer.current);
    placeholderTimer.current = setTimeout(() => {
      replacePlaceholders();
    }, 120);
  };

  /* ---------------------- Load template + base placeholders --------------------- */
  useEffect(() => {
    const renderTemplateAndStudent = async () => {
      if (!canvas) return;
      if (renderingRef.current) return;
      renderingRef.current = true;

      try {
        await new Promise((r) => setTimeout(r, 0)); // yield

        canvas.clear();
        logoAddedRef.current = false;
        signAddedRef.current = false;

        let targetW = DEFAULT_DOC_W;
        let targetH = DEFAULT_DOC_H;

        if (templateId) {
          try {
            const res = await axios.get(
              `https://canvaback.onrender.com/api/template/${templateId}`
            );
            const { image, width, height, title } = res.data || {};

            targetW = Math.min(Number(width || 0) || DEFAULT_DOC_W, MAX_CANVAS_W);
            targetH = Math.min(Number(height || 0) || DEFAULT_DOC_H, MAX_CANVAS_H);

            // If width/height missing, probe the image (once)
            if (!width || !height) {
              if (image) {
                const probed = await new Promise((resolve) => {
                  fabric.Image.fromURL(image, resolve, { crossOrigin: "anonymous" });
                });
                if (probed) {
                  targetW = Math.min(probed.width || DEFAULT_DOC_W, MAX_CANVAS_W);
                  targetH = Math.min(probed.height || DEFAULT_DOC_H, MAX_CANVAS_H);
                }
              }
            }

            setDocWidth(targetW);
            setDocHeight(targetH);
            canvas.setWidth(targetW);
            canvas.setHeight(targetH);
            // ensure CSS matches current zoom later in applyViewZoom()

            if (image) {
              await new Promise((resolve) => {
                fabric.Image.fromURL(
                  image,
                  (img) => {
                    if (img) {
                      const sx = targetW / img.width;
                      const sy = targetH / img.height;
                      const scale = Math.max(sx, sy); // cover
                      img.scale(scale);
                      img.set({
                        left: (targetW - img.getScaledWidth()) / 2,
                        top: (targetH - img.getScaledHeight()) / 2,
                        selectable: false,
                        evented: false,
                        hasControls: false,
                      });
                      img.lockMovementX = img.lockMovementY = true;
                      canvas.add(img);
                      img.sendToBack();
                    }
                    resolve();
                  },
                  { crossOrigin: "anonymous" }
                );
              });
            }

            if (title) {
              const titleText = new fabric.IText("{{title}}", {
                left: targetW / 2,
                top: 20,
                fontSize: 24,
                fill: "#333",
                originX: "center",
                selectable: true,
                hasControls: true,
              });
              canvas.add(titleText);
            }
          } catch (e) {
            console.error("Template load error", e);
          }
        } else {
          // No template: still set base size & add default name/photo placeholders if student chosen
          setDocWidth(targetW);
          setDocHeight(targetH);
          canvas.setWidth(targetW);
          canvas.setHeight(targetH);
        }

        // Student placeholders (if any)
        if (selectedStudent) {
          const nameText = new fabric.IText("{{firstName}} {{lastName}}", {
            left: 195,
            top: Math.max(60, targetH - 150),
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

        // After size changes, apply view zoom (Fit recomputed)
        applyViewZoom(viewZoom === "Fit" ? "Fit" : viewZoom);
        safeReplacePlaceholders();
      } finally {
        renderingRef.current = false;
      }
    };

    renderTemplateAndStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, selectedStudent, canvas, selectedCourse, selectedBatch]);

  /* -------------------- Add institute logo & signature (once) ------------------- */
  useEffect(() => {
    const addMarks = async () => {
      if (!canvas || !selectedInstitute) return;

      const logoUrl = selectedInstitute.logo;
      if (logoUrl && !logoAddedRef.current) {
        await new Promise((resolve) => {
          fabric.Image.fromURL(
            logoUrl,
            (img) => {
              if (img) {
                img.scaleToWidth(80);
                img.set({ left: 20, top: 20, selectable: true });
                canvas.add(img);
                canvas.requestRenderAll();
                logoAddedRef.current = true;
              }
              resolve();
            },
            { crossOrigin: "anonymous" }
          );
        });
      }

      const signUrl = selectedInstitute.signature;
      if (signUrl && !signAddedRef.current) {
        await new Promise((resolve) => {
          fabric.Image.fromURL(
            signUrl,
            (img) => {
              if (img) {
                img.scaleToWidth(120);
                img.set({
                  left: Math.max(0, canvas.width - 150),
                  top: Math.max(0, canvas.height - 80),
                  selectable: true,
                });
                canvas.add(img);
                canvas.requestRenderAll();
                signAddedRef.current = true;
              }
              resolve();
            },
            { crossOrigin: "anonymous" }
          );
        });
      }
    };

    addMarks();
  }, [canvas, selectedInstitute]);

  /* ----------------------------- Template JSON loader --------------------------- */
  const loadTemplate = (templateJson) => {
    if (!canvas) return;
    canvas.loadFromJSON(templateJson, async () => {
      canvas.renderAll();
      safeReplacePlaceholders();
      saveHistory();

      // keep doc size if JSON had it
      setDocWidth(canvas.getWidth());
      setDocHeight(canvas.getHeight());
      applyViewZoom(viewZoom === "Fit" ? "Fit" : viewZoom);
    });
  };

  /* ------------------------------ Export / Save @ full res ---------------------- */
  const downloadPNGFullRes = () => {
    if (!canvas) return;
    const zoom = canvas.getZoom() || 1;
    const dataUrl = canvas.toDataURL({
      format: "png",
      quality: 0.95,
      multiplier: 1 / zoom, // negate view zoom to render at original size
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "canvas.png";
    a.click();
  };

  const downloadPDFFullRes = () => {
    if (!canvas) return;
    // If your existing downloadPDF already uses multiplier, you can keep that.
    // Otherwise render full-res image then pipe to jsPDF here as needed.
    // For now we mirror the PNG behavior to keep this drop-in.
    downloadPNGFullRes();
  };

  const saveTemplateLayout = async () => {
    if (!canvas) return;
    const title = prompt("Enter a name for this template:", `Template-${Date.now()}`);
    if (!title) return;

    const json = canvas.toJSON(["selectable", "hasControls"]);
    const zoom = canvas.getZoom() || 1;
    const preview = canvas.toDataURL({
      format: "png",
      quality: 0.92,
      multiplier: 1 / zoom, // store full-res preview
    });

    const payload = {
      title,
      layout: JSON.stringify(json),
      image: preview,
      width: docWidth,
      height: docHeight,
      photo: selectedStudent?.photo?.[0] || null,
      signature: selectedInstitute?.signature || null,
      logo: selectedInstitute?.logo || null,
      template: templateId || null,
    };

    try {
      await axios.post(`https://canvaback.onrender.com/api/templatelayout/save`, payload);
      toast.success("Template saved successfully");
      onSaved?.();
    } catch (e) {
      console.error("Save failed", e);
      toast.error("Error saving template");
    }
  };

  /* ----------------------------------- UI -------------------------------------- */
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
          {/* Controls: Student / Course / Batch + View Zoom */}
          <div className="p-4 grid gap-4 md:grid-cols-4 grid-cols-1">
            <div>
              <label className="block mb-2 font-semibold">Select Student:</label>
              <select
                onChange={(e) => handleStudentSelect(e.target.value)}
                className="border px-3 py-2 rounded w-full"
                value={selectedStudent?.uuid || ""}
              >
                <option value="">Select a student</option>
                {students.map((s) => (
                  <option key={s.uuid} value={s.uuid}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold">Select Course:</label>
              <select
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="border px-3 py-2 rounded w-full"
                value={selectedCourse}
              >
                <option value="">Select a course</option>
                {courses.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold">Select Batch:</label>
              <select
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="border px-3 py-2 rounded w-full"
                value={selectedBatch}
              >
                <option value="">Select a batch</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold">View (% / Fit):</label>
              <select
                className="border px-3 py-2 rounded w-full"
                value={String(viewZoom)}
                onChange={(e) => {
                  const v = e.target.value === "Fit" ? "Fit" : Number(e.target.value);
                  applyViewZoom(v);
                }}
              >
                {ZOOM_OPTIONS.map((z) => (
                  <option key={String(z)} value={String(z)}>
                    {z === "Fit" ? "Fit" : `${Math.round(z * 100)}%`}
                  </option>
                ))}
              </select>
            </div>
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
                  if (!canvas) return;
                  canvas.loadFromJSON(templateJson, async () => {
                    canvas.renderAll();
                    // keep/refresh size from JSON
                    setDocWidth(canvas.getWidth());
                    setDocHeight(canvas.getHeight());
                    applyViewZoom(viewZoom === "Fit" ? "Fit" : viewZoom);
                    safeReplacePlaceholders();
                    saveHistory();
                  });
                }}
              />

              <UndoRedoControls
                undo={undo}
                redo={redo}
                duplicateObject={duplicateObject}
                downloadPDF={downloadPDFFullRes}
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
                title="Download PNG (Full)"
                onClick={downloadPNGFullRes}
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

          {/* Canvas Area (viewport container controls “Fit” size) */}
          <div ref={containerRef} className="flex-1 overflow-auto bg-gray-50 p-4">
            <div className="mx-auto w-max max-w-full">
              <CanvasArea ref={canvasRef} width={docWidth} height={docHeight} />
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
                const newW = Math.min(bounds.width + 100, MAX_CANVAS_W);
                const newH = Math.min(bounds.height + 100, MAX_CANVAS_H);
                canvas.setWidth(newW);
                canvas.setHeight(newH);
                setDocWidth(newW);
                setDocHeight(newH);
                canvas.centerObject(activeObj);
                applyViewZoom(viewZoom === "Fit" ? "Fit" : viewZoom);
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

          {/* Settings Drawer */}
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
              canvasWidth={docWidth}
              setCanvasWidth={setDocWidth}
              canvasHeight={docHeight}
              setCanvasHeight={setDocHeight}
              setBackgroundImage={(url) => {
                fabric.Image.fromURL(
                  url,
                  (img) => {
                    const sx = docWidth / img.width;
                    const sy = docHeight / img.height;
                    const sc = Math.max(sx, sy);
                    canvas.setBackgroundImage(
                      img,
                      canvas.renderAll.bind(canvas),
                      { scaleX: sc, scaleY: sc }
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
