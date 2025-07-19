import React, { useEffect, useImperativeHandle, forwardRef } from "react";
import { fabric } from "fabric";

const CanvasArea = forwardRef(({ width, height }, ref) => {
  useEffect(() => {
    const canvas = new fabric.Canvas("main-canvas", {
      width,
      height,
      backgroundColor: "#fff",
      preserveObjectStacking: true,
    });
    if (ref) ref.current = canvas;

    return () => {
      canvas.dispose();
    };
  }, [width, height, ref]);

  return (
    <div className="bg-white shadow border">
      <canvas id="main-canvas" />
    </div>
  );
});

export default CanvasArea;
