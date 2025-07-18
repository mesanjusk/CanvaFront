import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import axios from 'axios';


const CanvasEditor = () => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const fabricRef = useRef(fabric);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    const newCanvas = new fabric.Canvas(canvasRef.current, {
      height: 500,
      width: 800,
      backgroundColor: '#fff',
    });

    fabricCanvasRef.current = newCanvas;
  }, []);

  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const text = new fabric.IText('Enter text', {
      left: 50,
      top: 50,
      fill: 'black',
      fontSize: 24,
    });
    canvas.add(text);
  };

 const addImage = (e) => {
  const canvas = fabricCanvasRef.current;
  if (!canvas) return;

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (f) => {
    const dataUrl = f.target.result;

    const imgElement = new Image();
    imgElement.src = dataUrl;

    imgElement.onload = () => {
      const imgInstance = new fabric.Image(imgElement, {
        left: 100,
        top: 100,
        scaleX: Math.min(1, 800 / imgElement.width),
        scaleY: Math.min(1, 500 / imgElement.height),
      });

      canvas.add(imgInstance);
      canvas.setActiveObject(imgInstance);
      canvas.renderAll();
    };
  };

  reader.readAsDataURL(file);
};


  const saveTemplate = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const json = canvas.toJSON();
    const dataURL = canvas.toDataURL({ format: 'jpeg' });

    await axios.post('https://canvaback.onrender.com/api/templates/save', {
      name: templateName,
      canvasJSON: json,
      thumbnail: dataURL,
    });

    alert('Template Saved!');
  };

  const exportImage = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.discardActiveObject();
    canvas.backgroundColor = '#d88080ff';
    canvas.renderAll();

    setTimeout(() => {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
      });

      const a = document.createElement('a');
      a.href = dataURL;
      a.download = 'canvas.png';
      a.click();
    }, 300);
  };

  const addBackgroundImage = (e) => {
  const canvas = fabricCanvasRef.current;
  if (!canvas) return;

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (f) => {
    const dataUrl = f.target.result;

    fabric.Image.fromURL(dataUrl, (img) => {
      const scaleX = canvas.width / img.width;
      const scaleY = canvas.height / img.height;
      img.set({
        scaleX,
        scaleY,
        selectable: false,
        evented: false,
      });
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    }, { crossOrigin: 'Anonymous' });
  };
  reader.readAsDataURL(file);
};


  return (
    <div className="p-4">
      <input
        placeholder="Template Name"
        value={templateName}
        onChange={(e) => setTemplateName(e.target.value)}
        className="mb-2 p-2 border"
      />
      <div className="mb-2">
        <button onClick={addText} className="mr-2 p-2 bg-blue-500 text-white">Add Text</button>
        <input type="file" onChange={addImage} className="ml-2" />
        <button onClick={saveTemplate} className="ml-2 p-2 bg-green-500 text-white">Save Template</button>
        <button onClick={exportImage} className="ml-2 p-2 bg-orange-500 text-white">Export Image</button>
      </div>
      <canvas
        ref={canvasRef}
        className="border"
        width={800}
        height={500}
      />
    </div>
  );
};

export default CanvasEditor;