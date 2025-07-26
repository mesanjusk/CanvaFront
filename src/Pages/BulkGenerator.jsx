import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { fabric } from 'fabric';
import BASE_URL from '../config';
import SidebarSection from '../components/bulk/SidebarSection';
import ZoomControls from '../components/bulk/ZoomControls';
import PresetControls from '../components/bulk/PresetControls';
import FloatingObjectToolbar from '../components/FloatingObjectToolbar';

const A4 = { width: 2480, height: 3508 };
const A3 = { width: 3508, height: 4961 };

const fillPlaceholders = (json, row) => {
  const data = JSON.parse(JSON.stringify(json));
  if (Array.isArray(data.objects)) {
    data.objects.forEach(obj => {
      if (obj.type === 'i-text' && typeof obj.text === 'string') {
        obj.text = obj.text.replace(/\{\{(.*?)\}\}/g, (_, key) => row[key] || '');
      }
      if (obj.type === 'image' && typeof obj.src === 'string') {
        const match = obj.src.match(/\{\{(.*?)\}\}/);
        if (match) {
          const url = row[match[1]];
          if (url) obj.src = url;
        }
      }
    });
  }
  return data;
};

const BulkGenerator = () => {
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState([]);
  const [index, setIndex] = useState(0);
  const [size, setSize] = useState('A4');
  const [custom, setCustom] = useState({ width: A4.width, height: A4.height });
  const [cols, setCols] = useState(2);
  const [rowsPerPage, setRowsPerPage] = useState(2);
  const [orientation, setOrientation] = useState('portrait');
  const [margins, setMargins] = useState({ left: 0, right: 0, top: 0 });
  const [spacing, setSpacing] = useState({ horizontal: 0, vertical: 0 });
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const [previewZoom, setPreviewZoom] = useState(1);
  const [templateImage, setTemplateImage] = useState('');
  const [activeObj, setActiveObj] = useState(null);
  const [lockedObjects, setLockedObjects] = useState(new Set());
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);


  const currentLayout = {
    size,
    custom,
    orientation,
    cols,
    rowsPerPage,
    margins,
    spacing,
    cardSize,
  };

  const applyLayout = (layout) => {
    setSize(layout.size);
    setCustom(layout.custom);
    setOrientation(layout.orientation);
    setCols(layout.cols);
    setRowsPerPage(layout.rowsPerPage);
    setMargins(layout.margins);
    setSpacing(layout.spacing);
    setCardSize(layout.cardSize);
  };

  useEffect(() => {
    const c = new fabric.Canvas('bulk-canvas', {
      width: custom.width,
      height: custom.height,
      backgroundColor: '#fff',
    });
    canvasRef.current = c;
    setCanvas(c);
    const handleSelect = (e) => setActiveObj(e.selected ? e.selected[0] : e.target);
    const clearSelect = () => setActiveObj(null);
    c.on('selection:created', handleSelect);
    c.on('selection:updated', handleSelect);
    c.on('selection:cleared', clearSelect);
    return () => {
      c.off('selection:created', handleSelect);
      c.off('selection:updated', handleSelect);
      c.off('selection:cleared', clearSelect);
      c.dispose();
    };
  }, []);

  useEffect(() => {
    axios.get('https://canvaback.onrender.com/api/template/')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.result || [];
        setTemplates(data.map(t => ({ ...t, id: t._id })));
      })
      .catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    if (!canvas) return;
    const base = size === 'A4' ? A4 : size === 'A3' ? A3 : custom;
    const s = orientation === 'landscape'
      ? { width: base.height, height: base.width }
      : base;
    canvas.setWidth(s.width);
    canvas.setHeight(s.height);
  }, [canvas, size, custom, orientation]);

 const renderPreview = async () => {
  if (!previewRef.current || !selected || !canvas || rows.length === 0) return;

  const baseSize = size === 'A4' ? A4 : size === 'A3' ? A3 : custom;
  const pageSize = orientation === 'landscape'
    ? { width: baseSize.height, height: baseSize.width }
    : baseSize;

  const canvasEl = previewRef.current;
  const ctx = canvasEl.getContext('2d');

  const baseScale = Math.min(600 / pageSize.width, 800 / pageSize.height, 1);
  const scale = baseScale * previewZoom;

  canvasEl.width = pageSize.width * scale;
  canvasEl.height = pageSize.height * scale;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

  const cellW = cardSize.width || (pageSize.width - margins.left - margins.right - spacing.horizontal * (cols - 1)) / cols;
  const cellH = cardSize.height || (pageSize.height - margins.top - spacing.vertical * (rowsPerPage - 1)) / rowsPerPage;

  const perPage = cols * rowsPerPage;
  const start = 0; // You could paginate later if needed

  const { data } = await axios.get(`https://canvaback.onrender.com/api/template/${selected}`);

  for (let i = 0; i < perPage && start + i < rows.length; i++) {
    const student = rows[start + i];
    const filledJson = fillPlaceholders(data.canvasJson, student);

    await new Promise((resolve) => {
      canvas.loadFromJSON(filledJson, () => {
        canvas.renderAll();

        const imgData = canvas.toDataURL({ format: 'png' });
        const img = new Image();
        img.onload = () => {
          const x = margins.left + (i % cols) * (cellW + spacing.horizontal);
          const y = margins.top + Math.floor(i / cols) * (cellH + spacing.vertical);
          ctx.drawImage(img, x * scale, y * scale, cellW * scale, cellH * scale);
          resolve();
        };
        img.src = imgData;
      });
    });
  }
};

  const loadCurrent = async () => {
    if (!selected) return;
  const { data } = await axios.get(`https://canvaback.onrender.com/api/template/${selected}`);
  setTemplateImage(data.image);
    renderPreview();
  };

 useEffect(() => {
  loadCurrent();
}, [selected]);

