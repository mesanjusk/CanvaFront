import React, { useRef, useState } from 'react';
import Toolbar from './components/Toolbar';
import CanvasArea from './components/CanvasArea';
import RightPanel from './components/RightPanel';
import ImageCropModal from './components/ImageCropModal';
import { fabric } from 'fabric';

function App() {
  const canvasRef = useRef(null);
  const [fillColor, setFillColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(500);
  const [cropSrc, setCropSrc] = useState(null);
  const cropCallbackRef = useRef(null);

  const addText = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const text = new fabric.IText('Text', {
      left: 50,
      top: 50,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
      fontSize,
    });
    canvas.add(text);
  };

  const addRect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 80,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
    });
    canvas.add(rect);
  };

  const addCircle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const circle = new fabric.Circle({
      left: 150,
      top: 150,
      radius: 40,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
    });
    canvas.add(circle);
  };

  const addImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      cropCallbackRef.current = handleCroppedImage;
      setCropSrc(f.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedImage = (dataUrl) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    fabric.Image.fromURL(dataUrl, (img) => {
      canvas.add(img);
    });
  };

  const bringToFront = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) canvas.bringToFront(obj);
  };

  const sendToBack = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) canvas.sendToBack(obj);
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL({ format: 'png' });
    link.download = 'canvas.png';
    link.click();
  };

  const cropImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'image') {
      cropCallbackRef.current = (dataUrl) => {
        const { left, top } = obj;
        canvas.remove(obj);
        fabric.Image.fromURL(dataUrl, (img) => {
          img.set({ left, top });
          canvas.add(img);
          canvas.setActiveObject(img);
        });
      };
      setCropSrc(obj._element.src);
    }
  };

  const alignLeft = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set({ left: 0 });
      obj.setCoords();
      canvas.requestRenderAll();
    }
  };

  const alignCenter = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set({ left: (canvasWidth - obj.getScaledWidth()) / 2 });
      obj.setCoords();
      canvas.requestRenderAll();
    }
  };

  const alignRight = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set({ left: canvasWidth - obj.getScaledWidth() });
      obj.setCoords();
      canvas.requestRenderAll();
    }
  };

  const alignTop = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set({ top: 0 });
      obj.setCoords();
      canvas.requestRenderAll();
    }
  };

  const alignMiddle = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set({ top: (canvasHeight - obj.getScaledHeight()) / 2 });
      obj.setCoords();
      canvas.requestRenderAll();
    }
  };

  const alignBottom = () => {
    const canvas = canvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set({ top: canvasHeight - obj.getScaledHeight() });
      obj.setCoords();
      canvas.requestRenderAll();
    }
  };

  return (
    <div className="h-screen flex flex-col pb-20 md:pb-0">
      <header className="h-12 bg-gray-800 text-white flex items-center px-4">My Canva Clone</header>
      <div className="flex flex-1 overflow-hidden">
        <CanvasArea ref={canvasRef} width={canvasWidth} height={canvasHeight} />
        <RightPanel
          fillColor={fillColor}
          setFillColor={setFillColor}
          fontSize={fontSize}
          setFontSize={setFontSize}
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          canvasWidth={canvasWidth}
          setCanvasWidth={setCanvasWidth}
          canvasHeight={canvasHeight}
          setCanvasHeight={setCanvasHeight}
        />
      </div>
      <Toolbar
        onAddText={addText}
        onAddRect={addRect}
        onAddCircle={addCircle}
        onAddImage={addImage}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onDownload={download}
        onCropImage={cropImage}
        onAlignLeft={alignLeft}
        onAlignCenter={alignCenter}
        onAlignRight={alignRight}
        onAlignTop={alignTop}
        onAlignMiddle={alignMiddle}
        onAlignBottom={alignBottom}
      />
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onCancel={() => {
            setCropSrc(null);
            cropCallbackRef.current = null;
          }}
          onConfirm={(url) => {
            cropCallbackRef.current?.(url);
            setCropSrc(null);
            cropCallbackRef.current = null;
          }}
        />
      )}
    </div>
  );
}

export default App;
