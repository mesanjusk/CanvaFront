import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

const CanvasArea = React.forwardRef(({ width, height }, ref) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#fff',
    });
    if (ref) ref.current = canvas;
    return () => canvas.dispose();
  }, []);

  useEffect(() => {
    if (ref?.current) {
      ref.current.setWidth(width);
      ref.current.setHeight(height);
      ref.current.renderAll();
    }
  }, [width, height, ref]);

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <canvas ref={canvasRef} width={width} height={height} className="border rounded" />
    </div>
  );
});

export default CanvasArea;