useEffect(() => {
  renderPreview();
}, [
  templateImage,
  size,
  custom,
  orientation,
  margins,
  spacing,
  cols,
  rowsPerPage,
  cardSize,
  previewZoom,
  selected,
  rows
]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);
      setRows(json);
      setIndex(0);
    };
    reader.readAsBinaryString(file);
  };

  const loadStudents = async () => {
    try {
      const res = await axios.get(`https://canvaback.onrender.com/api/students`);
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setRows(data);
      setIndex(0);
    } catch (e) {
      console.error('Failed to load students', e);
    }
  };

const drawImageWithText = async (ctx, student, x, y, width, height, imageUrl) => {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous'; // Needed for CORS-safe remote image

    image.src = imageUrl;

    image.onload = () => {
      ctx.drawImage(image, x, y, width, height);

      // Draw text on top
      ctx.fillStyle = '#000';
      ctx.font = '16px Arial';
      ctx.fillText(student.name || '', x + 50, y + 50);

      resolve();
    };

    image.onerror = (err) => {
      console.error("Image load error:", err);
      resolve(); // Continue without crashing
    };
  });
};

  const handleDeleteObject = () => {
    if (!canvas || !activeObj) return;
    canvas.remove(activeObj);
    setActiveObj(null);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  };

  const toggleLock = (obj) => {
    if (!obj) return;
    const locked = lockedObjects.has(obj);
    obj.set({
      selectable: locked,
      evented: locked,
      hasControls: locked,
    });
    const updated = new Set(lockedObjects);
    locked ? updated.delete(obj) : updated.add(obj);
    setLockedObjects(updated);
    canvas?.requestRenderAll();
  };

  const downloadCurrent = () => {
    if (!canvas) return;
    const url = canvas.toDataURL({ format: 'png' });
    const a = document.createElement('a');
    a.href = url;
    a.download = `design_${index + 1}.png`;
    a.click();
  };

  const downloadAll = async () => {
    for (let i = 0; i < rows.length; i++) {
      const { data } = await axios.get(`https://canvaback.onrender.com/api/template/${selected}`);
      const json = fillPlaceholders(data.canvasJson, rows[i]);
      await new Promise(resolve => canvas.loadFromJSON(json, () => {
        canvas.renderAll();
        const url = canvas.toDataURL({ format: 'png' });
        const a = document.createElement('a');
        a.href = url;
        a.download = `design_${i + 1}.png`;
        a.click();
        setTimeout(resolve, 300);
      }));
    }
  };

 const downloadLayout = async (format) => {
  if (!selected || rows.length === 0) return;

  const baseSize = size === 'A4' ? A4 : size === 'A3' ? A3 : custom;
  const pageSize = orientation === 'landscape'
    ? { width: baseSize.height, height: baseSize.width }
    : baseSize;

  const cols = layout.columns;
  const rowsPerPage = layout.rows;
  const spacing = layout.spacing;
  const margins = layout.margins;

  const cellW = layout.cardSize.width;
  const cellH = layout.cardSize.height;

  const totalPages = Math.ceil(rows.length / (cols * rowsPerPage));

  const canvas = document.createElement('canvas');
  canvas.width = pageSize.width;
  canvas.height = pageSize.height;
  const ctx = canvas.getContext('2d');

  const zip = new JSZip();

  // ✅ Get the template background image URL from the selected object
  const imageUrl = selected?.imageUrl;
  if (!imageUrl) {
    console.error('No imageUrl found in selected template.');
    return;
  }

  for (let page = 0; page < totalPages; page++) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const start = page * cols * rowsPerPage;

    for (let r = 0; r < rowsPerPage; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = start + r * cols + c;
        if (idx >= rows.length) break;

        const student = rows[idx];

        const x = margins.left + c * (cellW + spacing.horizontal);
        const y = margins.top + r * (cellH + spacing.vertical);

        // ✅ Draw using template + student data
        await drawImageWithText(ctx, student, x, y, cellW, cellH, imageUrl);
      }
    }

    const dataUrl = canvas.toDataURL('image/png');
    const imgBlob = await (await fetch(dataUrl)).blob();
    zip.file(`page_${page + 1}.png`, imgBlob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'bulk_generated.zip');
};

  const isLocked = activeObj ? lockedObjects.has(activeObj) : false;
  const multipleSelected = canvas ? canvas.getActiveObjects().length > 1 : false;


  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
        <h1 className="text-lg font-semibold">Bulk Generator</h1>
        <div className="md:hidden flex gap-2">
          <button onClick={() => setShowLeft(v => !v)} className="px-2 py-1 bg-gray-700 rounded">Menu</button>
          <button onClick={() => setShowRight(v => !v)} className="px-2 py-1 bg-gray-700 rounded">Data</button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className={`bg-gray-50 w-64 p-4 space-y-4 overflow-y-auto ${showLeft ? 'block' : 'hidden'} md:block`}>
          <SidebarSection title="Template">
            <div className="flex flex-col">
              <label className="text-sm font-medium">Template</label>
              <select
                value={selected || ''}
                onChange={e => setSelected(e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="">Select Template</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </SidebarSection>

          <SidebarSection title="Page Settings">
            <div className="flex flex-col">
              <label className="text-sm font-medium">Page Size</label>
              <select
                value={size}
                onChange={e => setSize(e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Orientation</label>
              <select
                value={orientation}
                onChange={e => setOrientation(e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            {size === 'custom' && (
              <>
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Page Width</label>
                  <input type="number" value={custom.width} onChange={e => setCustom({ ...custom, width: Number(e.target.value) })} className="border p-2 rounded" />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium">Page Height</label>
                  <input type="number" value={custom.height} onChange={e => setCustom({ ...custom, height: Number(e.target.value) })} className="border p-2 rounded" />
                </div>
              </>
            )}
          </SidebarSection>

          <SidebarSection title="Layout">
            <div className="flex flex-col">
              <label className="text-sm font-medium">Columns</label>
              <input
                type="number"
                min={1}
                value={cols}
                onChange={e => setCols(Number(e.target.value) || 1)}
                className="border p-2 rounded"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Rows per Page</label>
              <input
                type="number"
                min={1}
                value={rowsPerPage}
                onChange={e => setRowsPerPage(Number(e.target.value) || 1)}
                className="border p-2 rounded"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Left Margin</label>
              <input type="number" value={margins.left} onChange={e => setMargins({ ...margins, left: Number(e.target.value) })} className="border p-2 rounded" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Right Margin</label>
              <input type="number" value={margins.right} onChange={e => setMargins({ ...margins, right: Number(e.target.value) })} className="border p-2 rounded" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Top Margin</label>
              <input type="number" value={margins.top} onChange={e => setMargins({ ...margins, top: Number(e.target.value) })} className="border p-2 rounded" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Horizontal Spacing</label>
              <input type="number" value={spacing.horizontal} onChange={e => setSpacing({ ...spacing, horizontal: Number(e.target.value) })} className="border p-2 rounded" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Vertical Spacing</label>
              <input type="number" value={spacing.vertical} onChange={e => setSpacing({ ...spacing, vertical: Number(e.target.value) })} className="border p-2 rounded" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Card Width</label>
              <input type="number" value={cardSize.width} onChange={e => setCardSize({ ...cardSize, width: Number(e.target.value) })} className="border p-2 rounded" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Card Height</label>
              <input type="number" value={cardSize.height} onChange={e => setCardSize({ ...cardSize, height: Number(e.target.value) })} className="border p-2 rounded" />
            </div>
          </SidebarSection>

          <SidebarSection title="Data">
            <div className="flex flex-col">
              <label className="text-sm font-medium">Upload File</label>
              <input type="file" accept=".xlsx,.csv" onChange={handleFile} className="border p-2 rounded" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium invisible">Load</label>
              <button onClick={loadStudents} className="bg-blue-600 text-white px-3 py-2 rounded">Load Students</button>
            </div>
          </SidebarSection>

          <PresetControls layout={currentLayout} applyLayout={applyLayout} />
        </aside>

        <main className="flex-1 relative flex items-center justify-center bg-gray-100 overflow-hidden">
          <div className="absolute top-2 right-2">
            <ZoomControls zoom={previewZoom} setZoom={setPreviewZoom} />
          </div>
          <div style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top left' }}>
            <canvas id="bulk-canvas" />
          </div>
          {activeObj && (
            <FloatingObjectToolbar
              activeObj={activeObj}
              cropImage={() => {}}
              handleDelete={handleDeleteObject}
              toggleLock={toggleLock}
              setShowSettings={() => {}}
              fitCanvasToObject={() => {}}
              isLocked={isLocked}
              multipleSelected={multipleSelected}
              groupObjects={() => {}}
              ungroupObjects={() => {}}
              canvas={canvas}
            />
          )}
        </main>

        <aside className={`bg-gray-50 w-64 p-4 overflow-y-auto space-y-2 ${showRight ? 'block' : 'hidden'} md:block`}>
          <h2 className="font-medium">Students</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {rows.map((student, idx) => (
              <div key={idx} className="p-2 bg-white rounded shadow text-center">
                <img
                  src={student.photo?.[0] || 'https://via.placeholder.com/100?text=No+Photo'}
                  alt={`${student.firstName} ${student.lastName}`}
                  className="w-12 h-12 mx-auto rounded-full object-cover mb-1 border"
                />
                <p className="text-xs font-medium truncate">
                  {student.firstName} {student.lastName}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <footer className="p-2 bg-gray-200">
        {rows.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => setIndex(i => Math.max(i - 1, 0))} className="px-2 py-1 bg-gray-200 rounded">Prev</button>
            <span>{index + 1} / {rows.length}</span>
            <button onClick={() => setIndex(i => Math.min(i + 1, rows.length - 1))} className="px-2 py-1 bg-gray-200 rounded">Next</button>
            <button onClick={downloadCurrent} className="px-2 py-1 bg-green-600 text-white rounded">Download</button>
            <button onClick={downloadAll} className="px-2 py-1 bg-blue-600 text-white rounded">Export All</button>
            <button onClick={() => downloadLayout('pdf')} className="px-2 py-1 bg-purple-600 text-white rounded">Layout PDF</button>
            <button onClick={() => downloadLayout('png')} className="px-2 py-1 bg-purple-600 text-white rounded">Layout PNG</button>
            <button onClick={() => downloadLayout('jpg')} className="px-2 py-1 bg-purple-600 text-white rounded">Layout JPG</button>
          </div>
        )}
      </footer>
    </div>
  );
};

export default BulkGenerator;