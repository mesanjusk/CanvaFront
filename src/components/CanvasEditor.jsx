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
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');

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

  const addImageToPosition = (file, left, top, maxW, maxH) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      const dataUrl = f.target.result;
      const imgEl = new Image();
      imgEl.src = dataUrl;
      imgEl.onload = () => {
        const scale = Math.min(maxW / imgEl.width, maxH / imgEl.height, 1);
        const imgInstance = new fabric.Image(imgEl, {
          left,
          top,
          scaleX: scale,
          scaleY: scale,
        });
        canvas.add(imgInstance);
        canvas.setActiveObject(imgInstance);
        canvas.renderAll();
      };
    };
    reader.readAsDataURL(file);
  };

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

  const resetCanvas = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.setBackgroundColor('#fff', canvas.renderAll.bind(canvas));
    setName('');
    setIdNumber('');
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
    <div className="p-4 space-y-4 max-w-screen-sm mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          placeholder="Template Name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="p-2 border"
        />
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 border"
        />
        <input
          placeholder="ID Number"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          className="p-2 border"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">Template<input type="file" onChange={handleTemplateUpload} className="block" /></label>
        <label className="text-sm">Photo<input type="file" onChange={handlePhotoUpload} className="block" /></label>
        <label className="text-sm">Logo<input type="file" onChange={handleLogoUpload} className="block" /></label>
        <label className="text-sm">Sign<input type="file" onChange={handleSignUpload} className="block" /></label>
        <button onClick={addDetails} className="p-2 bg-blue-500 text-white">Add Details</button>
        <button onClick={addText} className="p-2 bg-blue-500 text-white">Add Text</button>
        <button onClick={saveTemplate} className="p-2 bg-green-500 text-white">Save</button>
        <button onClick={exportImage} className="p-2 bg-orange-500 text-white">Export</button>
        <button onClick={resetCanvas} className="p-2 bg-gray-500 text-white">Reset</button>
        <input type="color" value={fillColor} onChange={applyFillColor} className="p-1 border" />
        <label className="ml-2 text-sm">X:
          <input
            type="number"
            value={posX}
            onChange={(e) => updatePosition('x', parseInt(e.target.value, 10))}
            className="ml-1 w-16 border p-1"
          />
        </label>
        <label className="ml-2 text-sm">Y:
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
          className="border w-full"
          width={800}
          height={500}
        />
      </div>
    </div>
  );
};

export default CanvasEditor;