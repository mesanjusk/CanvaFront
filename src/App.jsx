import React, { useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import CanvasArea from './components/CanvasArea';
import RightPanel from './components/RightPanel';
import { fabric } from 'fabric';

function App() {
  const canvasRef = useRef(null);
  const [fillColor, setFillColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(1);

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
    const canvas = canvasRef.current;
    const file = e.target.files[0];
    if (!canvas || !file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      fabric.Image.fromURL(f.target.result, (img) => {
        canvas.add(img);
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="h-12 bg-gray-800 text-white flex items-center px-4">My Canva Clone</header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onAddText={addText} onAddRect={addRect} onAddCircle={addCircle} onAddImage={addImage} />
        <CanvasArea ref={canvasRef} />
        <RightPanel
          fillColor={fillColor}
          setFillColor={setFillColor}
          fontSize={fontSize}
          setFontSize={setFontSize}
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
        />
      </div>
    </div>
  );
}

export default App;
