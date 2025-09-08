import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState } from "react";
import { fabric } from "fabric";

const CanvasArea = forwardRef(({ width, height }, ref) => {
  const localRef = useRef(null);
  const [canvas, setCanvas] = useState(null);

  // Initialize Fabric canvas once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const c = new fabric.Canvas("main-canvas", {
      width,
      height,
      backgroundColor: "#fff",
      preserveObjectStacking: true,
    });
    localRef.current = c;
    setCanvas(c);
    return () => {
      c.dispose();
    };
  }, []);

  // Update dimensions when props change
  useEffect(() => {
    if (canvas) {
      canvas.setWidth(width);
      canvas.setHeight(height);
      canvas.renderAll();
    }
  }, [canvas, width, height]);

  useImperativeHandle(ref, () => canvas, [canvas]);

  return (
    <div className="bg-white shadow border w-full h-full">
      <canvas id="main-canvas" />
    </div>
  );
});

export default CanvasArea;
