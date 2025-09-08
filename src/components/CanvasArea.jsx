import React, { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { fabric } from "fabric";

const CanvasArea = forwardRef(({ width, height }, ref) => {
  const localRef = useRef(null);

  useEffect(() => {
    localRef.current = new fabric.Canvas("main-canvas", {
      width,
      height,
      backgroundColor: "#fff",
      preserveObjectStacking: true,
    });
    if (ref) ref.current = localRef.current;
    return () => {
      localRef.current?.dispose();
    };
  }, [ref]);

  useEffect(() => {
    const canvas = localRef.current;
    if (canvas) {
      canvas.setWidth(width);
      canvas.setHeight(height);
      canvas.renderAll();
    }
  }, [width, height]);

  useImperativeHandle(ref, () => localRef.current, []);

  return (
    <div className="bg-white shadow border w-full h-full">
      <canvas id="main-canvas" />
    </div>
  );
});

export default CanvasArea;
