import React, { useEffect, useRef, forwardRef } from "react";
import { fabric } from "fabric";

const CanvasArea = forwardRef(({ width, height }, ref) => {
  const canvasEl = useRef(null); // DOM reference to <canvas>

  useEffect(() => {
    if (canvasEl.current && !ref.current) {
      const canvas = new fabric.Canvas(canvasEl.current, {
        backgroundColor: "#fff",
        width,
        height,
        preserveObjectStacking: true,
      });
      ref.current = canvas;
    } else if (ref.current) {
      ref.current.setWidth(width);
      ref.current.setHeight(height);
    }
  }, [ref, width, height]);

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-200">
      <canvas ref={canvasEl} />
    </div>
  );
});

export default CanvasArea;
