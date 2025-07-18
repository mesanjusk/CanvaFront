import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

const CanvasArea = React.forwardRef((props, ref) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 500,
      backgroundColor: '#fff',
    });
    if (ref) ref.current = canvas;
    return () => canvas.dispose();
  }, [ref]);

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <canvas ref={canvasRef} width={800} height={500} className="border rounded" />
    </div>
  );
});

export default CanvasArea;
