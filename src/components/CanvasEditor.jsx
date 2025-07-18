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
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const [, setHistoryIndex] = useState(-1);

  // Initialize canvas
  useEffect(() => {
    if (fabricCanvasRef.current) fabricCanvasRef.current.dispose();
    const newCanvas = new fabric.Canvas(canvasRef.current, {
      height: 500,
      width: 800,
      backgroundColor: '#fff',
    });
    const saveHistory = () => {
      const json = newCanvas.toJSON();
      const nextIndex = historyIndexRef.current + 1;
      historyRef.current = [...historyRef.current.slice(0, nextIndex), json];
      historyIndexRef.current = nextIndex;
      setHistoryIndex(nextIndex);
    };
    newCanvas.on('object:added', saveHistory);
    newCanvas.on('object:modified', saveHistory);
    newCanvas.on('object:removed', saveHistory);
    newCanvas.on('selection:created', updateControls);
    newCanvas.on('selection:updated', updateControls);
    newCanvas.on('selection:cleared', () => {
      setPosX(0); setPosY(0);
    });
    fabricCanvasRef.current = newCanvas;
    saveHistory();
    return () => {
      newCanvas.dispose();
    };
  }, []);

  function updateControls() {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (active) {
      setPosX(Math.round(active.left || 0));
      setPosY(Math.round(active.top || 0));
      if (active.fill) setFillColor(active.fill);
      if (active.type === 'i-text') {
        if (active.fontFamily) setFontFamily(active.fontFamily);
        if (active.fontSize) setFontSize(active.fontSize);
      }
    }
  }

  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const text = new fabric.IText('Enter text', {
      left: 50,
      top: 50,
      fill: fillColor,
      fontSize,
      fontFamily,
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

  const addRectangle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 50,
      top: 50,
      width: 120,
      height: 80,
      fill: fillColor,
    });
    canvas.add(rect);
  };

  const addCircle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 40,
      fill: fillColor,
    });
    canvas.add(circle);
  };

  const addTriangle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const tri = new fabric.Triangle({
      left: 80,
      top: 80,
      width: 80,
      height: 80,
      fill: fillColor,
    });
    canvas.add(tri);
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
    const nameText = new fabric.Text(name, {
      left: 20,
      top: 230,
      fill: fillColor,
      fontSize,
      fontFamily,
    });
    const idText = new fabric.Text(idNumber, {
      left: 20,
      top: 260,
      fill: fillColor,
      fontSize: fontSize - 2,
      fontFamily,
    });
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

  const bringToFront = () => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (active) canvas.bringToFront(active);
  };

  const sendToBack = () => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (active) canvas.sendToBack(active);
  };

  const deleteObject = () => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (active) canvas.remove(active);
  };

  const cloneObject = () => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    if (active && active.clone) {
      active.clone((cloned) => {
        cloned.set({ left: (active.left || 0) + 20, top: (active.top || 0) + 20 });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.requestRenderAll();
      });
    }
  };

  const undo = () => {
    const canvas = fabricCanvasRef.current;
    const idx = historyIndexRef.current - 1;
    if (idx < 0) return;
    canvas.loadFromJSON(historyRef.current[idx], canvas.renderAll.bind(canvas));
    historyIndexRef.current = idx;
    setHistoryIndex(idx);
  };

  const redo = () => {
    const canvas = fabricCanvasRef.current;
    const idx = historyIndexRef.current + 1;
    if (idx >= historyRef.current.length) return;
    canvas.loadFromJSON(historyRef.current[idx], canvas.renderAll.bind(canvas));
    historyIndexRef.current = idx;
    setHistoryIndex(idx);
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

  const changeFont = (e) => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    setFontFamily(e.target.value);
    if (active && active.set && active.type === 'i-text') {
      active.set('fontFamily', e.target.value);
      canvas.renderAll();
    }
  };

  const changeFontSize = (e) => {
    const canvas = fabricCanvasRef.current;
    const active = canvas?.getActiveObject();
    const value = parseInt(e.target.value, 10);
    setFontSize(value);
    if (active && active.set && !Number.isNaN(value)) {
      active.set('fontSize', value);
      canvas.renderAll();
    }
  };

  // Mobile: allow swipe to scroll toolbars
  // Canvas area will scroll horizontally on xs screens

  return (
    <div className="p-2 md:p-4 max-w-full md:max-w-screen-lg mx-auto">
      <div className="md:flex gap-4">
        <div className="md:w-64 flex flex-col gap-4">
          {/* Inputs & Actions */}
          <div className="flex flex-col gap-2">
            <input
              placeholder="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="p-2 border rounded w-full"
            />
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-2 border rounded w-full"
            />
            <input
              placeholder="ID Number"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="p-2 border rounded w-full"
            />
          </div>

          {/* Tools/Buttons */}
          <div className="flex flex-wrap md:flex-col items-center gap-2 overflow-x-auto md:overflow-visible py-2">
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
        <button onClick={addRectangle} className="p-2 bg-blue-500 text-white rounded text-xs">Rect</button>
        <button onClick={addCircle} className="p-2 bg-blue-500 text-white rounded text-xs">Circle</button>
        <button onClick={addTriangle} className="p-2 bg-blue-500 text-white rounded text-xs">Tri</button>
        <button onClick={saveTemplate} className="p-2 bg-green-600 text-white rounded text-xs">Save</button>
        <button onClick={exportImage} className="p-2 bg-orange-500 text-white rounded text-xs">Export</button>
        <button onClick={resetCanvas} className="p-2 bg-gray-700 text-white rounded text-xs">Reset</button>
        <button onClick={undo} className="p-2 bg-gray-500 text-white rounded text-xs">Undo</button>
        <button onClick={redo} className="p-2 bg-gray-500 text-white rounded text-xs">Redo</button>
        <button onClick={cloneObject} className="p-2 bg-blue-500 text-white rounded text-xs">Clone</button>
        <button onClick={deleteObject} className="p-2 bg-red-600 text-white rounded text-xs">Del</button>

        <input type="color" value={fillColor} onChange={applyFillColor} className="h-8 w-8 p-0 border rounded-full" />
        <select value={fontFamily} onChange={changeFont} className="p-2 border rounded text-xs">
          <option value="Arial">Arial</option>
          <option value="Courier">Courier</option>
          <option value="Times New Roman">Times</option>
        </select>
        <input
          type="number"
          value={fontSize}
          onChange={changeFontSize}
          className="w-16 border p-1 rounded text-xs"
        />
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
        <button onClick={bringToFront} className="p-2 bg-purple-500 text-white rounded text-xs">Top</button>
        <button onClick={sendToBack} className="p-2 bg-purple-500 text-white rounded text-xs">Bottom</button>
          </div>
        </div>

        <div className="flex-1">
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
      </div>
    </div>
  );
};

export default CanvasEditor;
