import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

function ImageCropModal({ src, onCancel, onConfirm }) {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const rectRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 400,
      height: 300,
      selection: false,
    });
    fabricRef.current = canvas;
    fabric.Image.fromURL(src, (img) => {
      imgRef.current = img;
      const scale = Math.min(400 / img.width, 300 / img.height);
      img.set({ left: 0, top: 0, selectable: false });
      img.scale(scale);
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      const rect = new fabric.Rect({
        left: 50,
        top: 50,
        width: 200,
        height: 150,
        fill: 'rgba(0,0,0,0.3)',
        borderColor: '#3182ce',
        cornerColor: '#3182ce',
        transparentCorners: false,
      });
      rectRef.current = rect;
      canvas.add(rect);
      canvas.setActiveObject(rect);
    });
    return () => canvas.dispose();
  }, [src]);

  const handleConfirm = () => {
    const canvas = fabricRef.current;
    const rect = rectRef.current;
    const img = imgRef.current;
    if (!canvas || !rect || !img) return;
    const scale = img.scaleX;
    const cropX = rect.left / scale;
    const cropY = rect.top / scale;
    const cropW = (rect.width * rect.scaleX) / scale;
    const cropH = (rect.height * rect.scaleY) / scale;
    const temp = document.createElement('canvas');
    temp.width = cropW;
    temp.height = cropH;
    const ctx = temp.getContext('2d');
    ctx.drawImage(img._element, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const dataUrl = temp.toDataURL('image/png');
    onConfirm(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded shadow">
        <canvas ref={canvasRef} width={400} height={300} className="border" />
        <div className="flex justify-end gap-2 mt-2 text-xs">
          <button onClick={onCancel} className="px-2 py-1 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleConfirm} className="px-2 py-1 bg-blue-500 text-white rounded">Add</button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
