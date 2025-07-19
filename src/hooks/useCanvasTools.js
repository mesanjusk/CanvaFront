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

  // Handlers
  const addText = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const text = new fabric.IText("Text", {
      left: 50,
      top: 50,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
      fontSize,
    });
    canvas.add(text);
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
    canvas.add(rect);
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
    canvas.add(circle);
  };

  const addImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      cropCallbackRef.current = handleCroppedImage;
      setCropSrc(f.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedImage = (dataUrl) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    fabric.Image.fromURL(dataUrl, (img) => {
      canvas.add(img);
    });
  };

  const bringToFront = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) canvas.bringToFront(obj);
  };

  const sendToBack = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) canvas.sendToBack(obj);
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL({ format: "png" });
    link.download = "canvas.png";
    link.click();
  };

  const cropImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj && obj.type === "image") {
      cropCallbackRef.current = (dataUrl) => {
        const { left, top } = obj;
        canvas.remove(obj);
        fabric.Image.fromURL(dataUrl, (img) => {
          img.set({ left, top });
          canvas.add(img);
          canvas.setActiveObject(img);
        });
      };
      setCropSrc(obj._element.src);
    }
  };

  const alignLeft = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set({ left: 0 });
      obj.setCoords();
      canvas.requestRenderAll();
    }
  };

  const alignCenter = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set({ left: (canvasWidth - obj.getScaledWidth()) / 2 });
      obj.setCoords();
      canvas.requestRenderAll();
    }
  };

  const alignRight = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set({ left: canvasWidth - obj.getScaledWidth() });
      obj.setCoords();
      canvas.requestRenderAll();
    }
  };

  const alignTop = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set({ top: 0 });
      obj.setCoords();
      canvas.requestRenderAll();
    }
  };

  const alignMiddle = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set({ top: (canvasHeight - obj.getScaledHeight()) / 2 });
      obj.setCoords();
      canvas.requestRenderAll();
    }
  };

  const alignBottom = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set({ top: canvasHeight - obj.getScaledHeight() });
      obj.setCoords();
      canvas.requestRenderAll();
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
  };
}
