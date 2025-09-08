import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState } from "react";
import { fabric } from "fabric";

/**
 * Stable Fabric canvas wrapper:
 * - Initializes once on mount
 * - Updates dimensions when props change (no re-create)
 * - Falls back to 400x550 if width/height are missing (some templates don't specify size)
 */
const CanvasArea = forwardRef(({ width, height }, ref) => {
  const localRef = useRef(null);
  const [canvas, setCanvas] = useState(null);

  // Initialize Fabric canvas once
  useEffect(() => {
    const w = Number(width) || 400;
    const h = Number(height) || 550;
    const c = new fabric.Canvas("main-canvas", {
      width: w,
      height: h,
      backgroundColor: "#fff",
      preserveObjectStacking: true,
    });
    localRef.current = c;
    setCanvas(c);
    if (ref) ref.current = c;
    return () => {
      c.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update dimensions when props change (no re-instantiation)
  useEffect(() => {
    if (!canvas) return;
    const w = Number(width) || 400;
    const h = Number(height) || 550;
    if (canvas.getWidth() !== w) canvas.setWidth(w);
    if (canvas.getHeight() !== h) canvas.setHeight(h);
    canvas.renderAll();
  }, [canvas, width, height]);

  useImperativeHandle(ref, () => canvas, [canvas]);

  return (
    <div className="bg-white shadow border w-full h-full">
      <canvas id="main-canvas" />
    </div>
  );
});

export default CanvasArea;
