import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import axios from 'axios';


const CanvasEditor = () => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const fabricRef = useRef(fabric);
  const [templateName, setTemplateName] = useState('');
  const [fillColor, setFillColor] = useState('#000000');
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    const newCanvas = new fabric.Canvas(canvasRef.current, {
      height: 500,
      width: 800,
      backgroundColor: '#fff',
    });

    newCanvas.on('selection:created', updateControls);
    newCanvas.on('selection:updated', updateControls);
    newCanvas.on('selection:cleared', () => {
      setPosX(0);
      setPosY(0);
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

  function updateControls() {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (active) {
      setPosX(Math.round(active.left || 0));
      setPosY(Math.round(active.top || 0));
      if (active.fill) setFillColor(active.fill);
    }
  }

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

  const handleDrop = (e) => {
    e.preventDefault();
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      const dataUrl = f.target.result;
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const imgInstance = new fabric.Image(img, {
          left: 100,
          top: 100,
          scaleX: Math.min(1, 800 / img.width),
          scaleY: Math.min(1, 500 / img.height),
        });
        canvas.add(imgInstance);
        canvas.setActiveObject(imgInstance);
        canvas.renderAll();
      };
    };
    reader.readAsDataURL(file);
  };

  const bringForward = () => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (active) canvas.bringForward(active);
  };

  const sendBackward = () => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (active) canvas.sendBackwards(active);
  };

  const applyFillColor = (e) => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    setFillColor(e.target.value);
    if (active && active.set) {
      active.set('fill', e.target.value);
      canvas.renderAll();
    }
  };

  const updatePosition = (axis, value) => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (active && !Number.isNaN(value)) {
      if (axis === 'x') {
        active.set('left', value);
        setPosX(value);
      } else {
        active.set('top', value);
        setPosY(value);
      }
      canvas.renderAll();
    }
  };


  return (
    <div className="p-4">
      <input
        placeholder="Template Name"
        value={templateName}
        onChange={(e) => setTemplateName(e.target.value)}
        className="mb-2 p-2 border"
      />
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button onClick={addText} className="p-2 bg-blue-500 text-white">Add Text</button>
        <input type="file" onChange={addImage} className="ml-2" />
        <button onClick={saveTemplate} className="p-2 bg-green-500 text-white">Save Template</button>
        <button onClick={exportImage} className="p-2 bg-orange-500 text-white">Export Image</button>
        <button onClick={bringForward} className="p-2 bg-gray-500 text-white">Page Up</button>
        <button onClick={sendBackward} className="p-2 bg-gray-500 text-white">Page Down</button>
        <input type="color" value={fillColor} onChange={applyFillColor} className="p-1 border" />
        <label className="ml-2">X:
          <input
            type="number"
            value={posX}
            onChange={(e) => updatePosition('x', parseInt(e.target.value, 10))}
            className="ml-1 w-16 border p-1"
          />
        </label>
        <label className="ml-2">Y:
          <input
            type="number"
            value={posY}
            onChange={(e) => updatePosition('y', parseInt(e.target.value, 10))}
            className="ml-1 w-16 border p-1"
          />
        </label>
      </div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <canvas
          ref={canvasRef}
          className="border"
          width={800}
          height={500}
        />
      </div>
    </div>
  );
};

export default CanvasEditor;