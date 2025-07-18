import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import axios from 'axios';

const CanvasEditor = () => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [templateName, setTemplateName] = useState('');
  const [fillColor, setFillColor] = useState('#000000');
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');

  // Initialize canvas
  useEffect(() => {
    if (fabricCanvasRef.current) fabricCanvasRef.current.dispose();
    const newCanvas = new fabric.Canvas(canvasRef.current, {
      height: 500,
      width: 800,
      backgroundColor: '#fff',
    });
    newCanvas.on('selection:created', updateControls);
    newCanvas.on('selection:updated', updateControls);
    newCanvas.on('selection:cleared', () => {
      setPosX(0); setPosY(0);
    });
    fabricCanvasRef.current = newCanvas;
  }, []);

  function updateControls() {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (active) {
      setPosX(Math.round(active.left || 0));
      setPosY(Math.round(active.top || 0));
      if (active.fill) setFillColor(active.fill);
    }
  }

  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const text = new fabric.IText('Enter text', {
      left: 50, top: 50, fill: 'black', fontSize: 24,
    });
    canvas.add(text);
  };

  const saveTemplate = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const json = canvas.toJSON();
    const dataURL = canvas.toDataURL({ format: 'jpeg' });
    await axios.post('https://canvaback.onrender.com/api/templates/save', {
      name: templateName, canvasJSON: json, thumbnail: dataURL,
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
      const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
      const a = document.createElement('a');
      a.href = dataURL; a.download = 'canvas.png'; a.click();
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
        img.set({ scaleX, scaleY, selectable: false, evented: false });
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      }, { crossOrigin: 'Anonymous' });
    };
    reader.readAsDataURL(file);
  };

  const addImageToPosition = (file, left, top, maxW, maxH) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      const dataUrl = f.target.result;
      const imgEl = new window.Image();
      imgEl.src = dataUrl;
      imgEl.onload = () => {
        const scale = Math.min(maxW / imgEl.width, maxH / imgEl.height, 1);
        const imgInstance = new fabric.Image(imgEl, {
          left, top, scaleX: scale, scaleY: scale,
        });
        canvas.add(imgInstance);
        canvas.setActiveObject(imgInstance);
        canvas.renderAll();
      };
    };
    reader.readAsDataURL(file);
  };

  // File upload handlers
  const handleTemplateUpload = (e) => addBackgroundImage(e);
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) addImageToPosition(file, 20, 60, 120, 150);
  };
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) addImageToPosition(file, 220, 10, 80, 80);
  };
  const handleSignUpload = (e) => {
    const file = e.target.files[0];
    if (file) addImageToPosition(file, 220, 160, 120, 60);
  };

  const addDetails = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const nameText = new fabric.Text(name, { left: 20, top: 230, fill: '#000', fontSize: 18 });
    const idText = new fabric.Text(idNumber, { left: 20, top: 260, fill: '#000', fontSize: 16 });
    canvas.add(nameText, idText);
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
      const img = new window.Image();
      img.src = dataUrl;
      img.onload = () => {
        const imgInstance = new fabric.Image(img, {
          left: 100, top: 100,
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

  const resetCanvas = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.setBackgroundColor('#fff', canvas.renderAll.bind(canvas));
    setName(''); setIdNumber('');
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
      if (axis === 'x') { active.set('left', value); setPosX(value); }
      else { active.set('top', value); setPosY(value); }
      canvas.renderAll();
    }
  };

  // Mobile: allow swipe to scroll toolbars
  // Canvas area will scroll horizontally on xs screens

  return (
    <div className="p-2 md:p-4 max-w-full md:max-w-screen-md mx-auto">
      {/* Inputs & Actions */}
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <input
          placeholder="Template Name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="p-2 border rounded w-full md:w-auto"
        />
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 border rounded w-full md:w-auto"
        />
        <input
          placeholder="ID Number"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          className="p-2 border rounded w-full md:w-auto"
        />
      </div>

      {/* Tools/Buttons */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-2 overflow-x-auto py-2">
        <label className="text-xs flex flex-col items-center">
          <span className="mb-1">Template</span>
          <input type="file" onChange={handleTemplateUpload} className="block text-xs" />
        </label>
        <label className="text-xs flex flex-col items-center">
          <span className="mb-1">Photo</span>
          <input type="file" onChange={handlePhotoUpload} className="block text-xs" />
        </label>
        <label className="text-xs flex flex-col items-center">
          <span className="mb-1">Logo</span>
          <input type="file" onChange={handleLogoUpload} className="block text-xs" />
        </label>
        <label className="text-xs flex flex-col items-center">
          <span className="mb-1">Sign</span>
          <input type="file" onChange={handleSignUpload} className="block text-xs" />
        </label>

        <button onClick={addDetails} className="p-2 bg-blue-500 text-white rounded text-xs">Add Details</button>
        <button onClick={addText} className="p-2 bg-blue-500 text-white rounded text-xs">Add Text</button>
        <button onClick={saveTemplate} className="p-2 bg-green-600 text-white rounded text-xs">Save</button>
        <button onClick={exportImage} className="p-2 bg-orange-500 text-white rounded text-xs">Export</button>
        <button onClick={resetCanvas} className="p-2 bg-gray-700 text-white rounded text-xs">Reset</button>

        <input type="color" value={fillColor} onChange={applyFillColor} className="h-8 w-8 p-0 border rounded-full" />
        <div className="flex items-center text-xs gap-1">
          <span>X:</span>
          <input
            type="number"
            value={posX}
            onChange={(e) => updatePosition('x', parseInt(e.target.value, 10))}
            className="w-14 border p-1 rounded"
          />
        </div>
        <div className="flex items-center text-xs gap-1">
          <span>Y:</span>
          <input
            type="number"
            value={posY}
            onChange={(e) => updatePosition('y', parseInt(e.target.value, 10))}
            className="w-14 border p-1 rounded"
          />
        </div>
        <button onClick={bringForward} className="p-2 bg-purple-500 text-white rounded text-xs">↑</button>
        <button onClick={sendBackward} className="p-2 bg-purple-500 text-white rounded text-xs">↓</button>
      </div>

      {/* Canvas area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border rounded bg-white shadow overflow-x-auto max-w-full"
        style={{ touchAction: 'pan-y' }}
      >
        <div className="w-[96vw] md:w-[800px] overflow-auto">
          <canvas
            ref={canvasRef}
            className="block mx-auto"
            width={800}
            height={500}
            style={{
              width: '100%',
              maxWidth: '800px',
              height: 'auto',
              minHeight: '300px',
              background: '#fff',
              borderRadius: '8px'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CanvasEditor;
