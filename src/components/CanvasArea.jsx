import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState } from "react";
import { Box } from "@mui/material";
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
  const canvasEl = useRef(null);

  // Initialize Fabric canvas once
  useEffect(() => {
    const w = Number(width) || 400;
    const h = Number(height) || 550;

    const c = new fabric.Canvas(canvasEl.current, {
      width: w,
      height: h,
      backgroundColor: "#fff",
      preserveObjectStacking: true,
    });
    // HiDPI scaling
    const dpr = window.devicePixelRatio || 1;
    c.setDimensions({ width: w * dpr, height: h * dpr });
    c.setViewportTransform([dpr, 0, 0, dpr, 0, 0]);
    // CSS pixel size
    if (canvasEl.current) {
      canvasEl.current.style.width = `${w}px`;
      canvasEl.current.style.height = `${h}px`;
    }
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

    const dpr = window.devicePixelRatio || 1;
    if (canvas.getWidth() !== w * dpr || canvas.getHeight() !== h * dpr) {
      canvas.setDimensions({ width: w * dpr, height: h * dpr });
      canvas.setViewportTransform([dpr, 0, 0, dpr, 0, 0]);
      if (canvasEl.current) {
        canvasEl.current.style.width = `${w}px`;
        canvasEl.current.style.height = `${h}px`;
      }
    }
    canvas.requestRenderAll();

  }, [canvas, width, height]);

  useImperativeHandle(ref, () => canvas, [canvas]);

  return (
    <Box
      sx={{
        backgroundColor: "background.paper",
        boxShadow: 1,
        border: 1,
        borderColor: "divider",
        width: "100%",
        height: "100%",
      }}
    >
      <canvas ref={canvasEl} />
    </Box>
  );
});

export default CanvasArea;
