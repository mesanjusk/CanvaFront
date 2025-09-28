import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
  useState,
} from "react";
import { fabric } from "fabric";

/**
 * Stable Fabric canvas wrapper:
 * - Initializes once on mount
 * - Updates dimensions when props change (no re-create)
 * - Falls back to 400x550 if width/height are missing (some templates don't specify size)
 */
const CanvasArea = forwardRef(({ width, height }, ref) => {
  const canvasEl = useRef(null);
  const [canvas, setCanvas] = useState(null);

  const applyDimensions = useCallback((instance, w, h) => {
    const dpr = window.devicePixelRatio || 1;

    instance.setWidth(w);
    instance.setHeight(h);
    instance.setDimensions({ width: w * dpr, height: h * dpr });
    instance.setViewportTransform([dpr, 0, 0, dpr, 0, 0]);

    if (canvasEl.current) {
      canvasEl.current.style.width = `${w}px`;
      canvasEl.current.style.height = `${h}px`;
    }

    instance.calcOffset();
  }, []);

  // Initialize Fabric canvas once
  useEffect(() => {
    const w = Number(width) || 400;
    const h = Number(height) || 550;

    const instance = new fabric.Canvas(canvasEl.current, {
      width: w,
      height: h,
      backgroundColor: "#fff",
      preserveObjectStacking: true,
    });

    applyDimensions(instance, w, h);
    setCanvas(instance);

    return () => {
      instance.dispose();
    };
  }, [applyDimensions]);

  // Update dimensions when props change (no re-instantiation)
  useEffect(() => {
    if (!canvas) return;
    const w = Number(width) || 400;
    const h = Number(height) || 550;

    applyDimensions(canvas, w, h);
    canvas.requestRenderAll();
  }, [applyDimensions, canvas, width, height]);

  useImperativeHandle(ref, () => canvas, [canvas]);

  return (
    <div className="bg-white shadow border w-full h-full">
      <canvas ref={canvasEl} />
    </div>
  );
});

export default CanvasArea;
