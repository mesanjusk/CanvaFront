import { useRef, useState } from "react";
import { fabric } from "fabric";

export function useCanvasTools({ width, height }) {
  const canvasRef = useRef(null);
  const [fillColor, setFillColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(24);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(width || 500);
  const [canvasHeight, setCanvasHeight] = useState(height || 500);
  const [cropSrc, setCropSrc] = useState(null);
  const cropCallbackRef = useRef(null);

  const addText = (options = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const text = new fabric.IText(options.text || "Double-click to edit", {
      left: options.left ?? 50,
      top: options.top ?? 50,
      fill: options.fill || fillColor,
      stroke: options.stroke || strokeColor,
      strokeWidth: options.strokeWidth ?? strokeWidth,
      fontSize: options.fontSize ?? fontSize,
      fontFamily: options.fontFamily || "Arial",
    });
text.customId = "templateText";
    // Mark as student name field if requested
    if (options.markStudentName) {
      text.customId = "studentName";
      text.field = "studentName";
    }

    canvas.add(text).setActiveObject(text);
    canvas.requestRenderAll();
  };

  const addRect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 80,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
    });
    canvas.add(rect).setActiveObject(rect);
    canvas.requestRenderAll();
  };

  const addCircle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const circle = new fabric.Circle({
      left: 150,
      top: 150,
      radius: 40,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
    });
    canvas.add(circle).setActiveObject(circle);
    canvas.requestRenderAll();
  };

  const addImage = (url) => {
  const canvas = canvasRef.current;
  if (!canvas || !url) return;

  // find the saved frame
  const frameSlot = canvas.getObjects().find(o => o.customId === "frameSlot");
  if (!frameSlot) {
    // no frame? fallback to plain add
    return fabric.Image.fromURL(url, img => {
      img.set({
        left: canvas.width / 2,
        top:  canvas.height / 2,
        originX: "center",
        originY: "center",
        selectable: true
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    });
  }

  // compute bounding box
  const bounds = frameSlot.getBoundingRect(true);

  fabric.Image.fromURL(url, img => {
  let clipPath;

  if (frameSlot.type === "path" && frameSlot.path) {
    // Path frame
    clipPath = new fabric.Path(frameSlot.path, {
      originX: "center",
      originY: "center",
      left: frameSlot.left,
      top: frameSlot.top,
      scaleX: frameSlot.scaleX || 1,
      scaleY: frameSlot.scaleY || 1,
      absolutePositioned: true
    });
  } else if (frameSlot.type === "polygon" && frameSlot.points) {
    // ✅ Polygon frame (your hexagon)
    clipPath = new fabric.Polygon(frameSlot.points, {
      originX: "center",
      originY: "center",
      left: frameSlot.left,
      top: frameSlot.top,
      scaleX: frameSlot.scaleX || 1,
      scaleY: frameSlot.scaleY || 1,
      absolutePositioned: true
    });
  } else {
    // Fallback rectangle
    clipPath = new fabric.Rect({
      width: bounds.width,
      height: bounds.height,
      originX: "center",
      originY: "center",
      left: bounds.left + bounds.width / 2,
      top: bounds.top + bounds.height / 2,
      absolutePositioned: true
    });
  }

  // scale so it covers the frame area
  const scale = Math.max(bounds.width / img.width, bounds.height / img.height);

  img.set({
    originX: "center",
    originY: "center",
    left: bounds.left + bounds.width / 2,
    top: bounds.top + bounds.height / 2,
    scaleX: scale,
    scaleY: scale,
    clipPath,
    selectable: true,
    customId: "uploadedPhoto"
  });

  // add right above the frame
  canvas.add(img);
  img.moveTo(canvas.getObjects().indexOf(frameSlot) + 1);
  canvas.setActiveObject(img);
  canvas.requestRenderAll();
}, { crossOrigin: "anonymous" });

}

  const handleCroppedImage = (dataUrl) => {
    addImage(dataUrl);
  };

  const bringToFront = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) canvas.bringToFront(obj);
  };

  const sendToBack = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) canvas.sendToBack(obj);
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prevVpt = canvas.viewportTransform.slice();
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const link = document.createElement("a");
    link.href = canvas.toDataURL({ format: "png" });
    link.download = "canvas.png";
    link.click();
    canvas.setViewportTransform(prevVpt);
    canvas.requestRenderAll();
  };

  const cropImage = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj && obj.type === "image") {
      cropCallbackRef.current = (dataUrl) => {
        const { left, top } = obj;
        canvas.remove(obj);
        fabric.Image.fromURL(dataUrl, (img) => {
          img.set({ left, top });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.requestRenderAll();
        });
      };
      setCropSrc(obj._element.src);
    }
  };

  // 🔁 Align Helpers — works with single or multiple selections
  const getSelectedObjects = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return [];
    return obj.type === "activeSelection" ? obj._objects : [obj];
  };

  const alignLeft = () => {
    const canvas = canvasRef.current;
    const objects = getSelectedObjects();
    objects.forEach((obj) => {
      obj.set({ left: 0 });
      obj.setCoords();
    });
    canvas.requestRenderAll();
  };

  const alignCenter = () => {
    const canvas = canvasRef.current;
    const objects = getSelectedObjects();
    objects.forEach((obj) => {
      obj.set({ left: (canvasWidth - obj.getScaledWidth()) / 2 });
      obj.setCoords();
    });
    canvas.requestRenderAll();
  };

  const alignRight = () => {
    const canvas = canvasRef.current;
    const objects = getSelectedObjects();
    objects.forEach((obj) => {
      obj.set({ left: canvasWidth - obj.getScaledWidth() });
      obj.setCoords();
    });
    canvas.requestRenderAll();
  };

  const alignTop = () => {
    const canvas = canvasRef.current;
    const objects = getSelectedObjects();
    objects.forEach((obj) => {
      obj.set({ top: 0 });
      obj.setCoords();
    });
    canvas.requestRenderAll();
  };

  const alignMiddle = () => {
    const canvas = canvasRef.current;
    const objects = getSelectedObjects();
    objects.forEach((obj) => {
      obj.set({ top: (canvasHeight - obj.getScaledHeight()) / 2 });
      obj.setCoords();
    });
    canvas.requestRenderAll();
  };

  const alignBottom = () => {
    const canvas = canvasRef.current;
    const objects = getSelectedObjects();
    objects.forEach((obj) => {
      obj.set({ top: canvasHeight - obj.getScaledHeight() });
      obj.setCoords();
    });
    canvas.requestRenderAll();
  };

  const setCanvasSize = (w, h) => {
    setCanvasWidth(w);
    setCanvasHeight(h);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.setWidth(w);
      canvas.setHeight(h);
      canvas.renderAll();
    }
  };

  return {
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
    handleCroppedImage,
    bringToFront,
    sendToBack,
    download,
    cropImage,
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
    setCanvasSize,
  };
}
