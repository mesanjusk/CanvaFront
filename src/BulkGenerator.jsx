import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { fabric } from 'fabric';

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

  useEffect(() => {
    const c = new fabric.Canvas('bulk-canvas', {
      width: custom.width,
      height: custom.height,
      backgroundColor: '#fff',
    });
    canvasRef.current = c;
    setCanvas(c);
    return () => c.dispose();
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
    const s = size === 'A4' ? A4 : size === 'A3' ? A3 : custom;
    canvas.setWidth(s.width);
    canvas.setHeight(s.height);
    canvas.renderAll();
  }, [size, custom, canvas]);

  const loadCurrent = async () => {
    if (!canvas || !selected || !rows[index]) return;
    const { data } = await axios.get(`https://canvaback.onrender.com/api/template/${selected}`);
    const json = fillPlaceholders(data.canvasJson, rows[index]);
    canvas.loadFromJSON(json, () => {
      canvas.renderAll();
    });
  };

  useEffect(() => {
    loadCurrent();
  }, [selected, rows, index, canvas]);

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

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Bulk Generator</h1>

      <div className="flex flex-wrap gap-2 items-center">
        <select value={selected || ''} onChange={e => setSelected(e.target.value)} className="border p-2 rounded">
          <option value="">Select Template</option>
          {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>

        <select value={size} onChange={e => setSize(e.target.value)} className="border p-2 rounded">
          <option value="A4">A4</option>
          <option value="A3">A3</option>
          <option value="custom">Custom</option>
        </select>

        {size === 'custom' && (
          <>
            <input type="number" value={custom.width} onChange={e => setCustom({ ...custom, width: Number(e.target.value) })} className="border p-2 w-24" />
            <input type="number" value={custom.height} onChange={e => setCustom({ ...custom, height: Number(e.target.value) })} className="border p-2 w-24" />
          </>
        )}

        <input type="file" accept=".xlsx,.csv" onChange={handleFile} className="border p-2" />
      </div>

      {rows.length > 0 && (
        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => setIndex(i => Math.max(i - 1, 0))} className="px-2 py-1 bg-gray-200 rounded">Prev</button>
          <span>{index + 1} / {rows.length}</span>
          <button onClick={() => setIndex(i => Math.min(i + 1, rows.length - 1))} className="px-2 py-1 bg-gray-200 rounded">Next</button>
          <button onClick={downloadCurrent} className="px-2 py-1 bg-green-600 text-white rounded">Download</button>
          <button onClick={downloadAll} className="px-2 py-1 bg-blue-600 text-white rounded">Export All</button>
        </div>
      )}

      <div className="mt-4 border inline-block">
        <canvas id="bulk-canvas" />
      </div>
    </div>
  );
};

export default BulkGenerator;
