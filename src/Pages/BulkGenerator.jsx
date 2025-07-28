import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { fabric } from 'fabric';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ZoomControls from '../components/bulk/ZoomControls';
import LeftSidebar from '../components/bulk/LeftSidebar';
import RightSidebar from '../components/bulk/RightSidebar';
import GeneratorFooter from '../components/bulk/GeneratorFooter';
import FloatingObjectToolbar from '../components/FloatingObjectToolbar';
import CanvasEditor from '../components/CanvasEditor';
import PreviewModal from '../components/PreviewModal';
import toast from 'react-hot-toast';

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
  const [activeObj, setActiveObj] = useState(null);
  const [lockedObjects, setLockedObjects] = useState(new Set());
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editorTemplate, setEditorTemplate] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [pagePreviewUrl, setPagePreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);


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

  const loadTemplate = async (tplId) => {
    if (!canvas) return;
    try {
      const { data } = await axios.get(`https://canvaback.onrender.com/api/template/${tplId}`);
      const json = data.canvasJson || data.layout || data;
      await new Promise((resolve) => canvas.loadFromJSON(json, () => {
        canvas.renderAll();
        resolve();
      }));
      setSelected(tplId);
    } catch (e) {
      toast.error('Failed to load template');
    }
  };

  const openEditor = (tpl) => {
    setEditorTemplate(tpl);
    setShowEditor(true);
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

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('https://canvaback.onrender.com/api/template/');
      const data = Array.isArray(res.data) ? res.data : res.data.result || [];
      setTemplates(data.map(t => ({ ...t, id: t._id })));
    } catch {
      setTemplates([]);
    }
  };

  useEffect(() => {
    fetchTemplates();
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

  const generatePreview = async () => {
    if (!selected) {
      setPreviewUrl('');
      setPagePreviewUrl('');
      return;
    }
    try {
      const { data } = await axios.get(`https://canvaback.onrender.com/api/template/${selected}`);
      const json = fillPlaceholders(data.canvasJson || data.layout || data, rows[index] || {});
      const prev = new fabric.StaticCanvas(null, { width: custom.width, height: custom.height, backgroundColor: '#fff' });
      await new Promise(res => prev.loadFromJSON(json, () => { prev.renderAll(); res(); }));
      setPreviewUrl(prev.toDataURL('png'));
      prev.dispose();
    } catch {
      setPreviewUrl('');
    }
  };

  const generatePagePreview = async () => {
    if (!selected) {
      setPagePreviewUrl('');
      return;
    }
    try {
      const { data } = await axios.get(`https://canvaback.onrender.com/api/template/${selected}`);
      const json = data.canvasJson || data.layout || data;
      const base = size === 'A4' ? A4 : size === 'A3' ? A3 : custom;
      const pageSize = orientation === 'landscape'
        ? { width: base.height, height: base.width }
        : base;
      const page = new fabric.StaticCanvas(null, {
        width: pageSize.width,
        height: pageSize.height,
        backgroundColor: '#fff',
      });
      const slots = cols * rowsPerPage;
      const rowSlice = rows.slice(index, index + slots);
      for (let i = 0; i < slots; i++) {
        const row = rowSlice[i] || {};
        const filled = fillPlaceholders(json, row);
        const cell = new fabric.StaticCanvas(null, { width: cardSize.width, height: cardSize.height, backgroundColor: '#fff' });
        await new Promise(r => cell.loadFromJSON(filled, () => { cell.renderAll(); r(); }));
        const dataUrl = cell.toDataURL('png');
        const img = await new Promise(r => fabric.Image.fromURL(dataUrl, (imgEl) => r(imgEl)));
        img.set({
          left: margins.left + (i % cols) * (cardSize.width + spacing.horizontal),
          top: margins.top + Math.floor(i / cols) * (cardSize.height + spacing.vertical),
          selectable: false,
        });
        page.add(img);
        cell.dispose();
      }
      page.renderAll();
      setPagePreviewUrl(page.toDataURL('png'));
      page.dispose();
    } catch {
      setPagePreviewUrl('');
    }
  };

  useEffect(() => {
    generatePreview();
    generatePagePreview();
  }, [selected, index, rows, size, custom, orientation, margins, spacing, cardSize, cols, rowsPerPage]);

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

  const cols = currentLayout.cols;
  const rowsPerPage = currentLayout.rowsPerPage;
  const spacing = currentLayout.spacing;
  const margins = currentLayout.margins;

  const cellW = currentLayout.cardSize.width;
  const cellH = currentLayout.cardSize.height;

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
        <LeftSidebar
          show={showLeft}
          templates={templates}
          selected={selected}
          setSelected={setSelected}
          handleFile={handleFile}
          loadStudents={loadStudents}
          currentLayout={currentLayout}
          applyLayout={applyLayout}
        />

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

        <RightSidebar
          show={showRight}
          templates={templates}
          selectedTemplate={templates.find(t => t.id === selected || t._id === selected)}
          previewUrl={previewUrl}
          pagePreviewUrl={pagePreviewUrl}
          onSelect={(t) => { loadTemplate(t._id); openEditor(t); }}
          onBack={() => setSelected(null)}
        />
      </div>


      {showEditor && editorTemplate && (
        <div className="fixed inset-0 z-40 bg-white overflow-auto">
          <CanvasEditor
            templateId={editorTemplate._id}
            hideHeader
            onSaved={() => { setShowEditor(false); fetchTemplates(); loadTemplate(editorTemplate._id); }}
          />
          <button
            onClick={() => setShowEditor(false)}
            className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded"
          >Close</button>
        </div>
      )}

      {showPreview && (
        <PreviewModal src={pagePreviewUrl} onClose={() => setShowPreview(false)} />
      )}

      <GeneratorFooter
        rows={rows}
        index={index}
        setIndex={setIndex}
        downloadCurrent={downloadCurrent}
        downloadAll={downloadAll}
        downloadLayout={downloadLayout}
        size={size}
        setSize={setSize}
        orientation={orientation}
        setOrientation={setOrientation}
        custom={custom}
        setCustom={setCustom}
        cols={cols}
        setCols={setCols}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        margins={margins}
        setMargins={setMargins}
        spacing={spacing}
        setSpacing={setSpacing}
        cardSize={cardSize}
        setCardSize={setCardSize}
        onPreview={() => setShowPreview(true)}
      />
    </div>
  );
};

export default BulkGenerator;
