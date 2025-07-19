import React, { useEffect, forwardRef } from "react";
import { fabric } from "fabric";

const CanvasArea = forwardRef(({ width, height }, ref) => {
  useEffect(() => {
    // Only init once
    if (!ref.current) {
      const canvas = new fabric.Canvas("fabric-canvas", {
        backgroundColor: "#fff",
        width,
        height,
        preserveObjectStacking: true,
      });
      ref.current = canvas;
    } else {
      ref.current.setWidth(width);
      ref.current.setHeight(height);
    }
  }, [ref, width, height]);

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-200">
      <canvas id="fabric-canvas" />
    </div>
  );
});

export default CanvasArea;
